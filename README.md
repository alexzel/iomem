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
```

### Multi-get, multi-set, multi-del, etc..

```js
const Memcached = require('iomem')
const iomem = new Memcached()

await iomem.set(['test:key1', 'test:key2'], ['hello', 'world'])
console.log(await iomem.get(['test:key1', 'test:key2']))
await iomem.del(['test:key1', 'test:key2'])
```

### Custom servers

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211', '127.0.0.2:11211'])
...
```

Address formats:

```js
// host:port
or
// username:password@host:port
or
// /path/to/memcached.sock
```

### Streams

```js
const Memcached = require('iomem')
const iomem = new Memcached(['127.0.0.1:11211'], { stream: true })

const { pipeline, Writable } = require('node:stream')

class Echo extends Writable {
  _write (data, _, cb) {
    console.log(data)
    cb()
  }
}

pipeline(iomem.get('test:a'), new Echo({ objectMode: true }), err => {
  if (err) {
    console.log(err)
  }
})
```

## Options

```js
{
  stream: false, // set true to use streams instead of promises
  expiry: 60 * 60 * 24 * 1, // 1 day, time interval in seconds
  maxConnection: 10, // max connections per server
  connectionTimeout: 1000, // connection timeout
  timeout: 500, // request timeout
  retries: 2 // request retries
}
```
