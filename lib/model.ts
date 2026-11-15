// The token radar's model: one snapshot of the protocol universe in, one ranked board out.
//
// Every watchlist slug is retained. Additional symbol-null protocols above the floor and the strongest
// early candidates below it are ranked; issued tokens are kept in a separate market-data view unless
// watchlist coverage requires them, in which case a disclosed 90% relevance discount applies.
//
// Implied value follows only from the snapshot's own figures:
//
//   base       = max(0, tvl_usd) x category_multiple x (base_multiple / 0.25)
//   growthMult = 1 + clamp(change_7d, -60, 40) / 100 x 0.5
//   maturity   = 1 + 0.15 x max(0, 1 - age_days / 730) x clamp(change_7d / 20, 0, 1)
//   chains     = 1 + 0.05 x log2(clamp(distinct_chain_count, 1, 8))
//   implied    = round(base x growthMult x maturity x chains x token_relevance)
// Positive reported market cap is a ceiling, not an input that inflates fundamentals. Final values are
// bounded to [1, 1e14]. Missing growth or age earns no bonus. Only snapshot.as_of determines age.
//
// Category multiples are conservative house assumptions about fee capture, not fitted market comps:
// lending/DEX activity monetizes TVL more directly than pass-through bridges and yield wrappers.
// TVL is not revenue; no revenue, token rights, supply or allocation is available. This is a conditional
// aggregate token-value proxy, not a per-token price, airdrop payout, or issuance/timing forecast.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  base_multiple: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
}

