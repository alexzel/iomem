# `iomem`

**WARNING! THIS SOFTWARE IS A WORK IN PROGRESS! DO NOT USE IT!**

Memcached client implementing binary protocol with native multiple keys support.

## Features

- Binary Memcached protocol implementation
- Multiple keys support aka multi-get, multi-set, multi-del, etc..
- Async interface
- Streams interface
- Hashring aka consistent hashing

## Installation

```sh
yarn add iomem
```

or

```sh
npm install iomem
```

## Usage

### Default

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

### Custom servers

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

### Commands

Please note that the library automatically performs value serialization and deserialization. Here is a list of the possible value types:

`value: string|String|Number|BigInt|Boolean|Date|Array|Buffer|Object|null`

Be aware that any `value` in the below commands list refers to a value of any type specified above.

The following data types for `key` and `expiry` are must by ensured by the library user:

`key: string` - storage key, 250 bytes max as defined in [Memcached](https://github.com/memcached/memcached/blob/master/memcached.h#L68)

`expiry: unsigned integer` - time interval in seconds, defaults to `expiry` from the client config.

For more details please [Memcached commands](https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#commands).

#### GET

`get(key): value|null` - get a value for a single key.

`get([key1, ...]): [value, ...]` - get an array of values for multiple keys.

`getk(key): {key: value}|null` - get a `key => value` object for a single key.

`getk([key1, ...]): {key: value, ...}` - get a `key => value` object for multiple keys.

`gets(key): {key: cas}|null` - get a `key => cas` object for a single key.

`gets([key1, ...]): {key: cas, ...}` - get a `key => cas` object for multiple keys.

`getsv(key): {key: {value, cas}}|null` - get a `key => { value, cas }` object for a single key.

`getsv([key1, ...]): {key: {value, cas}}, ...}` - get a `key => { value, cas }` object for multiple keys.

#### SET

Set methods return `true` when all values were successfully set. Otherwise, when client receives `0x0001` or `0x0002` [statuses ](https://github.com/memcached/memcached/wiki/BinaryProtocolRevamped#response-status) from Memcached (this is abnormal behavior for set commands), the returned value will be `false`.

`set(key, value, expiry): true|false` - set a value for a single key.

`set([key1, ...], value, expiry): true|false` - set the same value for multiple keys.

`setk({key: value, ...}, expiry): true|false` - set multiple values with `key => value` object.

#### ADD

Add commands set a key only when it is not set yet (a key does not exist in the Memcached). The methods will return `false` when at least one key was not successfully set (meaning a key was already set with some value, so it was not set with the value you provided with a command).

`add(key, value, expiry): true|false` - add a value for a single key.

`add([key1, ...], value, expiry): true|false` - add the same value for multiple keys.

`addk({key: value, ...}, expiry): true|false` - add multiple values with `key => value` object.

#### REPLACE

Replace commands set a new value for a key only when it is already set with some value (a key does exist in the Memcached). The methods will return `false` when at least one key was not successfully set (meaning a key did not exist in the Memcached when you ran a command).

`replace(key, value, expiry): true|false` - replace a value for a single key.

`replace([key1, ...], value, expiry): true|false` - replace the same value for multiple keys.

`replacek({key: value, ...}, expiry): true|false` - replace multiple values with `key => value` object.

#### CAS

The `cas` command sets a key with a new value only when `cas` parameter matches `cas` value stored in the key. To retrieve the current `cas` value for a key please see [GET](#get) commands.

`cas(key, value, cas, expiry): true|false` - set a value if the cas matches.

#### DEL

Delete commands delete a key only when it exists. The methods will return `false` when at least one key does not exist.

`del(key): true|false` - delete a key.

`del([key1, ...]): true|false` - delete multiple keys.


#### INCERMENT AND DECREMENT

Increment and decrement commands add or substract the specified `delta` value from the current counter value initialized with `initial` value. You can use `SET`, `ADD`, `REPLACE` commands to set a counter value.

`incr(key, initial, delta, expiry): value` - increments counter and returns its value.

`decr(key, initial, delta, expiry): value` - decrements coutner and returns its value.

Paramters:

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

#### FLUSH

`flush()` - flush cached items.

`flush(expiry)` - flush cached items in `expiry` seconds.

### Streams

#### Case #1:

Force `iomem` methods to return a stream instead of a promise by passing `stream: true` flag.

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'], { stream: true })

const { pipeline, Writable } = require('node:stream')

class Echo extends Writable {
  constructor (opts) {
    super({ objectMode: true, ...opts })
  }

  _write (data, _, cb) {
    console.log(data)
    cb()
  }
}

pipeline(iomem.get('test:a'), new Echo(), err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

#### Case #2:

Create a stream with special method called `stream` and supply data with readable stream. Do not care about `stream` flag.

**This is the recommended approach**

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'])

const { pipeline, Readable, Writable } = require('node:stream')

class Echo extends Writable {
  constructor (opts) {
    super({ objectMode: true, ...opts })
  }

  _write (data, _, cb) {
    console.log(data)
    cb()
  }
}

pipeline(Readable.from([Mem.get('test:a')][Symbol.iterator]()), iomem.stream(), new Echo(), err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

#### Case #3:

Combine case #1 with readable stream to supply extra data into the stream.

```js
const Mem = require('iomem')
const iomem = new Mem(['127.0.0.1:11211'], { stream: true })

const { pipeline, Readable, Writable } = require('node:stream')

class Echo extends Writable {
  constructor (opts) {
    super({ objectMode: true, ...opts })
  }

  _write (data, _, cb) {
    console.log(data)
    cb()
  }
}

pipeline(Readable.from([Mem.get('test:a')][Symbol.iterator]()), iomem.get('test:b'), new Echo(), err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

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
  retriesFactor: 2 // request retries - exponential factor
}
```

Please take a look at [Case #2](#case-2) for a better approach before enabling `stream` flag.
