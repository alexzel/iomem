'use strict'

// Opcodes:
//   https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#command-opcodes
const OPCODES = {
  // Opcodes having a quiet version
  get: 0x00,
  getk: 0x0c,
  set: 0x01,
  add: 0x02,
  replace: 0x03,
  delete: 0x04,
  increment: 0x05,
  decrement: 0x06,
  quit: 0x07,
  flush: 0x08,
  append: 0x0e,
  prepend: 0x0f,
  gat: 0x1d,

  // Quiet version of the above opcodes
  getq: 0x09,
  getkq: 0x0d,
  setq: 0x11,
  addq: 0x12,
  replaceq: 0x13,
  deleteq: 0x14,
  incrementq: 0x15,
  decrementq: 0x16,
  quitq: 0x17,
  flushq: 0x18,
  appendq: 0x19,
  prependq: 0x1a,
  gatq: 0x1e,

  // Opcodes not having a quiet equivalent
  stat: 0x10,
  noop: 0x0a,
  version: 0x0b,
  touch: 0x1c,

  // SASL:
  //  https://github.com/memcached/memcached/wiki/SASLHowto
  //  https://github.com/memcached/memcached/wiki/SASLAuthProtocol
  //  https://en.wikipedia.org/wiki/Simple_Authentication_and_Security_Layer
  saslauth: 0x21
}

// Opcodes to quiet version opcodes map
/* eslint-disable no-multi-spaces */
const OPCODES_QUIET_MAP = new Map([
  [OPCODES.get,       OPCODES.getq],
  [OPCODES.getk,      OPCODES.getkq],
  [OPCODES.set,       OPCODES.setq],
  [OPCODES.add,       OPCODES.addq],
  [OPCODES.replace,   OPCODES.replaceq],
  [OPCODES.delete,    OPCODES.deleteq],
  [OPCODES.increment, OPCODES.incrementq],
  [OPCODES.decrement, OPCODES.decrementq],
  [OPCODES.quit,      OPCODES.quitq],
  [OPCODES.flush,     OPCODES.flushq],
  [OPCODES.append,    OPCODES.appendq],
  [OPCODES.prepend,   OPCODES.prependq],
  [OPCODES.gat,       OPCODES.gatq]
])

module.exports = {
  OPCODES,
  getQuietOpcode: opcode => OPCODES_QUIET_MAP.get(opcode),
  getQuietOpcodeByName: name => OPCODES_QUIET_MAP.get(OPCODES[name])
}
