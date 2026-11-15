# Token Radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/dasasn/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/dasasn/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A snapshot-driven research board for protocols that have not launched a token.
It ranks candidates by implied aggregate token value and provides a local
browser dashboard for exploring the results. Estimates are not token prices,
airdrop forecasts, or investment recommendations.

## What the entry point does

`main.ts` reads `/input/snapshot.json` by default and parses the protocol universe.
It uses `lib/model.ts` to score pre-token protocols by implied value, combining
TVL, category assumptions, bounded growth, maturity, and chain coverage.
The model retains watchlist coverage and separates live-token market data.

The entry validates the board, then writes `board.json` and `data.js` to the
output directory. It copies the repository's `dashboard/` and `screenshots/`
files into that directory, then packages the artifacts into `dossier.json`.
A successful run also writes `run-report.json` with counts and output details.
The screenshot files are supplied assets; this command does not capture new ones.

## Run locally

Use a recent Node.js version that can execute TypeScript directly, such as
Node.js 22.18 or newer. From the repository root, run:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

Replace the input path if your snapshot lives elsewhere. Without an output
override, files go to `/output`; `--output` takes precedence over the environment.
Open `out/dashboard/index.html` to browse the generated data without a server.
Keep `out/data.js` beside `out/dashboard/` so the page can load its dataset.

## File map

- `main.ts` — input handling, artifact generation, copying, and dossier assembly.
- `lib/model.ts` — snapshot types, scoring rules, rankings, and dashboard data.
- `lib/report.ts` — run summary formatting and the machine-readable run report.
- `dashboard/` — page shell, styles, and browser-side filtering and details.
- `screenshots/` — board, detail, and filtered-view images used in the dossier.
- `vendor/makefun-board.ts` — dossier packaging and artifact constraints.
- `out/` — local generated board, browser bundle, copied images, and reports.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
