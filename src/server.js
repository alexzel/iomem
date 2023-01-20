'use strict'

const net = require('node:net')

class Server {
  // Static constants
  static DEFAULT_HOSTNAME = '127.0.0.1'
  static DEFAULT_PORT = 11211

  // Server address formats:
  //  username:password@host:port
  //  host:port
  //  /path/to/memcached.sock
  constructor (address, maxSockets = 10) {
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
    this._busySockets = 0
    this._maxSockets = maxSockets
  }

  getSocket () {
    // create a new socket and return
    if (this._sockets.length < this._maxSockets) {
      const sock = this.ipc
        ? net.createConnection(this.host) // TODO: use params instead of two calls
        : net.createConnection(this.port, this.host)
      // TODO: remove sock on error and decrease this._socketIndex
      this._socketIndex++
      this._sockets.push(sock)
      return sock
    }
    // pick the next socket in a ring
    this._socketIndex = (this._socketIndex + 1) % this._maxSockets
    return this._sockets[this._socketIndex] // TODO: check for existence before return?
  }
}

module.exports = Server
