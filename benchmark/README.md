# Benchmark

The benchmark measures single and multiple key requests (if a library does not have a multiple keys command it gets replaced with multiple parallel commands).

Each library runs in its own benchmark task. All tasks ran in a sequence one by one with closing all connections once complete.

All libraries warm up sockets before running their task by performing 100 commands in order to reach max connections, so we do not measure a new socket creation time.

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

## Results on MacBook Pro (15-inch, 2017)

|Task Name|Average Time (ps)|Variance (ps)|
|---------|-----------------|-------------|
|**iomem**|**7529.807818563361**|**2311.659311262639**|
|memjs|9730.084081297939|4746.691067722728|
|memcached|8655.180655676742|5440.27880491126|

## Results on MacBook Pro (16-inch, 2021)

|Task Name|Average Time (ps)|Variance (ps)|
|---------|-----------------|-------------|
|**iomem**|**3254.8396680262185**|**238.39605779530385**|
|memjs|3530.3901077156333|211.6138837415166|
|memcached|3683.615798897603|1611.866453764316|
