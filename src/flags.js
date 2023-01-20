'use strict'

// Flags:
//   https://github.com/memcached/memcached/blob/master/memcached.h#L546
const FLAGS = {
  ITEM_LINKED: 1,
  ITEM_CAS: 2,
  /* temp */
  ITEM_SLABBED: 4,
  /* Item was fetched at least once in its lifetime */
  ITEM_FETCHED: 8,
  /* Appended on fetch, removed on LRU shuffling */
  ITEM_ACTIVE: 16,
  /* If an item's storage are chained chunks. */
  ITEM_CHUNKED: 32,
  ITEM_CHUNK: 64,
  /* ITEM_data bulk is external to item */
  ITEM_HDR: 128,
  /* additional 4 bytes for item client flags */
  ITEM_CFLAGS: 256,
  /* item has sent out a token already */
  ITEM_TOKEN_SENT: 512,
  /* reserved, in case tokens should be a 2-bit count in future */
  ITEM_TOKEN_RESERVED: 1024,
  /* if item has been marked as a stale value */
  ITEM_STALE: 2048,
  /* if item key was sent in binary */
  ITEM_KEY_BINARY: 4096
}

module.exports = FLAGS
