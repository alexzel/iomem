'use strict'

const { Transform, PassThrough } = require('node:stream')

const HashRing = require('hashring')

const Server = require('./server')
const protocol = require('./protocol')
const { getQuietOpcodeByName } = require('./opcodes')
const { buildPacket, parsePacket, parseHeader, HEADER_LENGTH, REQUEST_MAGIC, RESPONSE_MAGIC } = require('./packet')
const { STATUS_MESSAGE_MAP, STATUS_MESSAGE_UNKOWN, STATUS_SUCCESS, STATUS_NOT_FOUND, STATUS_NOT_STORED, STATUS_EXISTS } = require('./statuses')
const { getKeyFlags } = require('./keys')

const HASHRING_ALGORITHM = 'md5'
const HASHRING_COMPATIBILITY = 'ketama'

const DEFAULT_ADDRESS = `${Server.DEFAULT_HOSTNAME}:${Server.DEFAULT_PORT}`

class NetCleanup {
  constructor () {
    this._cleaners = new Set()
  }

  clean () {
    this._cleaners.forEach(fn => {
      if (!fn.done) {
        fn.done = true
        fn()
      }
    })
  }

  add (fn) {
    this._cleaners.add(fn)
  }
}

class NetStream extends Transform {
  constructor (options = {}) {
    const {
      getKeysSetByServer,
      getKeysMapByServer,
      getKeysSetByAllServers,
      serverFailure,
      config = {},
      ...opts
    } = options
    super({ objectMode: true, ...opts })
    this.getKeysSetByServer = getKeysSetByServer
    this.getKeysMapByServer = getKeysMapByServer
    this.getKeysSetByAllServers = getKeysSetByAllServers
    this.serverFailure = serverFailure
    this.config = config
  }

