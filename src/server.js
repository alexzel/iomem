'use strict'

const net = require('node:net')
const protocol = require('./protocol')
const { buildPacket, REQUEST_MAGIC } = require('./packet')

class Server {
  // Static constants
  static DEFAULT_HOSTNAME = '127.0.0.1'
  static DEFAULT_PORT = 11211

  // Server address formats:
  //  - username:password@host:port
  //  - host:port
  //  - /path/to/memcached.sock
  constructor (address, maxSockets, timeout) {
    // TODO: move maxSockets to options on prev layers and validate it to be >= 1

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
    this._socketIndex = -1
    this._maxSockets = maxSockets
    this._timeout = timeout * 1000
  }

  createSocket (index) {
    const sock = this.ipc
      ? net.createConnection(this.host)
      : net.createConnection(this.port, this.host)

    sock.on('error', () => {
      this.destroySocket(sock.index)
    })
    sock.on('timeout', () => {
      sock.end()
      this.destroySocket(sock.index)
    })
    sock.on('end', () => {
      this.destroySocket(sock.index)
    })
    sock.setTimeout(this._timeout)
    sock.index = index === undefined
      ? ++this._socketIndex
      : index
    this._sockets.push(sock)
    this.username && this.password &&
      sock.write(buildPacket(REQUEST_MAGIC, ...protocol.saslauth('PLAIN', `\x00${this.username}\x00${this.password}`)))
    return sock
  }

  destroySocket (index) {
    if (this._sockets[index]) {
      this._sockets[index].removeAllListeners()
      this._sockets[index].destroy()
      delete this._sockets[index]
    }
  }

  getSocket () {
    // create a new socket and return
    if (this._sockets.length < this._maxSockets) {
      return this.createSocket()
    }
    // pick the next socket in the sockets ring
    this._socketIndex = (this._socketIndex + 1) % this._maxSockets
    if (!this._sockets[this._socketIndex]) { // recreate when destroyed
      this._sockets[this._socketIndex] = this.createSocket(this._socketIndex)
    }
    return this._sockets[this._socketIndex]
  }

  end () {
    this._sockets.forEach(sock => sock.end())
    this._sockets = []
    this._socketIndex = -1
  }
}

module.exports = Server
