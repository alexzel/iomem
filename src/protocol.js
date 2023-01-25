'use strict'

const { DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, DEFAULT_OPAQUE } = require('./packet')
const { OPCODES } = require('./opcodes')
const { serialize, deserialize } = require('./serializer')

// Commands:
//   https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#commands

// add, set, replace
const setter = (opcode, key, value, expiry = 0, cas = DEFAULT_CAS, opaque = DEFAULT_OPAQUE) => {
  const [buffer, flags] = serialize(value)
  const extras = Buffer.alloc(8)
  extras.writeUInt32BE(flags, 0)
  extras.writeUInt32BE(expiry, 4)
  return [opcode, key, buffer, extras, DEFAULT_STATUS, cas, opaque]
}

const midifier = (opcode, key, value, opaque = DEFAULT_OPAQUE) => {
  const [buffer] = serialize(value)
  return [opcode, key, buffer, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque]
}

// increment and decrement
const counter = (opcode, key, initial, delta, expiry = 0, opaque = DEFAULT_OPAQUE) => {
  const extras = Buffer.alloc(20)
  extras.writeBigInt64BE(delta, 0)
  extras.writeBigInt64BE(initial, 8)
  extras.writeUInt32BE(expiry, 16)
  return [opcode, key, DEFAULT_VALUE, extras, DEFAULT_STATUS, DEFAULT_CAS, opaque]
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
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : keysStat.misses ? null : buffer[Object.keys(buffer)[0]],
  true
)

// get or multi get with { key: { value, cas } } or { key: { value, cas }, ... } response
const getsv = createMethod(
  (key, opaque) => [OPCODES.getk, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => (buffer[packet[2]] = { value: deserialize(packet[3], packet[4].readUInt32BE(0)), cas: packet[6] }),
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : keysStat.misses ? null : buffer[Object.keys(buffer)[0]],
  true
)

// set or multi set with key, value or [key, ...], [value, ...] pairs
const set = createMethod(
  (key, value, expiry, opaque) => setter(OPCODES.set, key, value, expiry, DEFAULT_CAS, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const add = createMethod(
  (key, value, expiry, opaque) => setter(OPCODES.add, key, value, expiry, DEFAULT_CAS, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const replace = createMethod(
  (key, value, expiry, opaque) => setter(OPCODES.replace, key, value, expiry, DEFAULT_CAS, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const cas = createMethod(
  (key, value, expiry, cas, opaque) => setter(OPCODES.set, key, value, expiry, cas, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const del = createMethod(
  (key, opaque) => [OPCODES.delete, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const incr = createMethod(
  (key, initial, delta, expiry, opaque) => counter(OPCODES.increment, key, initial, delta, expiry, opaque),
  (packet, buffer) => buffer.push(packet[3].readBigInt64BE(0)),
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : (buffer[0] || null)
)

const decr = createMethod(
  (key, initial, delta, expiry, opaque) => counter(OPCODES.decrement, key, initial, delta, expiry, opaque),
  (packet, buffer) => buffer.push(packet[3].readBigInt64BE(0)),
  (keyFlags, buffer, keysStat) => keyFlags.isArray ? buffer : (buffer[0] || null)
)

const quit = () =>
  [OPCODES.quit, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, DEFAULT_OPAQUE]

const flush = (expiry, opaque) =>
  expiring(OPCODES.flush, DEFAULT_KEY, expiry, opaque)

const noop = createMethod(
  (_, opaque) => [OPCODES.noop, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  null,
  () => true
)

const version = createMethod(
  (_, opaque) => [OPCODES.version, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => buffer.push(packet[3].toString()),
  (keyFlags, buffer) => (buffer[0] || null)
)

const append = createMethod(
  (key, value, opaque) => midifier(OPCODES.append, key, value, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const appends = createMethod(
  (key, value, opaque) => midifier(OPCODES.append, key, value, opaque),
  (packet, buffer) => buffer.push(packet[6]),
  (keyFlags, buffer, keysStat) => keyFlags.isMultikey ? buffer : keysStat.misses ? null : buffer[0]
)

const prepend = createMethod(
  (key, value, opaque) => midifier(OPCODES.prepend, key, value, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses && !keysStat.exists
)

const prepends = createMethod(
  (key, value, opaque) => midifier(OPCODES.prepend, key, value, opaque),
  (packet, buffer) => buffer.push(packet[6]),
  (keyFlags, buffer, keysStat) => keyFlags.isMultikey ? buffer : keysStat.misses ? null : buffer[0]
)

const stat = createMethod(
  (key, opaque) => [OPCODES.stat, key, DEFAULT_VALUE, DEFAULT_EXTRAS, DEFAULT_STATUS, DEFAULT_CAS, opaque],
  (packet, buffer) => packet[2] && (buffer[packet[2]] = packet[3].toString()),
  (keyFlags, buffer, keysStat) => buffer,
  true
)

const touch = createMethod(
  (key, expiry, opaque) => expiring(OPCODES.touch, key, expiry, opaque),
  null,
  (keyFlags, buffer, keysStat) => !keysStat.misses
)

const gat = createMethod(
  (key, expiry, opaque) => expiring(OPCODES.gat, key, expiry, opaque),
  (packet, buffer) => buffer.push(deserialize(packet[3], packet[4].readUInt32BE(0))),
  (keyFlags, buffer) => keyFlags.isArray ? buffer : (buffer[0] || null)
)

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
  noop,
  version,
  append,
  appends,
  prepend,
  prepends,
  stat,
  gat,
  touch,
  saslauth
}
