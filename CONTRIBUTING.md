# Contributing

You are welcome to contribute!

## Issue

Wheather you have found a bug or want to request a feature please [open an issue](https://github.com/alexzel/iomem/issues/new/choose).


## Pull request

### Rules 

- Commit messages must comply with [Conventional Commits](https://www.conventionalcommits.org/) specification.

- Code style must comply with [JavaScript Standard Style](https://standardjs.com/).

- PR must pass all the tests in order to proceed with code review.

- All new feature PRs must have a corresponding issue created prior to submitting a PR.

- PR must NOT include any changes which are not releated to the actual fix or feature.

- The code changes must not increase time or space complexity.

### Testing

In order to run tests locally you must have a local copy of [Memcached](https://github.com/memcached/memcached) on `127.0.0.1:11211`.
You can run Memcached in Docker with SASL enabled by using the corresponding `package.json` scripts:

```sh
yarn docker:build
yarn docker:run
```

Run code linting and tests with `test` script:

```sh
yarn test
```

Run only code linting with `lint` script:

```sh
yarn lint
```
