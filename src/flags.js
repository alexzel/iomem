'use strict'

// The flags are client specific.
// We use them to encode/decode stored values by type.
/* eslint-disable key-spacing */
const FLAGS = {
  // Types
  // We don't care about number, boolean, null. They will be handled as object type by JSON.stringify
  // Function, Symbol, and undefined are not stringifiable.
  string: 1 << 0, // we keep it here to not have "" wrappers by JSON.stringify
  bigint: 1 << 1, // we keep it here b/c JSON.stringify does not support BigInt
  object: 1 << 2, // this is the JSON.stringify product, the default method when no flags specified

  // Instances
  Buffer: 1 << 3, // buffers are handled as they are
  Date:   1 << 4, // date is a common type that we want to handle
  String: 1 << 5, // string object must remain a string object

  // Compression flag
  compressed: 0b10000000000000000000000000000000
}

module.exports = FLAGS
