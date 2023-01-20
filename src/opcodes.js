'use strict'

// Opcodes:
//   https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#command-opcodes
module.exports = {
  get: 0x00,
  set: 0x01,
  add: 0x02,
  replace: 0x03,
  delete: 0x04,
  increment: 0x05,
  decrement: 0x06,
  flush: 0x08,
  noop: 0x0a,
  getk: 0x0c,
  getkq: 0x0d,
  stat: 0x10,
  setq: 0x11,
  addq: 0x12,
  sasl_list: 0x20,
  sasl_auth: 0x21
}
