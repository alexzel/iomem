'use strict'

const Mem = require('../src/client')

describe('client', () => {
  jest.setTimeout(20000)
  let iomem

  beforeAll(() => {
    iomem = new Mem(['memcached:test@127.0.0.1'], {
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

    it('responds with empty object when multi keys are not set', async () => {
      expect(await iomem.getk(['test:foo', 'test:baz'])).toStrictEqual({})
    })

    it('responds with `key => value` when set', async () => {
      await iomem.set('test:foo', 'bar')
      expect(await iomem.getk('test:foo')).toStrictEqual({ 'test:foo': 'bar' })
    })

    it('responds with `key => value` when multi keys set', async () => {
      await iomem.set('test:foo', 'bar')
      await iomem.set('test:baz', 'qux')
      expect(await iomem.getk(['test:foo', 'test:baz'])).toStrictEqual({ 'test:foo': 'bar', 'test:baz': 'qux' })
    })
  })

  describe('gets', () => {
    it('responds null when key is not set', async () => {
      expect(await iomem.gets('test:nothing')).toBe(null)
    })

    it('responds with empty object when multi keys are not set', async () => {
      expect(await iomem.gets(['test:foo', 'test:baz'])).toStrictEqual({})
    })

    it('responds with `key => cas` when set', async () => {
      await iomem.set('test:foo', 'bar')
      const obj = await iomem.gets('test:foo')
      expect(obj).toHaveProperty('test:foo')
      expect(typeof obj['test:foo']).toBe('bigint')
      expect(Object.keys(obj).length).toBe(1)
    })

    it('responds with `key => cas, ...` when multi keys set', async () => {
      await iomem.set('test:foo', 'bar')
      await iomem.set('test:baz', 'qux')
      const obj = await iomem.gets(['test:foo', 'test:baz'])
      expect(obj).toHaveProperty('test:foo')
      expect(obj).toHaveProperty('test:baz')
      expect(typeof obj['test:foo']).toBe('bigint')
      expect(typeof obj['test:baz']).toBe('bigint')
      expect(Object.keys(obj).length).toBe(2)
    })
  })

  describe('getsv', () => {
    it('responds null when key is not set', async () => {
      expect(await iomem.getsv('test:nothing')).toBe(null)
    })

    it('responds with empty object when multi keys are not set', async () => {
      expect(await iomem.getsv(['test:foo', 'test:baz'])).toStrictEqual({})
    })

    it('responds with `key => { value, cas }` when set', async () => {
      await iomem.set('test:foo', 'bar')
      const obj = await iomem.getsv('test:foo')
      expect(obj).toHaveProperty('test:foo')
      expect(obj['test:foo']).toHaveProperty('value')
      expect(obj['test:foo']).toHaveProperty('cas')
      expect(obj['test:foo'].value).toBe('bar')
      expect(typeof obj['test:foo'].cas).toBe('bigint')
      expect(Object.keys(obj).length).toBe(1)
    })

    it('responds with `key => { value, cas }, ...` when multi keys set', async () => {
      await iomem.set('test:foo', 'bar')
      await iomem.set('test:baz', 'qux')
      const obj = await iomem.getsv(['test:foo', 'test:baz'])
      expect(obj).toHaveProperty('test:foo')
      expect(obj).toHaveProperty('test:baz')
      expect(obj['test:foo']).toHaveProperty('value')
      expect(obj['test:foo']).toHaveProperty('cas')
      expect(obj['test:baz']).toHaveProperty('value')
      expect(obj['test:baz']).toHaveProperty('cas')
      expect(obj['test:foo'].value).toBe('bar')
      expect(obj['test:baz'].value).toBe('qux')
      expect(typeof obj['test:foo'].cas).toBe('bigint')
      expect(typeof obj['test:baz'].cas).toBe('bigint')
      expect(Object.keys(obj).length).toBe(2)
    })
  })

  describe('set', () => {
    it('sets new value', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('sets new values when multi key', async () => {
      expect(await iomem.set(['test:foo', 'test:baz'], 'a')).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'a'])
    })
  })

  describe('setk', () => {
    it('sets new value', async () => {
      expect(await iomem.setk({ 'test:foo': 'a' })).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('sets new values when multi key', async () => {
      expect(await iomem.setk({ 'test:foo': 'a', 'test:baz': 'b' })).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'b'])
    })
  })

  describe('add', () => {
    it('adds new value', async () => {
      expect(await iomem.add('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('fails when adding a key that is already set', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.add('test:foo', 'b')).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('adds new values when multi key', async () => {
      expect(await iomem.add(['test:foo', 'test:baz'], 'a')).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'a'])
    })

    it('fails adding multi keys that are already set', async () => {
      expect(await iomem.set('test:foo', 'bar')).toBeTruthy()
      expect(await iomem.set('test:baz', 'qux')).toBeTruthy()
      expect(await iomem.add(['test:foo', 'test:baz'], 'a')).toBeFalsy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['bar', 'qux'])
    })
  })

  describe('addk', () => {
    it('adds new value', async () => {
      expect(await iomem.addk({ 'test:foo': 'a' })).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('fails when adding a key that is already set', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.addk({ 'test:foo': 'b' })).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('adds new values when multi key', async () => {
      expect(await iomem.addk({ 'test:foo': 'a', 'test:baz': 'b' })).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'b'])
    })

    it('fails when adding keys that is already set with multi key', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.set('test:baz', 'b')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.get('test:baz')).toBe('b')
      expect(await iomem.addk({ 'test:foo': 'a1', 'test:baz': 'b1' })).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.get('test:baz')).toBe('b')
    })

    it('fails when adding a key that is already set with multi key and the first key is unset (but adds the unset key)', async () => {
      expect(await iomem.set('test:baz', 'b')).toBeTruthy()
      expect(await iomem.get('test:baz')).toBe('b')
      expect(await iomem.addk({ 'test:foo': 'a1', 'test:baz': 'b1' })).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('a1')
      expect(await iomem.get('test:baz')).toBe('b')
    })

    it('fails when adding a key that is already set with multi key and the second key is unset (but adds the unset key)', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.addk({ 'test:foo': 'a1', 'test:baz': 'b1' })).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.get('test:baz')).toBe('b1')
    })
  })

  describe('replace', () => {
    it('replaces with new value', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.replace('test:foo', 'b')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('b')
    })

    it('fails replacing a key that does not exist', async () => {
      expect(await iomem.replace('test:foo', 'b')).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe(null)
    })

    it('replaces with new value when multi key', async () => {
      expect(await iomem.set('test:foo', 'bar')).toBeTruthy()
      expect(await iomem.set('test:baz', 'qux')).toBeTruthy()
      expect(await iomem.replace(['test:foo', 'test:baz'], 'a')).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'a'])
    })

    it('fails replacing multi keys that does not exist', async () => {
      expect(await iomem.replace(['test:foo', 'test:baz'], 'a')).toBeFalsy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual([])
    })
  })

  describe('replacek', () => {
    it('replaces with new value', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.replacek({ 'test:foo': 'b' })).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('b')
    })

    it('fails replacing a key that does not exist', async () => {
      expect(await iomem.replacek({ 'test:foo': 'b' })).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe(null)
    })

    it('replaces with new value when multi key', async () => {
      expect(await iomem.setk({ 'test:foo': 'bar', 'test:baz': 'qux' })).toBeTruthy()
      expect(await iomem.replacek({ 'test:foo': 'a', 'test:baz': 'b' })).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'b'])
    })

    it('fails replacing multi keys that does not exist', async () => {
      expect(await iomem.replacek({ 'test:foo': 'a', 'test:baz': 'b' })).toBeFalsy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual([])
    })

    it('fails replacing multi keys when the first key exist (but replacing the existing key)', async () => {
      expect(await iomem.set('test:foo', 'bar')).toBeTruthy()
      expect(await iomem.replacek({ 'test:foo': 'a', 'test:baz': 'b' })).toBeFalsy()
      expect(await iomem.getk(['test:foo', 'test:baz'])).toStrictEqual({ 'test:foo': 'a' })
    })

    it('fails replacing multi keys when the second key exist (but replacing the existing key)', async () => {
      expect(await iomem.set('test:baz', 'qux')).toBeTruthy()
      expect(await iomem.replacek({ 'test:foo': 'a', 'test:baz': 'b' })).toBeFalsy()
      expect(await iomem.getk(['test:foo', 'test:baz'])).toStrictEqual({ 'test:baz': 'b' })
    })
  })
})
