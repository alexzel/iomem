'use strict'

const util = require('node:util')
const { Bench } = require('tinybench')

const Memcached = require('memcached')
const Memjs = require('memjs').Client
const Mem = require('../src/client')

const BENCH_TIME = 1000

// Create all clients
const memcached = new Memcached('127.0.0.1:11211')
const memjs = Memjs.create('127.0.0.1:11211')
const iomem = new Mem(['127.0.0.1:11211'])

// Promisify Memcached methods, so all libraries are tested with async/await
const memcachedSet = util.promisify(memcached.set).bind(memcached)
const memcachedGet = util.promisify(memcached.get).bind(memcached)
const memcachedGetMulti = util.promisify(memcached.getMulti).bind(memcached)
const memcachedDel = util.promisify(memcached.del).bind(memcached)
const memcachedFlush = util.promisify(memcached.flush).bind(memcached)

// Convert Buffer to a string for Memjs, so all libraries return the same value
const memjsGet = async (key) => {
  const data = await memjs.get(key)
  return data && data.value ? data.value.toString('utf8') : null
}

// Close all sockets, so no libraries are pre-connected
iomem.end()
memjs.close()
memcached.end()

// iomem task
const iomemTask = new Bench({ time: BENCH_TIME })
iomemTask.addEventListener('complete', () => {
  iomem.end()
})
iomemTask.add('iomem', async () => {
  // single
  await iomem.set('foo', 'bar', 10)
  await iomem.get('foo')
  await iomem.del('foo')

  // multi-set
  await iomem.setk({ baz: 'qux', a: '1', b: '2', f: '3' }, 10)

  // multi-get
  await iomem.getk(['baz', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

  // flush
  await iomem.flush()
})

// memjs task
const memjsTask = new Bench({ time: BENCH_TIME })
memjsTask.addEventListener('complete', () => {
  memjs.close()
})
memjsTask.add('memjs', async () => {
  // single
  await memjs.set('foo', 'bar', { expires: 10 })
  await memjsGet('foo')
  await memjs.delete('foo')

  // multi-set
  await memjs.set('baz', 'qux', { expires: 10 })
  await memjs.set('a', '1', { expires: 10 })
  await memjs.set('b', '2', { expires: 10 })
  await memjs.set('f', '3', { expires: 10 })

  // multi-get
  await memjsGet('baz')
  await memjsGet('a')
  await memjsGet('b')
  await memjsGet('c')
  await memjsGet('d')
  await memjsGet('e')
  await memjsGet('f')
  await memjsGet('g')
  await memjsGet('h')

  // flush
  await memjs.flush()
})

// memcached task
const memcachedTask = new Bench({ time: BENCH_TIME })
memcachedTask.addEventListener('complete', () => {
  memcached.end()
})
memcachedTask.add('memcached', async () => {
  // single
  await memcachedSet('foo', 'bar', 10)
  await memcachedGet('foo')
  await memcachedDel('foo')

  // multi-set
  await memcachedSet('baz', 'qux', 10)
  await memcachedSet('a', '1', 10)
  await memcachedSet('b', '2', 10)
  await memcachedSet('f', '3', 10)

  // multi-get
  await memcachedGetMulti(['baz', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

  // flush
  await memcachedFlush()
})

// Benchmark runner
const run = async () => {
  // warmup sockets and run iomem task
  for (let i = 0; i < 10; i++) {
    await iomem.get('test')
  }
  await iomemTask.run()

  // warmup sockets and run memjs task
  for (let i = 0; i < 10; i++) {
    await memjs.get('test')
  }
  await memjsTask.run()

  // warmup sockets and run memcached task
  for (let i = 0; i < 10; i++) {
    await memcachedGet('test')
  }
  await memcachedTask.run()

  // print results
  console.log()
  console.table([iomemTask, memjsTask, memcachedTask].map(task => ({
    'Task Name': task.tasks[0].name,
    'Average Time (ps)': (task.tasks[0].result.mean || 0) * 1000,
    'Variance (ps)': (task.tasks[0].result.variance || 0) * 1000
  })))
  console.log()
}

run()
  .then(() => {
    console.log('Done')
  })
  .catch(e => {
    console.error(e)
  })
