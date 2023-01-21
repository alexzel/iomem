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

await iomem.set(['test:key1', 'test:key2'], ['hello', 'world'])
const values = await iomem.get(['test:key1', 'test:key2'])
await iomem.del(['test:key1', 'test:key2'])

console.log(values)

iomem.end() // call end() when your script or web server exits
```

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

Omit method arguments to return a stream and supply data with readable stream. Do not care about `stream` flag.

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

pipeline(Readable.from([Mem.get('test:a')][Symbol.iterator]()), iomem.get(), new Echo(), err => {
  if (err) {
    console.error(err)
  }
})

...

iomem.end() // call end() when your script or web server exits
```

#### Case #3:

The same as case #2 but use special method called `stream` instead of other methods that semantically do not make sense.

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

#### Case #4:

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

Please take a look at [Case #3](#case-3) for a better approach before enabling `stream` flag.
