'use strict'

const { DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, DEFAULT_OPAQUE } = require('./packet')
const { OPCODES } = require('./opcodes')
const { STATUS_SUCCESS } = require('./statuses')
const { serialize, deserialize } = require('./serializer')

// Commands:
//   https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#commands

// add, set, replace mutations
const mutation = (opcode, key, value, expiry = 0, cas = DEFAULT_CAS, opaque = DEFAULT_OPAQUE) => {
  const [buffer, flags] = serialize(value)
  const extras = Buffer.alloc(8)
  extras.writeUInt32BE(flags, 0)
  extras.writeUInt32BE(expiry, 4)
  return [opcode, key, buffer, extras, DEFAULT_STATUS, cas, opaque]
}

// increment and decrement
const counter = (opcode, key, initial, delta, expiry = 0, opaque = DEFAULT_OPAQUE) => {
  const extras = Buffer.alloc(12)
  extras.writeUInt32BE(delta, 0)
  extras.writeUInt32BE(initial, 4)
  extras.writeUInt32BE(expiry, 8)
  return [opcode, key, DEFAULT_VALUE, extras, DEFAULT_STATUS, cas, opaque]
}

// flush, touch, gat
const expiring = (opcode, key, expiry, opaque = DEFAULT_OPAQUE) => {
  let extras = DEFAULT_EXTRAS
  if (expiry !== undefined) {
    extras = Buffer.alloc(4)
    extras.writeUInt32BE(expiry, 0)
  }
  return [opcode, key, DEFAULT_VALUE, extras, DEFAULT_STATUS, DEFAULT_CAS, opaque]
}

// get or multi get with value or [value, ...] response
const get = function (key, opaque) {
  return [OPCODES.get, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]
}
get.format = packet =>
  packet[3].length ? deserialize(packet[3], packet[4].readUInt32BE(0)) : null

// get or multi get with { key: value } or { key: value, ... } response
const getk = function (key, opaque) {
  return [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]
}
// TODO: accept buffer that we can extend when it's an object and somehow let it know to be object by default or maybe null and formatter handles it
getk.format = packet =>
  packet[3].length ? { [packet[2]]: deserialize(packet[3], packet[4].readUInt32BE(0)) } : null

// get or multi get with { key: cas } or { key: cas, ... } response
const gets = (key, opaque) =>
  [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]
gets.format = packet =>
  packet[3].length ? { [packet[2]]: packet[6] } : null

// get or multi get with { key: { value, cas } } or { key: { value, cas }, ... } response
const getsv = (key, opaque) =>
  [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]
getsv.format = packet =>
  packet[3].length ? { [packet[2]]: { value: deserialize(packet[3], packet[4].readUInt32BE(0)), cas: packet[6] } } : null

// set or multi set with key, value or [key, ...], [value, ...] pairs
const set = function (key, value, expiry, opaque) {
  return mutation(OPCODES.set, key, value, expiry, DEFAULT_CAS, opaque)
}
set.format = packet =>
  packet[5] === STATUS_SUCCESS

// set or multi set with { key: value } or { key: value, ...} objects
const setk = (key, expiry, opaque) =>
  mutation(OPCODES.set, key, DEFAULT_VALUE, expiry, DEFAULT_CAS, opaque)
setk.format = packet =>
  packet[5] === STATUS_SUCCESS

const add = (key, value, expiry, opaque) =>
  mutation(OPCODES.add, key, value, expiry, expiry, DEFAULT_CAS, opaque)
add.format = packet =>
  packet[5] === STATUS_SUCCESS

const replace = (key, value, expiry, opaque) =>
  mutation(OPCODES.replace, key, value, expiry, DEFAULT_CAS, opaque)
replace.format = packet =>
  packet[5] === STATUS_SUCCESS

const cas = (key, value, expiry, cas, opaque) =>
  mutation(OPCODES.set, key, value, expiry, cas, opaque)
cas.format = packet =>
  packet[5] === STATUS_SUCCESS

const del = (key, opaque) =>
  [OPCODES.delete, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const incr = (key, initial, delta, expiry, opaque) =>
  counter(OPCODES.increment, key, initial, delta, expiry, opaque)

const decr = (key, initial, delta, expiry, opaque) =>
  counter(OPCODES.decrement, key, initial, delta, expiry, opaque)

const quit = (opaque) =>
  [OPCODES.quit, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const flush = (expiry, opaque) =>
  expiring(OPCODES.flush, DEFAULT_KEY, expiry, opaque)

const append = (key, value, opaque) =>
  [OPCODES.append, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const prepend = (key, value, opaque) =>
  [OPCODES.prepend, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const gat = (key, expiry, opaque) =>
  expiring(OPCODES.gat, key, expiry, opaque)

const touch = (key, expiry, opaque) =>
  expiring(OPCODES.touch, key, expiry, opaque)

const stat = (key, opaque) =>
  [OPCODES.stat, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const noop = (opaque) =>
  [OPCODES.noop, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const version = (opaque) =>
  [OPCODES.version, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]

const saslauth = (key, value) =>
  [OPCODES.saslauth, key, value, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, DEFAULT_OPAQUE]

module.exports = {
  get,
  getk,
  gets,
  getsv,
  set,
  setk,
  add,
  replace,
  cas,
  del,
  incr,
  decr,
  quit,
  flush,
  append,
  prepend,
  gat,
  touch,
  stat,
  noop,
  version,
  saslauth
}
