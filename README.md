# makefun-token-radar

A token launch radar for make.fun's `token-radar-01` bounty: it scores every pre-token DeFi protocol in a DefiLlama snapshot and ranks them by what a token would be worth if the protocol's record stayed as it is.

`main.ts` reads `/input/snapshot.json`, ranks the protocols with the model in `lib/model.ts`, writes `board.json` and the dashboard's `data.js`, then builds `dossier.json` with the vendored `vendor/makefun-board.ts`.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input input/snapshot.json
```

## The model

Implied value is a category-aware multiple of TVL, lifted by capped 7-day growth and a young-and-growing bonus, widened by multi-chain presence. Issued tokens are set aside. Farm plans name the protocol, its category and its chains.
