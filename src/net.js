'use strict'

const { Transform, PassThrough } = require('node:stream')

const HashRing = require('hashring')
const Server = require('./server')

const protocol = require('./protocol')
const { buildPacket, parsePacket, parseHeader, HEADER_LENGTH, REQUEST_MAGIC, RESPONSE_MAGIC } = require('./packet')

const HASHRING_ALGORITHM = 'md5'
const HASHRING_COMPATIBILITY = 'ketama'

const DEFAULT_ADDRESS = `${Server.DEFAULT_HOSTNAME}:${Server.DEFAULT_PORT}`

class NetStream extends Transform {
  constructor (options = {}) {
    const { getKeysByServer, ...opts } = options
    super({ objectMode: true, ...opts })
    this.getKeysByServer = getKeysByServer
  }

  _transform (data, _, cb) {
    const [method, key, ...args] = data
    const multikey = Array.isArray(key)
    const opaque = args[args.length - 1]
    const keysByServer = this.getKeysByServer(multikey ? key : [key])

    const buffer = []
    keysByServer.forEach((keys, server) => {
      // build request packet
      let packet = Buffer.alloc(0)
      keys.forEach(key =>
        (packet = Buffer.concat([packet, buildPacket(REQUEST_MAGIC, ...protocol[method](key, ...args))])))

      // get socket from server
      const sock = server.getSocket()

      // we use pass through therefore we don't listen to the original socket and
      // easily unpipe it so pass through will stop receiving events from the socket
      // and will be destroyed once we call the callback and escape this scope
      const pass = sock.pipe(new PassThrough({ objectMode: true }))

      const timeout = setTimeout(() => {
        sock.unpipe(pass)
        cb(new Error(`iomem: request timeout (${1000})`))
      }, 1000)

      const done = (err, data) => {
        clearTimeout(timeout)
        sock.unpipe(pass)
        cb(err, data)
      }

      // socket data
      let chunks = Buffer.alloc(0)
      pass.on('data', chunk => {
        chunks = Buffer.concat([chunks, chunk])
        while (chunks.length >= HEADER_LENGTH) {
          const header = parseHeader(chunks.slice(0, HEADER_LENGTH))
          if (header[0] !== RESPONSE_MAGIC) { // wrong magic
            chunks = Buffer.alloc(0)
          }
          const packetSize = header[5] + HEADER_LENGTH
          if (chunks.length >= packetSize) { // check packet size
            const packet = parsePacket(chunks.slice(0, packetSize), header)
            // TODO: check status
            if (packet && packet[6] === opaque) { // check packet and opaque
              buffer.push(packet)
            }
            chunks = chunks.slice(packetSize)
          } else {
            chunks = Buffer.alloc(0)
          }
        }
        if (buffer.length >= keysByServer.size) { // this will not work for multi-get with getkq and getk
          done(null, multikey ? buffer : buffer[0])
        }
      })

      // socket disconnected
      pass.on('end', () => {
        console.log('>>>>end')
        done()
        // console.log('???????end', d, sock.read())
        // this.push(sock.read())
        // counter++
      }) // TODO: check opaque and have timeout

      // socket error
      pass.on('error', done)

      // send request packet to socket
      sock.write(packet)
    })
    if (!keysByServer.size) {
      cb()
    }
  }
}

class Net {
  constructor (servers = [DEFAULT_ADDRESS], options = {}) {
    this._options = options

    this._servers = new Map()
    // this._sockets =

    servers.forEach(address => {
      const server = new Server(address)
      this._servers.set(server.hostname, new Server(address))
    })

    this._ring = new HashRing([...this._servers.keys()], HASHRING_ALGORITHM, {
      compatibility: HASHRING_COMPATIBILITY,
      'default port': Server.DEFAULT_PORT
    })
  }

  getKeysByServer = keys => {
    let server
    return keys.reduce((map, key) => {
      server = this._servers.length === 1
        ? this._servers.values().next().value
        : this._servers.get(this._ring.get(key))
      if (map.has(server)) {
        map.get(server).add(key)
      } else {
        map.set(server, new Set([key]))
      }
      return map
    }, new Map())
  }

  query (method, key, ...args) {
    const net = new NetStream({
      getKeysByServer: this.getKeysByServer
    })

    if (method && key) {
      const pass = new PassThrough({ objectMode: true })
      pass.pipe(net)
      pass.end([method, key, ...args])
    }

    if (this._options.stream) {
      return net
    }

    return new Promise((resolve, reject) => {
      net.on('data', resolve)
      net.on('end', () => resolve(net.read()))
      net.on('error', reject)
    })
  }
}

module.exports = Net
