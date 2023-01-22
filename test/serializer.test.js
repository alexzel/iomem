'use strict'

const { serialize, deserialize } = require('../src/serializer')
const FLAGS = require('../src/flags')

/* eslint-disable no-new-wrappers */
describe('serializer', () => {
  it('serializes and deserializes string', () => {
    const value = 'abc'
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.string).toBeTruthy()
  })

  it('serializes and deserializes String', () => {
    const value = new String('abc')
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toStrictEqual(value)
    expect(flags & FLAGS.String).toBeTruthy()
  })

  it('serializes and deserializes BigInt', () => {
    const value = 2n ** 64n - 1n
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.bigint).toBeTruthy()
  })

  it('serializes and deserializes Buffer', () => {
    const value = Buffer.from('abc')
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.Buffer).toBeTruthy()
  })

  it('serializes and deserializes Date', () => {
    const value = new Date()
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toStrictEqual(value)
    expect(flags & FLAGS.Date).toBeTruthy()
  })

  it('serializes and deserializes integer', () => {
    const value = 1
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.object).toBeTruthy()
  })

  it('serializes and deserializes float', () => {
    const value = 3.14
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.object).toBeTruthy()
  })

  it('serializes and deserializes boolean', () => {
    const value = true
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.object).toBeTruthy()
  })

  it('serializes and deserializes array', () => {
    const value = [1, 2, 'a', 'b']
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toStrictEqual(value)
    expect(flags & FLAGS.object).toBeTruthy()
  })

  it('serializes and deserializes null', () => {
    const value = null
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toBe(value)
    expect(flags & FLAGS.object).toBeTruthy()
  })

  it('serializes and deserializes Object', () => {
    const value = {
      int: 1,
      float: 3.14,
      bigint: 1000n,
      bool: true,
      nul: null,
      str: 'test',
      Str: new String('abc'),
      date: new Date(),
      buff: Buffer.from('abc'),
      arr: [1, 2, 'a', 'b', new Date()]
    }
    const [buffer, flags] = serialize(value)
    expect(deserialize(buffer, flags)).toStrictEqual(value)
    expect(flags & FLAGS.object).toBeTruthy()
  })
})
