'use strict'

const FLAGS = require('./flags')

const IOMEM_TYPE_MAGIC = 0xAA33
const IOMEM_TYPE_PREFIX = `iomem:${IOMEM_TYPE_MAGIC}`
const IOMEM_TYPE_BIGINT = `${IOMEM_TYPE_PREFIX}:${0x24}`
const IOMEM_TYPE_DATE = `${IOMEM_TYPE_PREFIX}:${0x48}`
const IOMEM_TYPE_BUFFER = `${IOMEM_TYPE_PREFIX}:${0x72}`
const IOMEM_TYPE_STRING = `${IOMEM_TYPE_PREFIX}:${0x96}`

const jsonReplacer = function (key, value) {
  const type = typeof value
  if (type === 'bigint') {
    return { t: IOMEM_TYPE_BIGINT, d: value.toString() }
  } else if (this[key] instanceof Date) {
    return { t: IOMEM_TYPE_DATE, d: this[key].getTime().toString() }
  } else if (this[key] instanceof Buffer) {
    return { t: IOMEM_TYPE_BUFFER, d: [...this[key]] }
  } else if (value instanceof String) {
    return { t: IOMEM_TYPE_STRING, d: value.toString() }
  }
  return value
}

const jsonReviver = (key, value) => {
  if (value && value.t) {
    if (value.t === IOMEM_TYPE_BIGINT) {
      return BigInt(value.d)
    } else if (value.t === IOMEM_TYPE_DATE) {
      return new Date(Number(value.d))
    } else if (value.t === IOMEM_TYPE_BUFFER) {
      return Buffer.from(value.d)
    } else if (value.t === IOMEM_TYPE_STRING) {
      // eslint-disable-next-line no-new-wrappers
      return new String(value.d)
    }
  }
  return value
}

const serialize = value => {
  const type = typeof value
  let flags = 0

  if (type === 'string') {
    value = Buffer.from(value)
    flags |= FLAGS.string
  } else if (type === 'bigint') {
    value = Buffer.from(value.toString())
    flags |= FLAGS.bigint
  } else if (value instanceof Buffer) {
    flags |= FLAGS.Buffer
  } else if (value instanceof Date) {
    value = Buffer.from(value.getTime().toString())
    flags |= FLAGS.Date
  } else if (value instanceof String) {
    value = Buffer.from(value)
    flags |= FLAGS.String
  } else {
    value = Buffer.from(JSON.stringify(value, jsonReplacer))
    flags |= FLAGS.object
  }

  return [value, flags]
}

const deserialize = (value, flags) => {
  if (flags & FLAGS.string) {
    return value.toString('utf8')
  } else if (flags & FLAGS.bigint) {
    return BigInt(value.toString())
  } else if (flags & FLAGS.Buffer) {
    return value
  } else if (flags & FLAGS.Date) {
    return new Date(Number(value.toString()))
  } else if (flags & FLAGS.String) {
    // eslint-disable-next-line no-new-wrappers
    return new String(value.toString())
  } else if (flags & FLAGS.object) {
    try {
      return JSON.parse(value.toString('utf8'), jsonReviver)
    } catch (e) {
      throw new Error('iomem: deserialize: cannot parse object value')
    }
  }
  throw new Error('iomem: deserialize: unknown data flag')
}

module.exports = {
  serialize,
  deserialize
}
