'use strict'

const Net = require('../src/net')

describe('Net', () => {
  it('opaque', () => {
    // init
    expect(Net._opaque).toBe(0)

    // increment
    expect(Net.opaque()).toBe(1)
    expect(Net._opaque).toBe(1)

    // increment max
    Net._opaque = 0x7fffffff
    expect(Net.opaque()).toBe(0)
    expect(Net._opaque).toBe(0)

    // increment max - 1
    Net._opaque = (0x7fffffff - 1)
    expect(Net.opaque()).toBe(0x7fffffff)
    expect(Net._opaque).toBe(0x7fffffff)

    // increment max + 1
    Net._opaque = (0x7fffffff + 1)
    expect(Net.opaque()).toBe(1)
    expect(Net._opaque).toBe(1)
  })
})
