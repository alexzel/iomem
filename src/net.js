'use strict'

const { Transform, PassThrough } = require('node:stream')

const HashRing = require('hashring')

const Server = require('./server')
const protocol = require('./protocol')
const { buildPacket, parsePacket, parseHeader, HEADER_LENGTH, REQUEST_MAGIC, RESPONSE_MAGIC } = require('./packet')
const { STATUS_MESSAGE_MAP, STATUS_MESSAGE_UNKOWN, STATUS_SUCCESS, STATUS_NOT_FOUND } = require('./statuses')

const HASHRING_ALGORITHM = 'md5'
const HASHRING_COMPATIBILITY = 'ketama'

const DEFAULT_ADDRESS = `${Server.DEFAULT_HOSTNAME}:${Server.DEFAULT_PORT}`

class NetStream extends Transform {
  constructor (options = {}) {
    const { getKeysByServer, config = {}, ...opts } = options
    super({ objectMode: true, ...opts })
    this.getKeysByServer = getKeysByServer
    this.config = config
  }

  _try (data, cb) {
    const [method, key, ...args] = data
    const multikey = Array.isArray(key) // if so, we return array, otherwise value or null
    const multimethod = Array.isArray(method) // if so, the method equals to method[Number(key index === n - 1)]
    const opaque = args[args.length - 1]
    const keysByServer = this.getKeysByServer(multikey ? key : [key])
    const buffer = []

    let serversHit = 0
    let keysMisses = 0
    keysByServer.forEach((keys, server) => {
      // build request packet
      let packet = Buffer.alloc(0)
      let counter = 0
      let lastKey
      keys.forEach(key =>
        (packet = Buffer.concat([packet, buildPacket(REQUEST_MAGIC, ...protocol[multimethod ? method[Number(keys.size === ++counter && !!(lastKey = key))] : method](key, ...args))])))

      // get socket from server
      const sock = server.getSocket()

      // we use pass through therefore we don't listen to the original socket and
      // easily unpipe it so pass through will stop receiving events from the socket
      // and will be destroyed once we call the callback and escape this scope
      const pass = sock.pipe(new PassThrough({ objectMode: true }))

      const timeout = setTimeout(() => {
        sock.unpipe(pass)
        cb(new Error(`iomem: request timeout (${this.config.timeout})`))
      }, this.config.timeout) // maybe use connectionTimeout when sock.readyState === 'opening' || sock.readyState === 'closed'?

      const done = (err, data) => {
        clearTimeout(timeout)
        sock.unpipe(pass)
        cb(err, data)
      }

      // socket data
      let chunks = Buffer.alloc(0)
      pass.on('data', chunk => {
        chunks = Buffer.concat([chunks, chunk])
        let error
        while (chunks.length >= HEADER_LENGTH && !error) {
          const header = parseHeader(chunks.slice(0, HEADER_LENGTH))
          if (header[0] !== RESPONSE_MAGIC) { // wrong magic
            chunks = Buffer.alloc(0)
          }
          const packetSize = header[5] + HEADER_LENGTH
          if (chunks.length >= packetSize) { // check packet size
            const packet = parsePacket(chunks.slice(0, packetSize), header)
            if (packet && packet[packet.length - 1] === opaque) { // check packet and opaque
              serversHit += Number(packet[2] === lastKey)
              if (packet[5] === STATUS_SUCCESS) { // success
                buffer.push(protocol[method].format ? protocol[method].format(packet) : null)
              } else if (packet[5] !== STATUS_NOT_FOUND) { // error
                error = new Error(`iomem: response error: ${STATUS_MESSAGE_MAP[packet[5]] || `${STATUS_MESSAGE_UNKOWN} (${packet[5]})`}`)
              } else {
                keysMisses++
              }
            }
            chunks = chunks.slice(packetSize)
          } else {
            chunks = Buffer.alloc(0)
          }
        }
        if (error) {
          done(error)
        } else if ((multimethod && serversHit === keysByServer.size) || (buffer.length + keysMisses) >= keys.size) {
          done(null, multikey ? buffer : buffer[0])
        }
      })

      // socket end
      pass.on('end', () => {
        done(new Error('iomem: socket closed unexpectedly'))
      })

      // socket error
      pass.on('error', done)

      // send request packet to socket
      sock.write(packet)
    })
    if (!keysByServer.size) {
      cb()
    }
  }

  _transform (data, _, cb) {
    const retry = (retries, ms) => {
      this._try(data, (err, data) => {
        if (err && retries > 0) {
          setTimeout(() => {
            retry(retries - 1, ms * this.config.retriesFactor)
          }, ms)
        } else {
          cb(err, data)
        }
      })
    }
    retry(this.config.retries, this.config.retriesDelay)
  }
}

class Net {
  constructor (servers = [DEFAULT_ADDRESS], options = {}) {
    this._options = options
    this._servers = new Map()

    servers.forEach(address => {
      const server = new Server(address, this._options.maxConnections, this._options.connectionTimeout)
      this._servers.set(server.hostname, server)
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

  query (args = []) {
    const net = new NetStream({
      getKeysByServer: this.getKeysByServer,
      config: this._options
    })

    let pass
    if (args[0]) { // TODO: now it checks only for method... this will not create a stream for get() and how to deal with flush, stat, etc.. remove Case #2?
      pass = new PassThrough({ objectMode: true })
      pass.pipe(net)
    }

    if (this._options.stream || !args[0]) {
      pass && pass.write(args)
      return net
    }

    pass && pass.end(args)
    return new Promise((resolve, reject) => {
      net.on('data', resolve)
      net.on('end', () => resolve(net.read()))
      net.on('error', reject)
    })
  }

  end () {
    this._servers.forEach(server => server.end())
  }
}

module.exports = Net
