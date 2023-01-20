'use strict'

const Net = require('./net')

const DEFAULT_OPTIONS = {
  stream: false, // set true to use streams instead of promises
  expiry: 60 * 60 * 24 * 1, // 1 day, time interval in seconds
  maxConnection: 10, // max connections per server
  connectionTimeout: 1000, // connection timeout
  timeout: 500, // request timeout
  retries: 2 // request retries
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
    return this.query('get', key)
  }

  del (key) {
    return this.query('del', key)
  }

  query (...args) {
    this._opaque++
    this._opaque = this._opaque % 0xffffffff
    return this._net.query(...args, this._opaque)
  }
}

module.exports = Client
