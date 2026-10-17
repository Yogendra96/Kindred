fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see
[Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios test

```sh
[bundle exec] fastlane ios test
```

Run pre-flight checks (TypeScript and 267 test suite)

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS release binary (.ipa)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build and upload iOS release to Apple TestFlight

---

## Android

### android test

```sh
[bundle exec] fastlane android test
```

Run pre-flight checks (TypeScript and 267 test suite)

### android build

```sh
[bundle exec] fastlane android build
```

Build Android release App Bundle (.aab)

### android beta

```sh
[bundle exec] fastlane android beta
```

Build and upload Android release to Google Play Internal Testing track

---

This README.md is auto-generated and will be re-generated every time
[_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
