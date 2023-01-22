'use strict'

const { buildPacket, parsePacket, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS } = require('../src/packet')

describe('packet', () => {
  it('builds and parses packet with key, value, and extras', () => {
    const packet = buildPacket(0x81, 0x01, 'testkey', Buffer.from('testvalue'), Buffer.from([1, 2, 3]), 0x02, BigInt(0x03), 0x04)

    const data = parsePacket(packet)
    expect(data).toBeTruthy()

    const [magic, opcode, key, value, extras, status, cas, opaque] = data
    expect(magic).toBe(0x81)
    expect(opcode).toBe(0x01)
    expect(key).toBe('testkey')
    expect(value).toStrictEqual(Buffer.from('testvalue'))
    expect(extras).toStrictEqual(Buffer.from([1, 2, 3]))
    expect(status).toBe(0x02)
    expect(cas).toBe(BigInt(0x03))
    expect(opaque).toBe(0x04)
  })

  it('builds and parses packet without key, value, and extras', () => {
    const packet = buildPacket(0x81, 0x01, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, 0x02, BigInt(0x03), 0x04)

    const data = parsePacket(packet)
    expect(data).toBeTruthy()

    const [magic, opcode, key, value, extras, status, cas, opaque] = data
    expect(magic).toBe(0x81)
    expect(opcode).toBe(0x01)
    expect(key).toBe(DEFAULT_KEY)
    expect(value).toStrictEqual(DEFAULT_VALUE)
    expect(extras).toStrictEqual(DEFAULT_EXTRAS)
    expect(status).toBe(0x02)
    expect(cas).toBe(BigInt(0x03))
    expect(opaque).toBe(0x04)
  })

  it('returns null when parsing incorrect packet size', () => {
    const data = parsePacket(Buffer.from([0x81, 0x01]))
    expect(data).toBe(null)
  })

  it('returns null when parsing packet with incorrect magic', () => {
    const packet = buildPacket(0x82, 0x01, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, 0x02, BigInt(0x03), 0x04)
    const data = parsePacket(packet)
    expect(data).toBe(null)
  })

  it('returns null when parsing packet with incorrect body size', () => {
    let packet = buildPacket(0x81, 0x01, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, 0x02, BigInt(0x03), 0x04)
    packet = Buffer.concat([packet, Buffer.from([0x00])])
    const data = parsePacket(packet)
    expect(data).toBe(null)
  })

  it('returns null when parsing packet with corrupted extras length', () => {
    const packet = buildPacket(0x81, 0x01, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, 0x02, BigInt(0x03), 0x04)
    packet.writeUInt8(1, 4)
    const data = parsePacket(packet)
    expect(data).toBe(null)
  })

  it('returns null when parsing packet with corrupted key length', () => {
    const packet = buildPacket(0x81, 0x01, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, 0x02, BigInt(0x03), 0x04)
    packet.writeUInt16BE(1, 2)
    const data = parsePacket(packet)
    expect(data).toBe(null)
  })

  it('returns null when parsing packet with corrupted total body length ', () => {
    const packet = buildPacket(0x81, 0x01, DEFAULT_KEY, DEFAULT_VALUE, DEFAULT_EXTRAS, 0x02, BigInt(0x03), 0x04)
    packet.writeUInt32BE(1, 8)
    const data = parsePacket(packet)
    expect(data).toBe(null)
  })
})
