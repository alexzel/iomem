'use strict'

const net = require('node:net')
const protocol = require('./protocol')
const { buildPacket, REQUEST_MAGIC } = require('./packet')

class Server {
  // Static constants
  static DEFAULT_HOSTNAME = '127.0.0.1'
  static DEFAULT_PORT = 11211

  // Server address formats:
  //  - [username:password@]host[:port]
  //  - /path/to/memcached.sock
  constructor (address, maxSockets, timeout, keepAliveInitialDelay) {
    let [auth, hostname] = address.split('@')
    if (!hostname) {
      hostname = auth || Server.DEFAULT_HOSTNAME
      auth = ''
    }

    const ipc = hostname.startsWith('/') // unix socket
    const [username, password] = auth.split(':')
    const [host, port] = hostname.split(':')

    Object.assign(this, {
      hostname,
      username,
      password,
      host,
      port: Number(port || Server.DEFAULT_PORT),
      ipc
    })

    this._sockets = []
    this._socketsPool = new Set()
    this._socketIndex = -1
    this._maxSockets = maxSockets
    this._timeout = timeout
    this._keepAliveInitialDelay = keepAliveInitialDelay

    this.revive()
  }

  createSocket (index) {
    const sock = this.ipc
      ? net.createConnection(this.host)
      : net.createConnection(this.port, this.host)
    sock.on('error', () => {
      this.destroySocket(sock.index)
    })
    sock.on('timeout', () => {
      if (sock.readyState !== 'open') {
        sock.end()
        this.destroySocket(sock.index)
      }
    })
    sock.once('connect', () => {
      sock.setTimeout(0)
    })
    sock.on('end', () => {
      this.destroySocket(sock.index)
    })

    const pipe = sock.pipe.bind(sock)
    const unpipe = sock.unpipe.bind(sock)
    sock.pipe = (dest, opts) => {
      sock.workers++
      this._socketsPool.delete(sock.index)
      return pipe(dest, opts)
    }
    sock.unpipe = (dest) => {
      sock.workers = Math.max(sock.workers - 1, 0)
      if (!sock.workers) {
        this._socketsPool.add(sock.index)
      }
      return unpipe(dest)
    }

    sock.setTimeout(this._timeout)
    sock.setKeepAlive(true, this._keepAliveInitialDelay)
    sock.setNoDelay(true)
    sock.setMaxListeners(0)
    sock.workers = 0
    sock.index = index === undefined
      ? ++this._socketIndex
      : index
    this._sockets.push(sock)
    this.username && this.password &&
      sock.write(buildPacket(REQUEST_MAGIC, ...protocol.saslauth('PLAIN', Buffer.from(`\x00${this.username}\x00${this.password}`))))
    return sock
  }

  destroySocket (index) {
    if (this._sockets[index]) {
      this._sockets[index].removeAllListeners()
      this._sockets[index].destroy()
      delete this._sockets[index]
    }
    this._socketsPool.delete(index)
  }

  getSocketByIndex (index) {
    if (!this._sockets[index]) { // recreate when destroyed
      this._sockets[index] = this.createSocket(index)
    }
    return this._sockets[index]
  }

  getSocket () {
    // take free socket from sockets pool
    if (this._socketsPool.size > 0) {
      return this.getSocketByIndex(this._socketsPool.values().next().value)
    }

    // otherwise create new socket if not reached max sockets count
    if (this._sockets.length < this._maxSockets) {
      return this.createSocket()
    }

    // pick the next socket in the sockets ring
    this._socketIndex = (this._socketIndex + 1) % this._maxSockets
    return this.getSocketByIndex(this._socketIndex)
  }

  isFailed () {
    return this._failed
  }

  fail () {
    return ++this._failures
  }

  revive () {
    this._failures = 0
    this._failed = false
  }

  end () {
    this._sockets.map(sock => this.destroySocket(sock.index))
    this._sockets = []
    this._socketsPool = new Set()
    this._socketIndex = -1
  }
}

module.exports = Server
