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
const Memcached = require('iomem')
const iomem = new Memcached()

await iomem.set('test:key', 'hello')
console.log(await iomem.get('test:key'))

iomem.end()
```

### Multi-get, multi-set, multi-del, etc..

```js
const Memcached = require('iomem')
const iomem = new Memcached()

await iomem.set(['test:key1', 'test:key2'], ['hello', 'world'])
console.log(await iomem.get(['test:key1', 'test:key2']))
await iomem.del(['test:key1', 'test:key2'])

iomem.end()
```

### Custom servers

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211', '127.0.0.2:11211'])
...
iomem.end()
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

### Streams

#### Case #1:

Force `iomem` methods to return a stream instead of a promise by passing `stream: true` flag.

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211'], { stream: true })

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
    console.log(err)
  }
  iomem.end()
})
```

#### Case #2:

Omit method arguments to return a stream and supply data with readable stream. Do not care about `stream` flag.

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211'])

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

pipeline(Readable.from([Client.get('test:a')][Symbol.iterator]()), iomem.get(), new Echo(), err => {
  if (err) {
    console.log(err)
  }
  iomem.end()
})
```

#### Case #3:

The same as case #2 but use special method called `stream` instead of different methods that semantically do not make sense.

**This is recommended approach**

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211'])

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

pipeline(Readable.from([Client.get('test:a')][Symbol.iterator]()), iomem.stream(), new Echo(), err => {
  if (err) {
    console.log(err)
  }
  iomem.end()
})
```

#### Case #4:

Combine case #1 with readable stream to supply extra data into the stream.

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211'], { stream: true })

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

pipeline(Readable.from([Client.get('test:a')][Symbol.iterator]()), iomem.get('test:b'), new Echo(), err => {
  if (err) {
    console.log(err)
  }
  iomem.end()
})
```

## Options

```js
{
  stream: false, // set true to use streams instead of promises
  expiry: 60 * 60 * 24 * 1, // 1 day, time interval in seconds
  maxConnections: 10, // max connections per server
  connectionTimeout: 1000, // connection timeout
  timeout: 500, // request timeout
  retries: 2, // request retries - max retries
  retriesDelay: 100, // request retries - initial delay
  retriesFactor: 2 // request retries - exponential factor
}
```
