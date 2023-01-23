'use strict'

const Net = require('./net')

const DEFAULT_EXPIRY = 60 * 60 * 24 * 1 // 1 day

const DEFAULT_OPTIONS = {
  stream: false, // set true to use streams instead of promises
  expiry: DEFAULT_EXPIRY, // the time interval in seconds
  maxConnections: 10, // max connections per server
  connectionTimeout: 1000, // connection timeout in milliseconds
  timeout: 500, // request timeout in milliseconds
  retries: 2, // request retries - max retries
  retriesDelay: 100, // request retries - initial delay
  retriesFactor: 2 // request retries - exponential factor
}

class Client {
  constructor (servers, options = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options }
    this._net = new Net(servers, this._options)
  }

  static get (key) {
    return ['get', key]
  }

  static getk (key) {
    return ['getk', key]
  }

  static gets (key) {
    return ['gets', key]
  }

  static getsv (key) {
    return ['getsv', key]
  }

  static set (key, value, expiry = DEFAULT_EXPIRY) {
    return ['set', key, value, expiry]
  }

  static setk (key, expiry = DEFAULT_EXPIRY) {
    return ['set', key, expiry]
  }

  static add (key, value, expiry = DEFAULT_EXPIRY) {
    return ['add', key, value, expiry]
  }

  static addk (key, expiry = DEFAULT_EXPIRY) {
    return ['add', key, expiry]
  }

  static replace (key, value, expiry = DEFAULT_EXPIRY) {
    return ['replace', key, value, expiry]
  }

  static replacek (key, expiry = DEFAULT_EXPIRY) {
    return ['replace', key, expiry]
  }

  static cas (key, value, cas, expiry = DEFAULT_EXPIRY) {
    return ['cas', key, value, expiry, cas]
  }

  static cask (key, cas, expiry = DEFAULT_EXPIRY) {
    return ['cas', key, expiry, cas]
  }

  static del (key) {
    return ['del', key]
  }

  static flush (expiry) {
    return ['flush', expiry]
  }

  get (key) {
    return this._net.query(Client.get(key))
  }

  getk (key) {
    return this._net.query(Client.getk(key))
  }

  gets (key) {
    return this._net.query(Client.gets(key))
  }

  getsv (key) {
    return this._net.query(Client.getsv(key))
  }

  set (key, value, expiry) {
    return this._net.query(Client.set(key, value, expiry || this._options.expiry))
  }

  setk (key, expiry) {
    return this._net.query(Client.setk(key, expiry || this._options.expiry))
  }

  add (key, value, expiry) {
    return this._net.query(Client.add(key, value, expiry || this._options.expiry))
  }

  addk (key, expiry) {
    return this._net.query(Client.addk(key, expiry || this._options.expiry))
  }

  replace (key, value, expiry) {
    return this._net.query(Client.replace(key, value, expiry || this._options.expiry))
  }

  replacek (key, expiry) {
    return this._net.query(Client.replacek(key, expiry || this._options.expiry))
  }

  cas (key, value, cas, expiry) {
    return this._net.query(Client.cas(key, value, cas, expiry || this._options.expiry))
  }

  cask (key, cas, expiry) {
    return this._net.query(Client.cask(key, cas, expiry || this._options.expiry))
  }

  del (key) {
    return this._net.query(Client.del(key))
  }

  flush (expiry) {
    return this._net.query(Client.flush(expiry))
  }

  stream () {
    return this._net.query()
  }

  end () {
    this._net.end()
  }
}

module.exports = Client
