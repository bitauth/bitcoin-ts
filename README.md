[![NPM version](https://img.shields.io/npm/v/bitcoin-ts.svg)](https://www.npmjs.com/package/bitcoin-ts)
[![Codecov](https://img.shields.io/codecov/c/github/bitjson/bitcoin-ts.svg)](https://codecov.io/gh/bitjson/bitcoin-ts)
[![CircleCI](https://img.shields.io/circleci/project/github/bitjson/bitcoin-ts.svg)](https://circleci.com/gh/bitjson/bitcoin-ts)
[![GitHub stars](https://img.shields.io/github/stars/bitjson/bitcoin-ts.svg?style=social&logo=github&label=Stars)](https://github.com/bitjson/bitcoin-ts)

# bitcoin-ts

A flexible, strongly-typed, FP-inspired, highly-portable, typescript bitcoin library.

## Work in Progress

While this library is a work in progress, the currently-exposed functionality is production-ready (WASM secp256k1 implementation).

More functionality will be exposed in future versions.

## Design Goals

This library should provide the primitives needed to [hack](http://www.paulgraham.com/gh.html) on Bitcoin and Bitcoin-related ideas.

1.  **flexible** - Consumers should be able to import only the functionality they need
2.  **simple** - Functions should be simple and return one type
3.  **portable** – All code should work on every platform (no Node.js bindings or separate browser versions)

Please see the [Design Guidelines](.github/CONTRIBUTING.md) for more info.

## Usage

To use, simply install `bitcoin-ts`:

```sh
npm install bitcoin-ts
# OR
yarn add bitcoin-ts
```

And import the functionality you need:

```typescript
import { instantiateSecp256k1 } from 'bitcoin-ts';
import { msgHash, pubkey, sig } from './somewhere';

(async () => {
  const secp256k1 = await instantiateSecp256k1();
  secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
    ? console.log('🚀 Signature valid')
    : console.log('❌ Signature invalid');
})();
```

## Documentation

[**API Documentation →**](https://bitjson.github.io/bitcoin-ts/)

You can explore the internals of the library by browsing the generated documentation, or you can use the `Only exported` checkbox (at the top right) to only view functionality available to consumers. Below are some notable areas:

- [instantiateSecp256k1](https://bitjson.github.io/bitcoin-ts/globals.html#instantiatesecp256k1)
- [Secp256k1 Interface](https://bitjson.github.io/bitcoin-ts/interfaces/secp256k1.html)

## Contributing

Pull Requests welcome! Please see [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) for details.

This library requires [Yarn](https://yarnpkg.com/) for development. If you don't have Yarn, make sure you have `Node.js` installed (which ships with `npm`), then run `npm install -g yarn`. Once Yarn is installed:

```sh
# --recursive is required since source file for secp256k1 is hosted as submodule
git clone --recursive https://github.com/bitjson/bitcoin-ts.git && cd bitcoin-ts
```

Install the development dependencies:

```
yarn
```

Then try running the test suite:

```
yarn test
```

You can also run the benchmarks (this may take a while):

```sh
yarn bench
```

For more information about the available package scripts, run:

```sh
yarn run info
```
