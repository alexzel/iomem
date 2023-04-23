# Changelog

## [1.5.9](https://github.com/alexzel/iomem/compare/v1.5.8...v1.5.9) (2023-04-23)


### Bug Fixes

* revive server when connection restored ([8c7d718](https://github.com/alexzel/iomem/commit/8c7d7184e2ad1f6de57207800a369adc70ba0191))
* revive with restored connection by failed flag as well ([cf6a4ae](https://github.com/alexzel/iomem/commit/cf6a4ae85e54765fe733ff9ffe31148bfe06058c))

## [1.5.8](https://github.com/alexzel/iomem/compare/v1.5.7...v1.5.8) (2023-04-23)


### Bug Fixes

* fix comments typo ([63161af](https://github.com/alexzel/iomem/commit/63161af624cefe2b3e7ce5e2eb9f67e47e6827dc))
* fix undefined socket in server.end() when server becomes unavailable ([94d7102](https://github.com/alexzel/iomem/commit/94d71029fe9571505f033526e80dbd884b7d133b))

## [1.5.7](https://github.com/alexzel/iomem/compare/v1.5.6...v1.5.7) (2023-04-23)


### Bug Fixes

* fix bitwise modulo for opaque increment ([a5051a4](https://github.com/alexzel/iomem/commit/a5051a4ace6b122301801e75d368b06efa257d07))

## [1.5.6](https://github.com/alexzel/iomem/compare/v1.5.5...v1.5.6) (2023-04-16)


### Bug Fixes

* remove unused arguments ([5d00654](https://github.com/alexzel/iomem/commit/5d00654c7048dc78aba6ea35b9c432f9a3fc9e13))
* remove unused class property ([8f07975](https://github.com/alexzel/iomem/commit/8f079758f0081d0568bf520a580c6f86a645b7df))

## [1.5.5](https://github.com/alexzel/iomem/compare/v1.5.4...v1.5.5) (2023-02-27)


### Performance Improvements

* replace unnecessary map with for loop ([e7061de](https://github.com/alexzel/iomem/commit/e7061de89fab937ddf3bbacb5cb0de02c7a0f892))

## [1.5.4](https://github.com/alexzel/iomem/compare/v1.5.3...v1.5.4) (2023-02-26)


### Performance Improvements

* do not parse packet when opaque is not from the current request ([9fdfbcc](https://github.com/alexzel/iomem/commit/9fdfbcce27e171fcaa5ff0fc3f2a691e0972f5c0))
* replace % with bitwise & b/c divisor is power of 2 ([ed61f93](https://github.com/alexzel/iomem/commit/ed61f932c4ace89af6408ec00807fcab871c6ef1))

## [1.5.3](https://github.com/alexzel/iomem/compare/v1.5.2...v1.5.3) (2023-02-20)


### Bug Fixes

* fix initial delay parameter for server keep alive ([130a085](https://github.com/alexzel/iomem/commit/130a085c5ebf6e129fc6d169d22715c7c604222b))

## [1.5.2](https://github.com/alexzel/iomem/compare/v1.5.1...v1.5.2) (2023-02-01)


### Features

* constructor can accept both server as a string or servers as an array ([6bdc83e](https://github.com/alexzel/iomem/commit/6bdc83e78faac127d684ece5d7983ce256490040))


### Miscellaneous Chores

* release 1.5.2 ([0a20cef](https://github.com/alexzel/iomem/commit/0a20cef63eee5b9749f358cb6ead996e19c451aa))

## [1.5.1](https://github.com/alexzel/iomem/compare/v1.5.0...v1.5.1) (2023-01-31)


### Bug Fixes

* fix max socket listeners ([16d2de6](https://github.com/alexzel/iomem/commit/16d2de6245932f8e2e41875b04f8f138750224cb))

## [1.5.0](https://github.com/alexzel/iomem/compare/v1.4.5...v1.5.0) (2023-01-31)


### Features

* add TypeScript types ([5b678fe](https://github.com/alexzel/iomem/commit/5b678fed053905904f5d28154bd952988a05d2d2))


### Bug Fixes

* fix increment and decrement signatures in the readme ([dc53585](https://github.com/alexzel/iomem/commit/dc535854b5f7ac71ce9af09c3d7f4dc1ac0935e6))

## [1.4.5](https://github.com/alexzel/iomem/compare/v1.4.4...v1.4.5) (2023-01-30)


### Bug Fixes

* fix quit command test failing time to time ([1d82063](https://github.com/alexzel/iomem/commit/1d82063ef8a73d8e768a9a7593d578f60f3c8d2f))
* fix readme and client options comments ([42267ea](https://github.com/alexzel/iomem/commit/42267eaa6d38c8894098b278161e1172693ee24f))

## [1.4.4](https://github.com/alexzel/iomem/compare/v1.4.3...v1.4.4) (2023-01-30)


### Bug Fixes

* fix contributing.md file ([e17c740](https://github.com/alexzel/iomem/commit/e17c740dff47c4a6a939a15be6ca29c228471499))

## [1.4.3](https://github.com/alexzel/iomem/compare/v1.4.2...v1.4.3) (2023-01-30)


### Bug Fixes

* update files list in package.json ([9159ee8](https://github.com/alexzel/iomem/commit/9159ee81bed060dd83a592aa4729b17ec2c0edf7))

## [1.4.2](https://github.com/alexzel/iomem/compare/v1.4.1...v1.4.2) (2023-01-30)


### Miscellaneous Chores

* release 1.4.2 ([e94c561](https://github.com/alexzel/iomem/commit/e94c5610c535fec82fe94694121292cced594024))

## [1.4.1](https://github.com/alexzel/iomem/compare/v1.4.0...v1.4.1) (2023-01-30)


### Miscellaneous Chores

* release 1.4.1 ([24959c8](https://github.com/alexzel/iomem/commit/24959c8dd3ec29ebc1acc5d9fee2ef71d0a32a48))

## [1.4.0](https://github.com/alexzel/iomem/compare/v1.3.0...v1.4.0) (2023-01-29)


### ⚠ BREAKING CHANGES

* version and stat commands should return data by a hostname

### Bug Fixes

* make flush with expiry argument work properly ([9d63ee6](https://github.com/alexzel/iomem/commit/9d63ee64eb2592510db509bf337a5bba2a3ad5e2))
* version and stat commands should return data by a hostname ([a5206cd](https://github.com/alexzel/iomem/commit/a5206cd4e87bd4389af68bc682641820372e4d45))


### Miscellaneous Chores

* release 1.4.0 ([ccc4f4e](https://github.com/alexzel/iomem/commit/ccc4f4ef4c8ec735021ae41836c07ec16a09de8c))

## [1.3.0](https://github.com/alexzel/iomem/compare/v1.2.0...v1.3.0) (2023-01-26)


### Features

* implement Mem.setDefaultExpiry for static methods expiry ([78929de](https://github.com/alexzel/iomem/commit/78929de1ea58701e84e81c89eb87dd4bddc9ab5f))

## [1.2.0](https://github.com/alexzel/iomem/compare/v1.1.2...v1.2.0) (2023-01-26)


### Features

* add keepAliveInitialDelay config option ([cb061a1](https://github.com/alexzel/iomem/commit/cb061a19a749c131c0e0668203672f123f6f658e))


### Bug Fixes

* fix connection timeout and keep sockets alive ([314af45](https://github.com/alexzel/iomem/commit/314af456e1e9cbe310103edf0bd8da47c229f63c))

## [1.1.2](https://github.com/alexzel/iomem/compare/v1.1.1...v1.1.2) (2023-01-25)


### Bug Fixes

* fix readme typo ([949d23f](https://github.com/alexzel/iomem/commit/949d23f08f2d743aecd70346b26a42d17a742212))
* fix sections formatting in readme file ([75df76f](https://github.com/alexzel/iomem/commit/75df76f3b8112f0465d3fb40443b7f8934f15d00))

## [1.1.1](https://github.com/alexzel/iomem/compare/v1.1.0...v1.1.1) (2023-01-25)


### Bug Fixes

* readme has to point the client arguments at a first place ([20ce035](https://github.com/alexzel/iomem/commit/20ce035651d0663ad42783eef1cbe17618e80a15))

## [1.1.0](https://github.com/alexzel/iomem/compare/v1.0.0...v1.1.0) (2023-01-25)


### Features

* implement failover servers ([e51acb3](https://github.com/alexzel/iomem/commit/e51acb3459289950470f3f317feb0b150c8badf4))

## [1.0.0](https://github.com/alexzel/iomem/compare/v0.2.4...v1.0.0) (2023-01-25)


### Features

* implement gat command ([611c447](https://github.com/alexzel/iomem/commit/611c447ef95f9678b20cdbb33baae6c8c92b9850))
* implement stat command ([b4db682](https://github.com/alexzel/iomem/commit/b4db682f688f2007dc50d1f9b1df39815a033fcd))
* implement touch command ([1d59ad3](https://github.com/alexzel/iomem/commit/1d59ad3c89cecd761166f5188b1557b1eed4a199))


### Miscellaneous Chores

* release 1.0.0 ([4e14d7b](https://github.com/alexzel/iomem/commit/4e14d7b94021367e0a591c3072d7d0b5fd0e66da))

## [0.2.4](https://github.com/alexzel/iomem/compare/v0.2.3...v0.2.4) (2023-01-25)


### Bug Fixes

* bump jest (and force new release generation) ([6e88f4c](https://github.com/alexzel/iomem/commit/6e88f4c04f0d34617ef85ceb722cd5c74b612c25))
* fix ci badge in the readme file ([4f3bdf7](https://github.com/alexzel/iomem/commit/4f3bdf71b7482d67e40a966c01e9bd126697afef))
* try to fix release publishing thing ([6341d72](https://github.com/alexzel/iomem/commit/6341d7285eae3b5f7b633a549a1e131e06e303b2))
