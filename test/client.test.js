'use strict'

const Mem = require('../src/client')
// new Mem(['memcached:test@127.0.0.1:11211'], { stream: false })

describe('client', () => {
  jest.setTimeout(20000)
  let iomem

  beforeAll(() => {
    iomem = new Mem(['memcached:test@localhost'], {
      connectionTimeout: 500,
      timeout: 1000
    })
  })

  beforeEach(async () => {
    await iomem.flush()
  })

  afterAll(() => {
    iomem.end()
  })

  describe('get', () => {
    it('responds null when key is not set', async () => {
      expect(await iomem.get('test:foo')).toBe(null)
    })

    it('responds with empty array when multi keys are not set', async () => {
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual([])
    })

    it('responds with value when set', async () => {
      await iomem.set('test:foo', 'bar')
      expect(await iomem.get('test:foo')).toBe('bar')
    })

    it('responds with array when multi keys set', async () => {
      await iomem.set('test:foo', 'bar')
      await iomem.set('test:baz', 'qux')
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['bar', 'qux'])
    })
  })

  describe('getk', () => {
    it('responds null when key is not set', async () => {
      expect(await iomem.getk('test:nothing')).toBe(null)
    })
    it('responds with `key => value` when set', async () => {
      await iomem.set('test:foo', 'bar')
      expect(await iomem.getk('test:foo')).toStrictEqual({ 'test:foo': 'bar' })
    })
  })

  describe('set', () => {
    it('sets new value', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo', 'a')).toBe('a')
    })
  })
})
