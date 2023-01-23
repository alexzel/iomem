'use strict'

const KEY_TYPES = {
  empty: 1 << 0,
  string: 1 << 1,
  array: 1 << 2,
  object: 1 << 3
}

const getKeyType = key => {
  if (!key) {
    return KEY_TYPES.empty
  }
  if (typeof key !== 'string') {
    return KEY_TYPES.string
  }
  if (Array.isArray(key)) {
    return KEY_TYPES.array
  }
  return KEY_TYPES.object
}

const getKeyFlags = key => {
  const keyFlags = {
    isEmpty: false,
    isString: false,
    isArray: false,
    isObject: false,
    isMultikey: false
  }
  if (!key) {
    keyFlags.isEmpty = true
  } else if (typeof key === 'string') {
    keyFlags.isString = true
  } else if (Array.isArray(key)) {
    keyFlags.isArray = true
    keyFlags.isMultikey = true
  } else {
    keyFlags.isObject = true
    keyFlags.isMultikey = true
  }
  return keyFlags
}

module.exports = {
  getKeyType,
  getKeyFlags,
  KEY_TYPES
}
