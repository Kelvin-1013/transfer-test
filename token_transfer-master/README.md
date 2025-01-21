# Token-Transfer(Solana Rust Program)

This is an anchor project for token transfer contract(Rust).

## Prerequisites

- Yarn 4.6.0
- Rustc 1.84.0
- Solana Cli 2.0.23
- Anchor Cli 0.30.0

## Getting Started

- `./Anchor.toml` file
    ```bash
    // Set anchor version
    [toolchain]
    anchor_version = "0.29.0"

    // Set your cluster and configure your wallet
    [provider]
    cluster = "Devnet"
    wallet = "./wallet.json"
    ```

- `./Cargo.toml` file
    ```bash
    // Set version as 3
    version = 3
    ```
- `./programs/token-transfer/Cargo.toml`
    ```bash
    // Check idl-build of [feature] and [dependencies] version.
    [features]
    default = []
    cpi = ["no-entrypoint"]
    no-entrypoint = []
    no-idl = []
    no-log-ix-name = []
    idl-build = [
        "anchor-lang/idl-build",
        "anchor-spl/idl-build"
    ]

    [dependencies]
    anchor-lang = "0.29.0"
    anchor-spl = "0.29.0"
    ```


- Build and deploy program

    ```bash
    anchor build
    anchor deploy
    ```

## Auther
- [Telegram](https://t.me/BTC0in23)