  _try (data, cb) {
    const [method, key, ...args] = data
    const keyFlags = getKeyFlags(key)
    const quietOpcode = getQuietOpcodeByName(method)
    const keysByServer = keyFlags.isEmpty
      ? this.getKeysSetByAllServers(key)
      : keyFlags.isObject
        ? this.getKeysMapByServer(key)
        : this.getKeysSetByServer(keyFlags.isArray ? key : [key])

    const buffer = protocol[method].bykeys ? {} : []

    let serversHit = 0 // server got hit when we received a response with the last opaque sent to the server
    const keysStat = { length: 0, exists: 0, misses: 0 }
    const cleanup = new NetCleanup()
    keysByServer.forEach((keys, server) => {
      const opaques = new Set()
      let lastOpaque
      let packet = Buffer.alloc(0)

      // process keys
      let counter = 0
      keys.forEach((value, key) => {
        lastOpaque = Net.opaque()
        opaques.add(lastOpaque)
        const params = keyFlags.isObject
          ? protocol[method](key, value, ...args, lastOpaque)
          : protocol[method](key, ...args, lastOpaque)
        if (keyFlags.isMultikey && quietOpcode && !data.loud && keys.size !== ++counter) {
          params[0] = quietOpcode
        }
        packet = Buffer.concat([packet, buildPacket(REQUEST_MAGIC, ...params)])
        keysStat.length++
      })

      // get socket from server
      const sock = server.getSocket()

      // we use pass through therefore we don't listen to the original socket and
      // easily unpipe it so pass through will stop receiving events from the socket
      // and will be destroyed once we call the callback and escape this scope
      const pass = new PassThrough({ objectMode: true })

      const timeout = setTimeout(() => {
        cleanup.clean()
        this.serverFailure(server)
        cb(new Error(`iomem: request timeout (${this.config.timeout})`))
      }, this.config.timeout) // maybe use connectionTimeout when sock.readyState === 'opening' || sock.readyState === 'closed'?

      const done = (err, data) => {
        cleanup.clean()
        cb(err, data)
      }

      cleanup.add(() => {
        clearTimeout(timeout)
        sock.unpipe(pass)
      })

      sock.pipe(pass)

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
            const opaque = header[header.length - 1]
            if (opaques.has(opaque)) {
              const packet = parsePacket(chunks.slice(0, packetSize), header)
              serversHit += Number(opaque === lastOpaque && (!data.seq || !(packet[2] && packet[3])))
              if (packet[5] === STATUS_SUCCESS) { // success
                if (protocol[method].format) {
                  protocol[method].format(packet, buffer, server)
                }
              } else if (packet[5] === STATUS_EXISTS) { // exists
                keysStat.exists++
              } else if (packet[5] === STATUS_NOT_FOUND || packet[5] === STATUS_NOT_STORED) { // not found
                keysStat.misses++
              } else {
                error = new Error(`iomem: response error: ${STATUS_MESSAGE_MAP[packet[5]] || `${STATUS_MESSAGE_UNKOWN} (${packet[5]})`}`)
              }
            }
            chunks = chunks.slice(packetSize)
          } else {
            chunks = Buffer.alloc(0)
          }
        }
        if (error) {
          done(error)
        } else if (serversHit === keysByServer.size) {
          done(null, protocol[method].result ? protocol[method].result(keyFlags, buffer, keysStat) : null)
        }
      })

      // socket end
      pass.on('end', () => {
        done(data.silent ? null : new Error('iomem: socket closed unexpectedly'))
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
  static _opaque = 0

  static opaque () {
    Net._opaque = (Net._opaque + 1) & 0xffffffff
    return Net._opaque
  }

  constructor (servers = [DEFAULT_ADDRESS], options = {}) {
    this._options = options
    this._servers = new Map()
    this._opaque = 0

    if (!Array.isArray(servers)) {
      servers = [servers]
    }

    servers.forEach(address => {
      const server = new Server(address, this._options.maxConnections, this._options.connectionTimeout, this._options.keepAliveInitialDelay)
      this._servers.set(server.hostname, server)
    })

    this._failovers = this._options.failoverServers.map(address =>
      new Server(address, this._options.maxConnections, this._options.connectionTimeout, this._options.keepAliveInitialDelay))

    this._ring = new HashRing([...this._servers.keys()], HASHRING_ALGORITHM, {
      compatibility: HASHRING_COMPATIBILITY,
      'default port': Server.DEFAULT_PORT
    })
  }

  getKeysSetByServer = keys => {
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

  getKeysMapByServer = keys => {
    let server
    const map = new Map()
    for (const key in keys) {
      server = this._servers.length === 1
        ? this._servers.values().next().value
        : this._servers.get(this._ring.get(key))
      if (map.has(server)) {
        map.get(server).set(key, keys[key])
      } else {
        map.set(server, new Map([[key, keys[key]]]))
      }
    }
    return map
  }

  getKeysSetByAllServers = key => {
    const map = new Map()
    this._servers.forEach(server => map.set(server, new Set([key])))
    return map
  }

  serverFailure = server => {
    // all the below makes sense only when we have some failover servers
    if (this._failovers.length) {
      // server is already failed, so do nothing
      if (server.isFailed()) {
        return
      }

      // server has failed, but we still hope it's alive
      if (server.fail() < this._options.maxFailures) {
        return
      }

      // take a server from failovers and push failed server to the end
      const failover = this._failovers.shift()
      this._failovers.push(server)

      // don't forget to revive the server in case it previously failed
      failover.revive()

      // add failover server into servers map
      this._servers.set(failover.hostname, failover)
      this._ring.swap(server.hostname, failover.hostname)

      // end failed server
      server.end()
    }
  }

  query (args = []) {
    const net = new NetStream({
      getKeysSetByServer: this.getKeysSetByServer,
      getKeysMapByServer: this.getKeysMapByServer,
      getKeysSetByAllServers: this.getKeysSetByAllServers,
      serverFailure: this.serverFailure,
      config: this._options
    })

    let pass
    if (args[0]) {
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
