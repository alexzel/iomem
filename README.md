# `iomem`

![workflows-ci](https://github.com/alexzel/iomem/actions/workflows/ci.yml/badge.svg?branch=main)
![npm version](https://img.shields.io/npm/v/iomem)
![NPM license](https://img.shields.io/npm/l/iomem)
![npm downloads](https://img.shields.io/npm/dm/iomem)

Memcached client implementing binary protocol with native multiple keys support.

## Features

- Binary Memcached protocol implementation
- Multiple keys support aka multi-get, multi-set, multi-del, etc..
- Async interface
- Streams interface
- Hashring aka consistent hashing
- Failover servers with dynamic swap
- Built-in serializer and deserializer
- SASL auth with username and password

## Installation

```sh
yarn add iomem
```

or

```sh
npm install iomem
```

## Usage

The constructor accepts two optional arguments - servers list and config options.

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'], { timeout: 500, retries: 2 })
...
```

The first argument also accepts a string when you have only one server.

See [Custom servers](#custom-servers) and [Options](#options) for more details.

### Basic usage

```js
const Mem = require('iomem')
const iomem = new Mem()

await iomem.set('test:key', 'hello')
const value = await iomem.get('test:key')

console.log(value)

iomem.end() // call end() when your script or web server exits
```

### Multi-get, multi-set, multi-del, etc..

```js
const Mem = require('iomem')
const iomem = new Mem()

// set the same value for multiple keys
await iomem.set(['test:key1', 'test:key2'], 'test')

// set different values with `key => value` object
await iomem.setk({ 'test:key1': 'hello', 'test:key2': 'world' })

// get values as an array
await iomem.get(['test:key1', 'test:key2'])

// get values as a `key => value` object
await iomem.getk(['test:key1', 'test:key2'])

// delete keys 
await iomem.del(['test:key1', 'test:key2'])

...

iomem.end() // call end() when your script or web server exits
```

For more details please see [Commands](#commands) section.

## Options

```js
{
  stream: false, // set true to force client methods return streams instead of promises
  expiry: 60 * 60 * 24 * 1, // 1 day, time interval in seconds
  maxConnections: 10, // max connections per server
  connectionTimeout: 1000, // connection timeout in milliseconds
  timeout: 500, // request timeout in milliseconds
  retries: 2, // request retries - max retries
  retriesDelay: 100, // request retries - initial delay
  retriesFactor: 2, // request retries - exponential factor
  maxFailures: 10, // max server failures to swap server with a failover server
  failoverServers: [], // failover servers list
  keepAliveInitialDelay: 0 // initial delay in milliseconds for keep-alive functionality
}
```

Please take a look at [Case #2](#case-2) for a better approach before enabling `stream` flag.

## Custom servers

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211', '127.0.0.2:11211'])
...
iomem.end() // call end() when your script or web server exits
```

Supported address formats:

```js
// host
or
// host:port
or
// username:password@host:port
or
// username:password@host
or
// /path/to/memcached.sock
```

## Commands

Please note that the library automatically performs value serialization and deserialization. Here is a list of the possible value types:

`value: string|String|Number|BigInt|Boolean|Date|Array|Buffer|Object|null`

Be aware that any `value` in the below commands list refers to a value of any type specified above.

The following data types for `key` and `expiry` must be ensured by the library user:

`key: string` - storage key, 250 bytes max as defined in [Memcached](https://github.com/memcached/memcached/blob/master/memcached.h#L68)

`expiry: unsigned integer` - time interval in **seconds**, defaults to `expiry` from the config [options](#options).

For more details please see [Memcached commands](https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#commands).

### GET

`get(key): value|null` - get a value for a single key.

`get([key1, ...]): [value, ...]` - get an array of values for multiple keys.

`getk(key): {key: value}|null` - get a `key => value` object for a single key.

`getk([key1, ...]): {key: value, ...}` - get a `key => value` object for multiple keys.

`gets(key): cas|null` - get cas for a single key.

`gets([key1, ...]): {key: cas, ...}` - get a `key => cas` object for multiple keys.

`getsv(key): {value, cas}|null` - get cas and value for a single key.

`getsv([key1, ...]): {key: {value, cas}}, ...}` - get a `key => { value, cas }` object for multiple keys.

### SET

Set methods return `true` when all values were successfully set. Otherwise, when client receives `0x0001` or `0x0002` [statuses](https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#response-status) from Memcached (this is abnormal behavior for set commands), the returned value will be `false`.

`set(key, value, expiry): true|false` - set a value for a single key.

`set([key1, ...], value, expiry): true|false` - set the same value for multiple keys.

`setk({key: value, ...}, expiry): true|false` - set multiple values with `key => value` object.

### ADD

Add commands set a key only when it is not set yet (a key does not exist in the Memcached). The methods will return `false` when at least one key was not successfully set (meaning a key was already set with some value, so it was not set with the value you provided with a command).

`add(key, value, expiry): true|false` - add a value for a single key.

`add([key1, ...], value, expiry): true|false` - add the same value for multiple keys.

`addk({key: value, ...}, expiry): true|false` - add multiple values with `key => value` object.

### REPLACE

Replace commands set a new value for a key only when it is already set with some value (a key does exist in the Memcached). The methods will return `false` when at least one key was not successfully set (meaning a key did not exist in the Memcached when you ran a command).

`replace(key, value, expiry): true|false` - replace a value for a single key.

`replace([key1, ...], value, expiry): true|false` - replace the same value for multiple keys.

`replacek({key: value, ...}, expiry): true|false` - replace multiple values with `key => value` object.

### CAS

The `cas` command sets a key with a new value only when `cas` parameter matches `cas` value stored in a key. To retrieve the current `cas` value for a key please see [GET](#get) commands.

`cas(key, value, cas, expiry): true|false` - set a value if the cas matches.

### DEL

Delete commands delete a key only when it exists. The methods will return `false` when at least one key does not exist.

`del(key): true|false` - delete a key.

`del([key1, ...]): true|false` - delete multiple keys.


### INCERMENT AND DECREMENT

Increment and decrement commands will add or substract the specified `delta` value from the current counter value initialized with `initial` value. You can use `SET`, `ADD`, `REPLACE` commands to set a counter value.

`incr(key, initial, delta, expiry): value|null` - increment counter and returns its value.

`incr([key1, ...], initial, delta, expiry): [value, ...]` - increment counter and returns its value for multiple keys.

`decr(key, initial, delta, expiry): value|null` - decrement counter and returns its value.

`decr([key1, ...], initial, delta, expiry): [value, ...]` - decrement counter and returns its value for multiple keys.

Parameters:

`initial: BigInt` - initial counter value

`delta: BigInt` - amount to add or substruct from a counter

`expiry` - see [Commands](#commands)

If you want to get the current value from a counter without changing its value, use [GET](#get) commands and manually deserialize the response buffer.

```js
...
const FLAGS = require('iomem/src/flags')
const { deserialize } = require('iomem/src/serializer')

deserialize(await iomem.get('test:foo'), FLAGS.bigint)
...
```

### FLUSH, QUIT, NOOP, VERSION

_NOTE: all the following commands will make request only to **active** servers. This meaning if you have servers A, B, and C and failover server D the request will be performed on servers A, B, and C, but if you have server B failed and so replaced with failover server D, then the request will be performed on servers A, D, and C._

`flush()` - flush cached items on all servers.

`flush(expiry)` - flush cached items on all servers in `expiry` seconds.

`quit()` - closes connection that query hits (either existing or a new one) on all servers. Useless in multi-connection and multi-server environment.

`noop()` - sends empty packet to all servers and returns true on success, may be useful for pinging.

`version(): {<hostname>: <version>, ...}` - get Memcached version string from all servers and return `hostname => version` object.

### APPEND AND PREPEND

Append and prepend commands either append or prepend a string value to an existing value stored by a key.

#### Append methods

`append(key, value): true|false` - append value to a stored value

`append([key1, ...], value): true|false` - append value to a stored value for multiple keys

`appends(key, value): cas|null` - append value and return new cas.

`appends([key1, ...], value): [cas1, ...]` - append value to multiple keys and return cas array.

`appendk({key: value, ...}): true|false` - append by `key => value` pairs.

`appendks({key: value, ...}): [cas1, ...]` - append by `key => value` pairs and return cas array.


#### Prepend methods

`prepend(key, value): true|false` - prepend value to a stored value

`prepend([key1, ...], value): true|false` - prepend value to a stored value for multiple keys

`prepends(key, value): cas|null` - prepend value and return new cas.

`prepends([key1, ...], value): [cas1, ...]` - prepend value to multiple keys and return cas array.

`prependk({key: value, ...}): true|false` - prepend by `key => value` object.

`prependks({key: value, ...}): [cas1, ...]` - prepend by `key => value` object and return cas array.


### STAT

Stat command requests statistics from each server. Without a key the stat command will return a default set of statistics information for each server.

`stat(): {<hostname>: object, ...}` - get a default set of statistics information in `hostname => object` format.

`stat(key): {<hostname>: object, ...}` - get statistics specified with a key (e.g. `items`, `slabs`, `sizes`) in `hostname => object` format, see [Memcached wiki](https://github.com/memcached/memcached/wiki/Commands#statistics).


### TOUCH

Touch command sets a new expiration time for a key. Returns `true` when a key exists and `false` otherwise.

`touch(key, expiry): true|false` - set expiration time for a single key.

`touch([key1, ...], expiry): true|false` - set expiration time for multiple keys.


### GAT

Gat command sets a new expiration time for a key and returns a key value.

`gat(key, expiry): null|value` - set expiration time for a single key.

`gat([key1, ...], expiry): [value, ...]` - set expiration time for a multiple keys.


## Streams

### Case #1:

Force `iomem` methods to return a stream instead of a promise by passing `stream: true` flag.

Please see [Case #2](#case-2) for a better approach.

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'], { stream: true })

const { pipeline, Writable } = require('node:stream')

// Set some data
await iomem.set('test:a', 'a')

// Writable stream
const ws = new Writable({ objectMode: true, write (data, _, cb) { console.log(data); cb() } })

// Pipeline
pipeline(iomem.get('test:a'), ws, err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

### Case #2:

Create a stream with special method called `stream` and supply data with readable stream. Do not care about `stream` flag.

**This is the recommended approach**

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'])

const { pipeline, Readable, Writable } = require('node:stream')

// Set some data
await iomem.set('test:a', 'a')

// Readable stream
const rs = Readable.from([Mem.get('test:a')][Symbol.iterator]())

// Writable stream
const ws = new Writable({ objectMode: true, write (data, _, cb) { console.log(data); cb() } })

// Pipeline
pipeline(rs, iomem.stream(), ws, err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

### Case #3:

Combine case #1 with readable stream to supply extra data into the stream.

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'], { stream: true })

const { pipeline, Readable, Writable } = require('node:stream')

// Set some data
await iomem.set('test:a', 'a')
await iomem.set('test:b', 'b')

// Readable stream
const rs = Readable.from([Mem.get('test:a')][Symbol.iterator]())

// Writable stream
const ws = new Writable({ objectMode: true, write (data, _, cb) { console.log(data); cb() } })

// Pipeline
pipeline(rs, iomem.get('test:b'), ws, err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

### Static methods for readable streams

As you may have noticed from the above examples, in order to supply a readable stream with client methods you have to
use a static version of the methods like `Mem.get('test:a')` instead of `iomem.get('test:a')`.

The caveat here is that you may assume that for the methods accepting an expiry (like `set`, `add`, etc..)
it will use the default expiry that you have passed into the client constructor in case you omit the method argument.

But in reality it won't know anything about your client instances and therefore their configs as it's a
static class method. So by default it will be 1 day interval as an expiry.

In order to supply static methods with default expiry, please use `Mem.setDefaultExpiry(expiry)` static method.

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'], { stream: true })

const { pipeline, Readable, Writable } = require('node:stream')

// Set default expiry for static methods
Mem.setDefaultExpiry(60 * 60) // 1 hour

// Readable stream
const rs = Readable.from([Mem.set('test:a', 'a'), Mem.get('test:a')][Symbol.iterator]())

// Writable stream
const ws = new Writable({ objectMode: true, write (data, _, cb) { console.log(data); cb() } })

// Pipeline
pipeline(rs, iomem.get('test:b'), ws, err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```