export const MODEL: ModelConstants = {
  base_multiple: 0.25,
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 40,
  maturity_floor: 1,
  maturity_range: 0.15,
  maturity_days: 730,
  unknown_age_days: 730,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

export const CATEGORY_MULTIPLES: Readonly<Record<string, number>> = {
  Lending: 0.6,
  'Uncollateralized Lending': 0.3,
  Dexs: 0.5,
  Derivatives: 0.45,
  'Interest Rate Derivatives': 0.4,
  Options: 0.35,
  'Prediction Market': 0.35,
  CDP: 0.35,
  'CDP Manager': 0.18,
  'Collateral Markets': 0.3,
  'Collateral Management': 0.18,
  RWA: 0.2,
  'Risk Curators': 0.15,
  'Onchain Capital Allocator': 0.18,
  'Liquidity Manager': 0.15,
  Yield: 0.12,
  'Yield Aggregator': 0.1,
  Farm: 0.08,
  'Leveraged Farming': 0.12,
  'Basis Trading': 0.12,
  'Options Vault': 0.12,
  'Liquid Staking': 0.12,
  'Staking Pool': 0.1,
  Restaking: 0.18,
  'Liquid Restaking': 0.15,
  'Restaked BTC': 0.1,
  'Anchor BTC': 0.04,
  'Decentralized BTC': 0.08,
  Bridge: 0.04,
  'Cross Chain Bridge': 0.06,
  'Canonical Bridge': 0.025,
  'Stablecoin Wrapper': 0.06,
  'Stablecoin Issuer': 0.25,
  'Dual-Token Stablecoin': 0.15,
  'Algo-Stables': 0.08,
  CeDeFi: 0.08,
  Chain: 0.1,
  Insurance: 0.2,
  Indexes: 0.1,
  Payments: 0.2,
  'Crypto Card Issuer': 0.1,
  'OTC Marketplace': 0.25,
  'Governance Incentives': 0.15,
  Privacy: 0.1,
  CEX: 0.025,
};

/** Maximum additional pre-token protocols below the floor, selected by implied value. */
export const EARLY_ROWS = 160;

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token' | 'live-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    base_multiple: number;
    category_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    token_multiplier: number;
    market_cap_ceiling_usd: number | null;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's row data, including the same farm plan and valuation used by the board. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  farm_steps: string[];
  valuation: BoardRow['model'];
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  methodology: {
    formula: string;
    interpretation: string;
    category_multiples: Readonly<Record<string, number>>;
    default_category_multiple: number;
  };
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The snapshot-only valuation and its independently inspectable factors. */
export function impliedValue(protocol: SnapshotProtocol, asOf: string, model: ModelConstants): {
  implied: number; growthPct: number; growthMult: number; maturityMult: number;
  chainMult: number; tokenMult: number; categoryMultiple: number; baseMultiple: number;
  marketCapCeiling: number | null; age: number | null;
} {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const freshness = Math.max(0, 1 - ageForModel / model.maturity_days);
  const maturityMult = model.maturity_floor + freshness * model.maturity_range * Math.min(1, Math.max(0, growthPct) / 20);
  const chainCount = new Set(protocol.chains.map((chain) => chain.trim().toLowerCase()).filter(Boolean)).size;
  const chainMult = 1 + 0.05 * Math.log2(Math.min(8, Math.max(1, chainCount)));
  const categoryMultiple = CATEGORY_MULTIPLES[protocol.category ?? ''] ?? 0.1;
  const baseMultiple = categoryMultiple * (model.base_multiple / 0.25);
  const tokenMult = isPreToken(protocol) ? 1 : 0.1;
  const marketCapCeiling = protocol.mcap_usd !== null && protocol.mcap_usd > 0 ? protocol.mcap_usd : null;
  const base = Math.max(0, protocol.tvl_usd) * baseMultiple;
  const value = base * growthMult * maturityMult * chainMult * tokenMult;
  const implied = Math.max(1, Math.round(Math.min(1e14, marketCapCeiling ?? 1e14, value)));
  return { implied, growthPct, growthMult, maturityMult, chainMult, tokenMult, categoryMultiple, baseMultiple, marketCapCeiling, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** The snapshot's symbol is the issuance flag; market metadata alone does not prove issuance. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.symbol === null;
}

/** Whether a protocol is one the board may rank: pre-token, not an exchange, not a versioned pool. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && p.category !== 'CEX' && !VERSIONED.test(p.name);
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The headline sentence's figures: how many watchlist slugs, how many rows, how many live protocols. */
export interface BoardSummary {
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p === undefined) throw new SnapshotError(`watchlist slug ${slug} has no protocol record`);
    chosen.set(slug, p);
  }
  const candidates = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p))
    .map((p) => ({ p, ...impliedValue(p, snapshot.as_of, model) }))
    .sort((left, right) => right.implied - left.implied || (left.p.slug < right.p.slug ? -1 : left.p.slug > right.p.slug ? 1 : 0));
  let earlyCount = 0;
  for (const candidate of candidates) {
    if (chosen.size >= 4000) break;
    if (candidate.p.tvl_usd < snapshot.floor_usd) {
      if (earlyCount >= EARLY_ROWS) continue;
      earlyCount++;
    }
    chosen.set(candidate.p.slug, candidate.p);
  }
  const scored = [...chosen.values()]
    .map((p) => ({ p, ...impliedValue(p, snapshot.as_of, model) }))
    .sort((left, right) => right.implied - left.implied || (left.p.slug < right.p.slug ? -1 : left.p.slug > right.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: isPreToken(s.p) ? 'pre-token' : 'live-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      base_multiple: s.baseMultiple,
      category_multiple: s.categoryMultiple,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      chain_multiplier: round4(s.chainMult),
      token_multiplier: s.tokenMult,
      market_cap_ceiling_usd: s.marketCapCeiling,
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** An optional monitoring horizon, not an inferred rewards qualification window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

function activityFor(p: SnapshotProtocol, capital: number): { enter: string; manage: string; exit: string } {
  const category = (p.category ?? '').toLowerCase();
  if (category.includes('uncollateralized')) return {
    enter: `Check borrower disclosures, default history and lender eligibility; only lend up to $${capital} in an accepted asset if the credit risk and minimum deposit fit.`,
    manage: 'Monitor borrower repayments, arrears and pool utilization; a points campaign cannot compensate for principal default risk.',
    exit: 'Request redemption through the lending pool; confirm maturity dates and withdrawal queues before committing more capital.',
  };
  if (category.includes('lend') || category.includes('collateral')) return {
    enter: `Choose an officially supported supply market with available withdrawal liquidity; test a small supply and then supply at most $${capital} of its accepted asset.`,
    manage: 'Compare supply APR with utilization. Borrow only if needed and supported, keep collateral health factor above 2, and compare borrowing interest against any documented points; do not loop for volume.',
    exit: 'Repay any borrowing and accrued interest before withdrawing collateral; withdraw supplied assets and revoke unused approvals.',
  };
  if (category.includes('cdp')) return {
    enter: `Check accepted collateral, stability fees and liquidation ratio; open a small vault with at most $${capital} collateral only if its minimum debt permits conservative borrowing.`,
    manage: 'Keep collateralization at least twice the liquidation threshold; monitor peg deviations and interest rather than maximizing minted debt for points.',
    exit: 'Repay minted stablecoins plus accrued fees, close the vault and reclaim collateral; budget for peg slippage.',
  };
  if (category.includes('dex') || category.includes('liquidity manager')) return {
    enter: `Inspect supported LP pairs, pool depth, fee tier and any range settings; test an add/remove liquidity cycle before committing up to $${capital} to a pool you understand.`,
    manage: 'Track LP fee income net of impermanent loss; rebalance only when needed. Count only genuine swaps toward any documented volume program; never wash trade or churn volume for points.',
    exit: 'Remove LP liquidity, collect accrued fees and compare final asset balances with simply holding the pair.',
  };
  if (category.includes('bridge') || category.includes('anchor btc') || category.includes('decentralized btc')) return {
    enter: `Verify supported source/destination networks and exact receipt-token addresses; test the smallest permitted transfer before routing at most $${capital} you actually need to move.`,
    manage: 'Confirm destination receipt and finality, record both transaction hashes, and compare bridge fees with any explicitly published route incentives; avoid circular volume farming.',
    exit: 'Test the documented return or redemption route; check custody, exit fees and finality delays before increasing bridged exposure.',
  };
  if (category.includes('staking') || category.includes('restak')) return {
    enter: `Confirm accepted staking assets and receipt contracts; stake at most $${capital} equivalent after reading validator, slashing and withdrawal-queue terms.`,
    manage: 'Track net staking yield, receipt-token discount and any documented points multipliers; avoid borrowing against receipts solely to lever points exposure.',
    exit: 'Compare receipt-token sale slippage with the official unstaking queue; test a small redemption and retain gas for the final claim.',
  };
  if (category.includes('rwa')) return {
    enter: `Read investor eligibility, KYC, issuer and legal redemption terms first; only subscribe up to $${capital} of an accepted asset if the minimum and access rules permit it.`,
    manage: 'Check issuer reports, custody, underlying credit exposure and net yield; do not treat a transferable receipt as proof of immediate redemption.',
    exit: 'Use the issuer-approved redemption process; record settlement dates, fees and any banking or stablecoin conversion costs.',
  };
  if (category.includes('curator') || category.includes('allocator') || category.includes('yield') || category.includes('farm') || category.includes('basis') || category.includes('vault') || category.includes('index')) return {
    enter: `Inspect a documented vault's actual underlying assets, strategy, fees and withdrawal liquidity; test deposit/redemption before allocating at most $${capital}.`,
    manage: 'Track vault share price and net yield against the underlying asset; inspect leverage, strategy allocation and any documented points pass-through to depositors.',
    exit: 'Redeem vault shares through the documented queue and compare proceeds with the underlying benchmark after performance and exit fees.',
  };
  if (category.includes('derivative') || category.includes('option')) return {
    enter: `Read contract specifications, oracle rules and supported margin assets; use a test trade or defined-loss position with at most $${capital} at risk, only if you need that hedge.`,
    manage: 'Track funding, spread, liquidation or expiry risk and realized fees; participate in published trading rewards only when a genuine hedge remains economical.',
    exit: 'Close the position or settle it at expiry, cancel resting orders and withdraw unused margin; log net PnL after fees.',
  };
  if (category.includes('prediction')) return {
    enter: `Read market resolution sources and dispute rules; if legally eligible, take a small outcome position with maximum loss below $${capital}.`,
    manage: 'Monitor market depth and resolution deadlines; trade only a view you hold, not self-matched volume for a leaderboard.',
    exit: 'Sell through available liquidity or redeem after final resolution; include spreads and dispute delays in realized returns.',
  };
  if (category.includes('stable')) return {
    enter: `Check reserve composition, supported mint assets and redemption rights; test a small mint/redeem cycle before holding up to $${capital}.`,
    manage: 'Monitor the peg, reserve disclosures and mint/redemption fees; use an incentive vault only if the official documentation supports the exact receipt asset.',
    exit: 'Redeem through the documented reserve mechanism or compare secondary-market slippage; do not assume every holder has direct redemption access.',
  };
  if (category.includes('insurance')) return {
    enter: 'Compare covered events, exclusions, premium and claim rules; buy cover only for exposure you actually hold, not to manufacture activity.',
    manage: 'Record policy expiry, claim deadlines and coverage limits; inspect any official rewards rules without assuming premiums earn points.',
    exit: 'Let unneeded cover expire or use a documented cancellation path; remove any recurring renewal authorization.',
  };
  if (category === 'chain') return {
    enter: `Verify the official network ID and RPC, fund only necessary native gas, and test a supported onchain app with at most $${capital}; chain TVL is not a deposit product.`,
    manage: 'Use real transfers or applications you need; check official ecosystem campaign rules separately and avoid repetitive transactions for unverified points.',
    exit: 'Close application positions first, then test the official withdrawal route while retaining enough native gas to finish.',
  };
  return {
    enter: `Find the documented ${p.category ?? 'protocol'} product and supported assets first; make a small test only if there is a suitable permissionless action. Do not assume a USDC deposit or farming program exists.`,
    manage: 'Match each intended action to published product and rewards rules; if no verified farming path exists, monitor disclosures without committing capital.',
    exit: 'Use the documented withdrawal, settlement or cancellation process for the actual product; verify receipt and revoke unneeded spending approvals.',
  };
}

/**
 * Six category-specific actions from the protocol's own record, without inventing assets or rewards.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const activity = activityFor(p, capital);
  const label = `${p.name} (${p.category ?? 'uncategorized'}) on ${chain}`;
  const networks = p.chains.length > 0 ? p.chains.slice(0, 4).join(', ') : 'no chains recorded';
  const growth = p.change_7d === null ? '7d TVL change unavailable' : `7d TVL change ${p.change_7d.toFixed(2)}%`;
  return [
    {
      text: `${label}: verify the official app and deployed contracts before connecting a limited-balance wallet. Snapshot TVL is $${Math.round(p.tvl_usd)} (${growth}); listed networks include ${networks}. TVL alone is not proof of safety; confirm the specific route and accepted assets.`,
      cost: 'no transaction; estimate current network gas before funding',
      time: '15 minutes of checks',
    },
    {
      text: `${label}: ${activity.enter}`,
      cost: `up to $${capital} risk budget, only if affordable; quoted gas and product fees extra`,
      time: '20 minutes, subject to product eligibility',
    },
    {
      text: `${label}: ${activity.manage}`,
      cost: 'check actual interest, gas, slippage and fees before each action',
      time: 'review weekly; monitor leveraged exposure daily',
    },
    {
      text: `${label}: use ${hold} days as a review horizon, not a qualification rule. Compare the position's liquidity and net yield with the snapshot's $${Math.round(p.tvl_usd)} TVL baseline; reduce exposure if withdrawals deteriorate or losses exceed your budget. Exit earlier when needed.`,
      cost: 'capital at risk and opportunity cost while exposed',
      time: `review over up to ${hold} days; no mandatory hold inferred`,
    },
    {
      text: `${label}: ${isPreToken(p) ? 'No issued token is recorded. Check official documentation for any existing points program, eligibility and exclusions; if none is documented, assume no points benefit.' : 'A token is already recorded. Compare published liquidity or usage incentives with token emissions, vesting and net fees; points are not a reason to buy it.'} If a token is live when you act, use only verified reward contracts and value claimable rewards after gas. Neither issuance nor timing is assumed.`,
      cost: 'free to inspect; legitimate onchain claims may require network gas, never a seed phrase',
      time: '10 minutes before funding or claiming',
    },
    {
      text: `${label}: ${activity.exit} Record amounts, transaction hashes, fees and realized rewards in your ${p.name} farm log before deciding whether to repeat.`,
      cost: 'quoted exit gas, accrued interest and any redemption fees',
      time: 'test exit now; final settlement follows documented product terms',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** The authoritative board factors and farm plan carried through to data.js. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    farm_steps: row.farm_steps,
    valuation: row.model,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug) && r.tvl_usd < snapshot.floor_usd).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    methodology: {
      formula: 'round(min(1e14, positive_mcap_or_1e14, max(0,tvl_usd) * category_multiple * (base_multiple/0.25) * growth_multiplier * maturity_multiplier * chain_multiplier * token_multiplier)), floored at 1',
      interpretation: 'Conditional aggregate token-value proxy at the recorded fundamentals, not price per token, allocation, payout or issuance forecast. Category multiples are house assumptions, not revenue or fitted market comps. Growth is percentage points, capped at -60/+40 by default. Young-and-growing earns up to 15%; unknown age/growth earns no bonus. Distinct chains earn up to 15%, not proof of diversified TVL. Issued tokens are excluded except required watchlist rows, discounted 90%; positive market cap only caps value. Plans require verification: no rewards program, supported asset, token rights or qualifying action is inferred from TVL.',
      category_multiples: CATEGORY_MULTIPLES,
      default_category_multiple: 0.1,
    },
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  if (board.length < 100 || board.length > 4000) return `the board has ${board.length} rows; expected 100..4000`;
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const watchlist = new Set(snapshot.watchlist);
  const outside = board.filter((row) => !watchlist.has(row.slug)).length;
  if (outside < 60) return `the board has only ${outside} rows outside the watchlist; expected at least 60`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const step of steps) {
      if (typeof step !== 'string') return `${r.slug} has a non-string farm step`;
      if (step.trim().length < 20 || step.trim().length > 600) return `${r.slug} has a farm step of ${step.trim().length} trimmed characters`;
    }
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0 || r.implied_value_usd > 1e14) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
