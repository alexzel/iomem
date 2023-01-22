'use strict'

const HEADER_LENGTH = 24

const REQUEST_MAGIC = 0x80
const RESPONSE_MAGIC = 0x81

const DEFAULT_KEY = ''
const DEFAULT_VALUE = Buffer.alloc(0)
const DEFAULT_EXTRAS = Buffer.alloc(0)
const DEFAULT_OPAQUE = 0x00
const DEFAULT_CAS = BigInt(0x00)
const DEFAULT_DATA_TYPE = 0x00 // Reserved for future use https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#data-types
const DEFAULT_STATUS = 0x00

// Request header:
//  https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#request-header
// Response header:
//  https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#response-header
//
// The only difference between the header structures is
//  vbucket id and Status
//
// so we call it just status
//
// Byte/     0       |       1       |       2       |       3       |
//    /              |               |               |               |
//   |0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|
//   +---------------+---------------+---------------+---------------+
//  0| Magic         | Opcode        | Key length                    |
//   +---------------+---------------+---------------+---------------+
//  4| Extras length | Data type     | vbucket id                    |
//   +---------------+---------------+---------------+---------------+
//  8| Total body length                                             |
//   +---------------+---------------+---------------+---------------+
// 12| Opaque                                                        |
//   +---------------+---------------+---------------+---------------+
// 16| CAS                                                           |
//   |                                                               |
//   +---------------+---------------+---------------+---------------+
//   Total 24 bytes

const buildHeader = (magic, opcode, keyLength, valueLength, extrasLength, status, cas, opaque) => {
  const header = Buffer.alloc(24)

  // 0
  header.writeUInt8(magic, 0)
  header.writeUInt8(opcode, 1)
  header.writeUInt16BE(keyLength, 2)

  // 4
  header.writeUInt8(extrasLength, 4)
  header.writeUInt8(DEFAULT_DATA_TYPE, 5)
  header.writeUInt16BE(status, 6)

  // 8
  header.writeUInt32BE(keyLength + valueLength + extrasLength, 8)

  // 12
  header.writeUInt32BE(opaque, 12)

  // 16
  header.writeBigInt64BE(cas, 16)

  return header
}

const parseHeader = header =>
  [
    header.readUInt8(0),        // magic
    header.readUInt8(1),        // opcode
    header.readUInt16BE(2),     // key length
    header.readUInt8(4),        // extras length
    header.readUInt16BE(6),     // status
    header.readUInt32BE(8),     // total body length
    header.readBigUint64BE(16), // cas
    header.readUInt32BE(12)     // opaque
  ]

// Packet:
//  https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#packet-structure
//
// Byte/     0       |       1       |       2       |       3       |
//    /              |               |               |               |
//   |0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|
//   +---------------+---------------+---------------+---------------+
//  0/ HEADER                                                        /
//   /                                                               /
//   /                                                               /
//   /                                                               /
//   +---------------+---------------+---------------+---------------+
// 24/ COMMAND-SPECIFIC EXTRAS (as needed)                           /
//  +/  (note length in the extras length header field)              /
//   +---------------+---------------+---------------+---------------+
//  m/ Key (as needed)                                               /
//  +/  (note length in key length header field)                     /
//   +---------------+---------------+---------------+---------------+
//  n/ Value (as needed)                                             /
//  +/  (note length is total body length header field, minus        /
//  +/   sum of the extras and key length body fields)               /
//   +---------------+---------------+---------------+---------------+
//   Total 24 bytes

const buildPacket = (magic, opcode, key = DEFAULT_KEY, value = DEFAULT_VALUE, extras = DEFAULT_EXTRAS, status = DEFAULT_STATUS, cas = DEFAULT_CAS, opaque = DEFAULT_OPAQUE) => {
  key = Buffer.from(key)
  return Buffer.concat([
    // 0
    buildHeader(magic, opcode, key.length, value.length, extras.length, status, cas, opaque),
    // 24
    extras, key, value
  ])
}

const parsePacket = (packet, header = null) => {
  if (!packet || packet.length < HEADER_LENGTH) {
    return null
  }

  const [magic, opcode, keyLength, extrasLength, status, totalBodyLength, cas, opaque] =
    header || parseHeader(packet.slice(0, HEADER_LENGTH))

  if (magic !== REQUEST_MAGIC && magic !== RESPONSE_MAGIC) {
    return null
  }

  if (packet.length !== HEADER_LENGTH + totalBodyLength) {
    return null
  }

  const valueLength = totalBodyLength - keyLength - extrasLength
  if (valueLength < 0) {
    return null
  }

  const keyOffset = HEADER_LENGTH + extrasLength
  const valueOffset = keyOffset + keyLength

  return [
    magic,  // magic
    opcode, // opcode
    packet.slice(keyOffset, valueOffset).toString('utf8'), // key
    packet.slice(valueOffset, valueOffset + valueLength), // value
    packet.slice(HEADER_LENGTH, keyOffset), // extras
    status, // status or vbucket id
    cas,    // cas
    opaque  // opaque
  ]
}

module.exports = {
  buildPacket,
  parsePacket,
  buildHeader,
  parseHeader,
  HEADER_LENGTH,
  REQUEST_MAGIC,
  RESPONSE_MAGIC,
  DEFAULT_KEY,
  DEFAULT_VALUE,
  DEFAULT_EXTRAS,
  DEFAULT_OPAQUE,
  DEFAULT_CAS,
  DEFAULT_DATA_TYPE,
  DEFAULT_STATUS
}
