'use strict'

const Net = require('./net')

const DEFAULT_OPTIONS = {
  stream: false, // set true to use streams instead of promises
  expiry: 60 * 60 * 24 * 1, // 1 day, time interval in seconds
  maxConnections: 10, // max connections per server
  connectionTimeout: 1000, // connection timeout
  timeout: 500, // request timeout
  retries: 2, // request retries - max retries
  retriesDelay: 100, // request retries - initial delay
  retriesFactor: 2 // request retries - exponential factor
}

class Client {
  constructor (servers, options = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options }
    this._net = new Net(servers, this._options)
    this._opaque = 0
  }

  set (key, value, expiry) {
    return this.query('set', key, value, expiry || this._options.expiry, 0)
  }

  get (key) {
    return this.query(Array.isArray(key) ? ['getkq', 'getk'] : 'get', key)
  }

  del (key) {
    return this.query('del', key)
  }

  query (...args) {
    this._opaque = ++this._opaque % 0xffffffff
    return this._net.query(...args, this._opaque)
  }

  end () {
    this._net.end()
  }
}

module.exports = Client
