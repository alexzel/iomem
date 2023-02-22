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

// Multi-key helpers and constants
const MULTI_GET = [ // keys to get
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1', 'k1', 'l1', 'm1', 'n1', 'o1', 'p1', 'q1', 'r1', 's1', 't1', 'u1', 'v1', 'w1', 'x1', 'y1', 'z1',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2', 'j2', 'k2', 'l2', 'm2', 'n2', 'o2', 'p2', 'q2', 'r2', 's2', 't2', 'u2', 'v2', 'w2', 'x2', 'y2', 'z2',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3', 'j3', 'k3', 'l3', 'm3', 'n3', 'o3', 'p3', 'q3', 'r3', 's3', 't3', 'u3', 'v3', 'w3', 'x3', 'y3', 'z3'
]
const MULTI_SET = // key => value object to set
  MULTI_GET.reduce((a, k) => ({ ...a, [k]: k }), {})
const MULTI_DEL = // keys to delete
  MULTI_GET.slice(25)

const multiSetMap = (cb) => { // map set object
  const map = []
  for (const key in MULTI_SET) {
    map.push(cb(key, MULTI_SET[key]))
  }
  return map
}
const multiGetResult = values => // multi get key => value result from array
  values.reduce((a, v, i) => {
    if (v !== null) {
      a[MULTI_GET[i]] = v
    }
    return a
  }, {})

// iomem task
const iomemTask = new Bench({ time: BENCH_TIME })
iomemTask.addEventListener('complete', () => {
  iomem.end()
})
iomemTask.add('iomem', async () => {
  // single
  await iomem.set('foo', 'bar', 100)
  await iomem.get('foo')
  await iomem.del('foo')

  // multi-set
  await iomem.setk(MULTI_SET, 100)

  // multi-del
  await iomem.del(MULTI_DEL)

  // multi-get
  await iomem.getk(MULTI_GET)

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
  await memjs.set('foo', 'bar', { expires: 100 })
  await memjsGet('foo')
  await memjs.delete('foo')

  // multi-set
  await Promise.all(multiSetMap((k, v) => memjs.set(k, v, { expires: 100 })))

  // multi-del
  await Promise.all(MULTI_DEL.map(k => memjs.delete(k)))

  // multi-get
  multiGetResult(await Promise.all(MULTI_GET.map(k => memjsGet(k))))

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
  await memcachedSet('foo', 'bar', 100)
  await memcachedGet('foo')
  await memcachedDel('foo')

  // multi-set
  await Promise.all(multiSetMap((k, v) => memcachedSet(k, v, 100)))

  // multi-del
  await Promise.all(MULTI_DEL.map(k => memcachedDel(k)))

  // multi-get
  await memcachedGetMulti(MULTI_GET)

  // flush
  await memcachedFlush()
})

// Benchmark runner
const run = async () => {
  // warmup sockets and run iomem task
  await Promise.all(Array(100).fill().map(() => iomem.get('test')))
  await iomem.flush()
  await iomemTask.run()

  // warmup sockets and run memjs task
  await Promise.all(Array(100).fill().map(() => memjs.get('test')))
  await memjs.flush()
  await memjsTask.run()

  // warmup sockets and run memcached task
  await Promise.all(Array(100).fill().map(() => memcachedGet('test')))
  await memcachedFlush()
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
