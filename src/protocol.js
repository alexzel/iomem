'use strict'

const { DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, DEFAULT_OPAQUE } = require('./packet')
const { OPCODES } = require('./opcodes')
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

// creates protocol method function and extend it with format(), result(), and bykeys flag
const createMethod = (method, format, result, bykeys = false) => {
  method.format = format
  method.result = result
  method.bykeys = bykeys
  return method
}

// get or multi get with value or [value, ...] response
const get = createMethod(
  (key, opaque) => [OPCODES.get, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => buffer.push(deserialize(packet[3], packet[4].readUInt32BE(0))),
  (keyFlags, buffer) => keyFlags.isArray ? buffer : (buffer[0] || null)
)

// get or multi get with { key: value } or { key: value, ... } response
const getk = createMethod(
  (key, opaque) => [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => (buffer[packet[2]] = deserialize(packet[3], packet[4].readUInt32BE(0))),
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : keysStat.misses ? null : buffer,
  true
)

// get or multi get with { key: cas } or { key: cas, ... } response
const gets = createMethod(
  (key, opaque) => [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => (buffer[packet[2]] = packet[6]),
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : keysStat.misses ? null : buffer,
  true
)

// get or multi get with { key: { value, cas } } or { key: { value, cas }, ... } response
const getsv = createMethod(
  (key, opaque) => [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => (buffer[packet[2]] = { value: deserialize(packet[3], packet[4].readUInt32BE(0)), cas: packet[6] }),
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : keysStat.misses ? null : buffer,
  true
)

// set or multi set with key, value or [key, ...], [value, ...] pairs
const set = createMethod(
  (key, value, expiry, opaque) => mutation(OPCODES.set, key, value, expiry, DEFAULT_CAS, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const add = createMethod(
  (key, value, expiry, opaque) => mutation(OPCODES.add, key, value, expiry, DEFAULT_CAS, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const replace = createMethod(
  (key, value, expiry, opaque) => mutation(OPCODES.replace, key, value, expiry, DEFAULT_CAS, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const cas = createMethod(
  (key, value, expiry, cas, opaque) => mutation(OPCODES.set, key, value, expiry, cas, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const del = createMethod(
  (key, opaque) => [OPCODES.delete, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

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
