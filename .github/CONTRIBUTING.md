# Contributing to bitcoin-ts

Thanks for your interest! Contributions are very welcome.

Below you'll find the conventions we're trying to follow. Of course, please feel free to send PRs to improve these guidelines too.

## Design Guidelines

- **start small, compose** - Compose larger functions from their smallest possible components.
- **export early and often** - Let consumers access functionality at all levels of complexity (for maximum remix-ability). Make it reasonable for consumers to substitute their own implementations where possible. For consumers where code-size is an issue, this library should be easily tree-shakable to the minimum possible code needed.
- **trust the caller** - Runtime type-checking is a code smell. If the function accepts a string, assume it's been given a string. TypeScript definitions should expose improperly called functions to the developer at compile time, don't re-implement it at runtime. (Where TypeScript's lack of dependent types prevents us from checking the validity of an input at compile time, resist the urge to check it at runtime. Trust that the caller can test their code themselves.)
- **simple > ergonomic** - Clever, javascript-y interfaces are fun until they're limiting. We export simple primitives; other projects can wrap this library to provide friendlier interfaces.
- **clarity > performance** - Performance is a secondary goal. If our consumers need to squeeze out performance from a single machine, they should switch to something lower-level. The best way to speed up a consumer of this library is to parallelize it across more hardware.
- **don't overvalue historical names** - Many Bitcoin implementations make imprecise (and even misleading) naming choices for historical reasons. We make little effort to match the type/function names of other Bitcoin implementations; names should be chosen to improve clarity.
- **don't add package dependencies** - This library should be as simple and stable as possible. Generally, if something is hard enough to warrant bringing in a dependency, it's something this library should provide. (Can you compile and expose a WASM version?)

## Some practical details

- **accept `readonly`, return mutable** - We should always return mutable types to allow consumers the option of mutating results without running afoul of type-checking. For the same reason, when we accept a value, we should always accept it as `readonly` for maximum flexibility.
- **use `tslint:disable-next-line` or `tslint:disable-line`** - It's ok to disable tslint; in some cases, rules should be disabled every time they're hit (e.g. `no-bitwise`). By using single-line disables, we clearly mark intentional deviations from our conventions.

## Areas for Improvement

### Thinner WASM Implementations/Imports

One area where we could improve in terms of the [`flexibility` Design Goal](../README.md#Design-Goals) (`Consumers should be able to import only the functionality they need`) is with WASM implementations.

While WASM can't currently be tree-shaken (in [the "live code inclusion" sense](https://medium.com/@Rich_Harris/tree-shaking-versus-dead-code-elimination-d3765df85c80)), we might be able to provide thinned-down versions of different WASM modules for use-cases which don't require the full module.

Our method for instantiating and wrapping the WASM module also prevents tree-shaking of unused wrapper code. (And breaks slightly from a purely-functional programming style.)

It may be better to instead provide each wrapper method as an individually exported function (which accepts a WASM object of the proper shape, as well as the parameters it currently accepts). E.g. rather than creating an object full of methods like:

```
wasm.method(param, param)
```

We would use pure-looking methods which accept the WASM object (fundamentally, you can't get much purer when using WASM):

```
methodWasm(wasm, param, param)
```
