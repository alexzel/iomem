'use strict'

const Mem = require('../src/client')
const { deserialize } = require('../src/serializer')
const FLAGS = require('../src/flags')

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

    it('sets new value for existing key', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.set('test:foo', 'b')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('b')
    })

    it('sets new values when multi key', async () => {
      expect(await iomem.set(['test:foo', 'test:baz'], 'a')).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'a'])
    })

    it('sets new values for existing keys when multi key', async () => {
      expect(await iomem.set(['test:foo', 'test:baz'], 'a')).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'a'])
      expect(await iomem.set(['test:foo', 'test:baz'], 'b')).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['b', 'b'])
    })
  })

  describe('setk', () => {
    it('sets new value', async () => {
      expect(await iomem.setk({ 'test:foo': 'a' })).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('sets new value for existing key', async () => {
      expect(await iomem.setk({ 'test:foo': 'a' })).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.setk({ 'test:foo': 'b' })).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('b')
    })

    it('sets new values when multi key', async () => {
      expect(await iomem.setk({ 'test:foo': 'a', 'test:baz': 'b' })).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['a', 'b'])
    })

    it('sets new values for existing keys when multi key', async () => {
      expect(await iomem.setk({ 'test:foo': 'bar', 'test:baz': 'qux' })).toBeTruthy()
      expect(await iomem.get(['test:foo', 'test:baz'])).toStrictEqual(['bar', 'qux'])
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

  describe('cas', () => {
    it('sets new value when cas exists', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      const cas = await iomem.gets('test:foo')
      expect(await iomem.cas('test:foo', 'b', cas['test:foo'])).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('b')
    })

    it('fails settings a key when cas does not match', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.set('test:baz', 'b')).toBeTruthy()
      const cas = await iomem.gets(['test:foo', 'test:baz'])
      expect(await iomem.cas('test:foo', 'b', cas['test:baz'])).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('a')
    })

    it('fails settings a key when it does not exist', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      const cas = await iomem.gets('test:foo')
      await iomem.flush()
      expect(await iomem.cas('test:foo', 'b', cas['test:foo'])).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe(null)
    })

    it('fails setting a key when multi keys (but sets the matching cas)', async () => {
      expect(await iomem.set('test:foo', 'bar')).toBeTruthy()
      expect(await iomem.set('test:baz', 'qux')).toBeTruthy()
      const cas = await iomem.gets(['test:foo', 'test:baz'])
      expect(await iomem.cas(['test:foo', 'test:baz'], 'b', cas['test:baz'])).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe('bar')
      expect(await iomem.get('test:baz')).toBe('b')
    })
  })

  describe('del', () => {
    it('deletes a key', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.del('test:foo')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe(null)
    })

    it('fails deleting a not existing key', async () => {
      expect(await iomem.del('test:foo')).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe(null)
    })

    it('deletes a multi key', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.set('test:baz', 'b')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.get('test:baz')).toBe('b')
      expect(await iomem.del(['test:foo', 'test:baz'])).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe(null)
      expect(await iomem.get('test:baz')).toBe(null)
    })

    it('fails deleting multi key when the first key does not exists (but deletes the existing one)', async () => {
      expect(await iomem.set('test:baz', 'b')).toBeTruthy()
      expect(await iomem.get('test:baz')).toBe('b')
      expect(await iomem.del(['test:foo', 'test:baz'])).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe(null)
      expect(await iomem.get('test:baz')).toBe(null)
    })

    it('fails deleting multi key when the second key does not exists (but deletes the existing one)', async () => {
      expect(await iomem.set('test:foo', 'a')).toBeTruthy()
      expect(await iomem.get('test:foo')).toBe('a')
      expect(await iomem.del(['test:foo', 'test:baz'])).toBeFalsy()
      expect(await iomem.get('test:foo')).toBe(null)
      expect(await iomem.get('test:baz')).toBe(null)
    })
  })

  describe('incr', () => {
    it('increments', async () => {
      expect(await iomem.incr('test:foo', 32n, 4n)).toBe(32n)
      expect(await iomem.incr('test:foo', 32n, 4n)).toBe(36n)
      expect(deserialize(await iomem.get('test:foo'), FLAGS.bigint)).toBe(36n)
      expect(await iomem.incr('test:foo', 3n, 2n)).toBe(38n)
      await iomem.set('test:foo', 3n)
      expect(await iomem.incr('test:foo', 3n, 2n)).toBe(5n)
      expect(await iomem.incr('test:foo', 3n, 2n)).toBe(7n)
      expect(deserialize(await iomem.get('test:foo'), FLAGS.bigint)).toBe(7n)
    })

    it('increments multi key', async () => {
      expect(await iomem.incr(['test:foo', 'test:baz'], 32n, 4n)).toStrictEqual([32n, 32n])
      expect(await iomem.incr(['test:foo', 'test:baz'], 32n, 4n)).toStrictEqual([36n, 36n])
    })
  })

  describe('decr', () => {
    it('decrements', async () => {
      expect(await iomem.decr('test:foo', 32n, 4n)).toBe(32n)
      expect(await iomem.decr('test:foo', 32n, 4n)).toBe(28n)
      expect(deserialize(await iomem.get('test:foo'), FLAGS.bigint)).toBe(28n)
      expect(await iomem.decr('test:foo', 3n, 2n)).toBe(26n)
      await iomem.set('test:foo', 10n)
      expect(await iomem.decr('test:foo', 3n, 2n)).toBe(8n)
      expect(await iomem.decr('test:foo', 3n, 2n)).toBe(6n)
      expect(deserialize(await iomem.get('test:foo'), FLAGS.bigint)).toBe(6n)
    })

    it('decrements multi key', async () => {
      expect(await iomem.decr(['test:foo', 'test:baz'], 32n, 4n)).toStrictEqual([32n, 32n])
      expect(await iomem.decr(['test:foo', 'test:baz'], 32n, 4n)).toStrictEqual([28n, 28n])
    })
  })

  /* eslint-disable no-new-wrappers */
  describe('serializer', () => {
    it('reads and writes various data types', async () => {
      // integer
      await iomem.set('test:foo', 10)
      expect(await iomem.get('test:foo')).toBe(10)

      // float
      await iomem.set('test:foo', 3.14)
      expect(await iomem.get('test:foo')).toBe(3.14)

      // boolean
      await iomem.set('test:foo', true)
      expect(await iomem.get('test:foo')).toBe(true)

      // string
      await iomem.set('test:foo', 'abc')
      expect(await iomem.get('test:foo')).toBe('abc')

      // String
      await iomem.set('test:foo', new String('abc'))
      expect(await iomem.get('test:foo')).toStrictEqual(new String('abc'))

      // BigInt
      await iomem.set('test:foo', 100n)
      expect(await iomem.get('test:foo')).toBe(100n)

      // Date
      const date = new Date()
      await iomem.set('test:foo', date)
      expect(await iomem.get('test:foo')).toStrictEqual(date)

      // Buffer
      const buffer = Buffer.from(['a', 'b', 'c'])
      await iomem.set('test:foo', buffer)
      expect(await iomem.get('test:foo')).toStrictEqual(buffer)

      // array
      await iomem.set('test:foo', [1, 2])
      expect(await iomem.get('test:foo')).toStrictEqual([1, 2])

      // object
      const obj = {
        int: 10,
        float: 3.14,
        bool: true,
        str: 'abc',
        Str: new String('abc'),
        big: 100n,
        date: new Date(),
        buf: Buffer.from(['a', 'b', 'c']),
        arr: [1, 2],
        obj: {
          a: 1000,
          b: true,
          d: new Date()
        }
      }
      await iomem.set('test:foo', obj)
      expect(await iomem.get('test:foo')).toStrictEqual(obj)
    })
  })
})