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

  static del (key) {
    return ['del', key]
  }

  static incr (key, initial, delta, expiry = DEFAULT_EXPIRY) {
    return ['incr', key, initial, delta, expiry]
  }

  static decr (key, initial, delta, expiry = DEFAULT_EXPIRY) {
    return ['decr', key, initial, delta, expiry]
  }

  static quit () {
    const args = ['quit']
    args.silent = true
    return args
  }

  static flush (expiry) {
    return ['flush', expiry]
  }

  static noop () {
    return ['noop']
  }

  static version () {
    return ['version']
  }

  static append (key, value) {
    return ['append', key, value]
  }

  static appends (key, value) {
    const args = ['appends', key, value]
    args.loud = true
    return args
  }

  static appendk (key) {
    return ['append', key]
  }

  static appendks (key) {
    const args = ['appends', key]
    args.loud = true
    return args
  }

  static prepend (key, value) {
    return ['prepend', key, value]
  }

  static prepends (key, value) {
    const args = ['prepends', key, value]
    args.loud = true
    return args
  }

  static prependk (key) {
    return ['prepend', key]
  }

  static prependks (key) {
    const args = ['prepends', key]
    args.loud = true
    return args
  }

  static stat (key) {
    const args = ['stat', key]
    args.seq = true
    return args
  }

  static touch (key, expiry = DEFAULT_EXPIRY) {
    return ['touch', key, expiry]
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

  del (key) {
    return this._net.query(Client.del(key))
  }

  incr (key, initial, delta, expiry) {
    return this._net.query(Client.incr(key, initial, delta, expiry || this._options.expiry))
  }

  decr (key, initial, delta, expiry) {
    return this._net.query(Client.decr(key, initial, delta, expiry || this._options.expiry))
  }

  quit () {
    return this._net.query(Client.quit())
  }

  flush (expiry) {
    return this._net.query(Client.flush(expiry))
  }

  noop () {
    return this._net.query(Client.noop())
  }

  version () {
    return this._net.query(Client.version())
  }

  append (key, value) {
    return this._net.query(Client.append(key, value))
  }

  appends (key, value) {
    return this._net.query(Client.appends(key, value))
  }

  appendk (key) {
    return this._net.query(Client.appendk(key))
  }

  appendks (key) {
    return this._net.query(Client.appendks(key))
  }

  prepend (key, value) {
    return this._net.query(Client.prepend(key, value))
  }

  prepends (key, value) {
    return this._net.query(Client.prepends(key, value))
  }

  prependk (key) {
    return this._net.query(Client.prependk(key))
  }

  prependks (key) {
    return this._net.query(Client.prependks(key))
  }

  stat (key) {
    return this._net.query(Client.stat(key))
  }

  touch (key, expiry) {
    return this._net.query(Client.touch(key, expiry || this._options.expiry))
  }

  stream () {
    return this._net.query()
  }

  end () {
    this._net.end()
  }
}

module.exports = Client
