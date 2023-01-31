# Benchmark

The benchmark measures single and multiple key requests (if a library does not have a multiple keys command it gets replaced with multiple commands).

Each library runs in its own benchmark task. All tasks ran in a sequence one by one with closing all connections once complete.

All libraries warm up sockets before running their task by performing 10 commands in order to reach max connections, so we do not measure a new socket creation time.

All methods are called using async/await (if a library method does not have an async version we promisify it).

All libraries should return an actual value with `get` methods, not a Buffer (if a library returns a Buffer we convert it to a string).

## Prepare

You need to have Memcached server running on `127.0.0.1:11211`.

Also, you need to install the following libraries.

```sh
yarn add memcached memjs
```

## Run benchmark

```sh
node ./benchmark.js
```

## Results on MacBook Pro (16-inch, 2021)

|Task Name|Average Time (ps)|Variance (ps)|
|---------|-----------------|-------------|
|**iomem**|**2433.775669176793**|**302.8518751082829**|
|memjs|3379.80757532893|594.2589434918048|
|memcached|3863.10650943329|573.8464058865078|
