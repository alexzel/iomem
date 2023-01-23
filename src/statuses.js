'use strict'

// Response statuses:
//   https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#response-status
// SASL response statuses:
//   https://github.com/memcached/memcached/wiki/SASLAuthProtocol#error-reference
const STATUS_MESSAGE_MAP = {
  0x0000: 'No error',
  0x0001: 'Key not found',
  0x0002: 'Key exists',
  0x0003: 'Value too large',
  0x0004: 'Invalid arguments',
  0x0005: 'Item not stored',
  0x0006: 'Incr/Decr on non-numeric value.',
  0x0007: 'The vbucket belongs to another server',
  0x0008: 'Authentication error',
  0x0009: 'Authentication continue',
  0x0020: 'Authentication required',
  0x0021: 'Further authentication steps required',
  0x0081: 'Unknown command',
  0x0082: 'Out of memory',
  0x0083: 'Not supported',
  0x0084: 'Internal error',
  0x0085: 'Busy',
  0x0086: 'Temporary failure'
}

const STATUS_MESSAGE_UNKOWN = 'Unknown response error'

const STATUS_SUCCESS = 0x0000
const STATUS_NOT_FOUND = 0x0001
const STATUS_EXISTS = 0x0002

module.exports = {
  STATUS_MESSAGE_MAP,
  STATUS_MESSAGE_UNKOWN,
  STATUS_SUCCESS,
  STATUS_NOT_FOUND,
  STATUS_EXISTS
}
