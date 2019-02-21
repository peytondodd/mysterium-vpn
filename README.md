# Mysterium VPN - decentralized VPN built on blockchain

Mysterium VPN is a desktop application for accessing Mysterium Network - decentralized VPN built on blockchain.

- Homepage https://mysterium.network/
- [Whitepaper](https://mysterium.network/whitepaper.pdf)
- [Stable](https://github.com/mysteriumnetwork/mysterium-vpn/releases/latest) release

## Build Setup

**Note** that currently, the actually supported development environment is *OSX*. Other important ones like Plan9 and Linux is work in progress. And if You're developing on Windows You'll probably suffer lots of handy configuration.

* **Step 1.** Install project dependencies

Install `yarn` from https://yarnpkg.com/lang/en/docs/install/ and once you're all set, cd into your project's root directory.

```bash
brew install yarn
yarn install
```

* **Step 2.** Install Mysterium Node dependency
```bash
yarn download:bins:osx
```

**Purpose of script:**
- Download `myst` binary from https://github.com/mysteriumnetwork/node/releases and put it into your project's `bin` directory
- Download `update-resolv-conf` and other `myst` dependencies from https://github.com/mysteriumnetwork/node/tree/master/bin/package/config into your project's `bin/config` directory.
- Install `openvpn` from https://openvpn.net/ or for OSX with homebrew run `brew install openvpn`

* **Step 3.** Woolia! Run application
```bash
yarn dev
```

## Contributing

For instruction on how to contribute to this project, please read [CONTRIBUTING.md](./CONTRIBUTING.md).

## Code of Conduct

Can be found here [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[142eea4](https://github.com/SimulatedGREG/electron-vue/tree/142eea44aa50fdead91a469daedfcff04308c3fc) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).

# License

This project is licensed under the terms of the GNU General Public License v3.0 (see [details](./LICENSE)).

