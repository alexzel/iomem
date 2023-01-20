'use strict'

const { DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS } = require('./packet')
const OPCODES = require('./opcodes')

// Commands:
//   https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#commands

// GET
const get = (key, opaque) =>
  [OPCODES.get, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, opaque]

const getk = (key, opaque) =>
  [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, opaque]

const getkq = (key, opaque) =>
  [OPCODES.getkq, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, opaque]

// SET
const set = (key, value, expiry = 0, flags = 0, opaque) => {
  const extras = Buffer.alloc(8)
  extras.writeUInt32BE(flags, 0)
  extras.writeUInt32BE(expiry, 4)

  return [OPCODES.set, key, value, extras, DEFAULT_STATUS, opaque]
}

// DEL
const del = (key, opaque) =>
  [OPCODES.delete, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, opaque]

module.exports = {
  get,
  getk,
  getkq,
  set,
  del
}
