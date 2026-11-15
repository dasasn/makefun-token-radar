/**
 * Read /input/snapshot.json and score pre-token protocols with lib/model.ts.
 * Publish board.json and data.js, copy dashboard/ and screenshots/, and package
 * the resulting artifacts into dossier.json.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { makeRunReport, describeRunReport, writeRunReport } from './lib/report.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const TEXT_MAX_BYTES = 65536;
const SCREENSHOT_CAPS = { max: 4, max_bytes: 524288 };
const IMAGE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

function arg(name: string, fallback: string): string {
  const flag: string = `--${name}`;
  const argumentsList: string[] = process.argv.slice(2);
  for (const [index, argument] of argumentsList.entries()) {
    if (argument === flag) return argumentsList[index + 1] ?? fallback;
    if (argument.startsWith(`${flag}=`)) return argument.slice(flag.length + 1);
  }
  return fallback;
}

function fail(message: string): never {
  process.stderr.write('token radar: ' + message + '\n');
  process.exit(1);
}

function requireSnapshot(file: string): void {
  if (!existsSync(file)) fail(`Snapshot file not found: ${file}; pass --input <snapshot.json|directory>.`);
}

function assertImageCount(shots: string[]): void {
  if (shots.length < 3) fail(`At least three screenshots are required; copied ${shots.length}: hand in the board, a detail view and a filtered view.`);
}

function assertImageNames(shots: string[]): void {
  for (const name of shots) {
    if (!IMAGE_NAME.test(name)) fail(`Invalid screenshot filename: ${name}`);
  }
}

function summarise(
  snapshot: ReturnType<typeof parseSnapshot>,
  board: ReturnType<typeof buildRadar>['board'],
  radar: ReturnType<typeof buildRadar>['radar'],
  out: string,
  shots: string[],
): void {
  const report = makeRunReport({
    protocolCount: snapshot.protocols.length,
    watchlistCount: snapshot.watchlist.length,
    boardRows: board.length,
    earlyRows: radar.early_size,
    liveRows: radar.live_size,
    outputDir: out,
    screenshotCount: shots.length,
  });
  writeRunReport(out, report);
  process.stdout.write(describeRunReport(report));
}

function copyFiles(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copiedNames: string[] = [];
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const sourcePath: string = join(from, name);
    if (statSync(sourcePath).isFile()) {
      copyFileSync(sourcePath, join(to, name));
      copiedNames.push(name);
    }
  }
  return copiedNames;
}

const input: string = arg('input', '/input');
const snapshotPath: string = input.endsWith('.json') ? input : join(input, 'snapshot.json');
requireSnapshot(snapshotPath);

const out: string = arg('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const snapshot: ReturnType<typeof parseSnapshot> = parseSnapshot(readFileSync(snapshotPath, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const issue: string | null = boardIssue(board, snapshot);
if (issue !== null) fail(issue);

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'board.json'), JSON.stringify({ rows: board }) + '\n');
writeFileSync(join(out, 'data.js'), dataScript(radar));

copyFiles(join(here, 'dashboard'), join(out, 'dashboard'));
const shots: string[] = copyFiles(join(here, 'screenshots'), join(out, 'screenshots'));
assertImageCount(shots);
assertImageNames(shots);

writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: TEXT_MAX_BYTES,
  screenshots: SCREENSHOT_CAPS,
  dashboard: { max_files: 400, max_bytes: 4194304 },
}));

summarise(snapshot, board, radar, out, shots);
