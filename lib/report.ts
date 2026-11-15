import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Summary facts and generation time for one token radar run. */
export interface RunReport {
  generated_at: string;
  protocol_count: number;
  watchlist_count: number;
  board_rows: number;
  early_rows: number;
  live_rows: number;
  output_dir: string;
  screenshot_count: number;
}

/** Build a report from run counts, recording the current UTC time. */
export function makeRunReport(o: {
  protocolCount: number;
  watchlistCount: number;
  boardRows: number;
  earlyRows: number;
  liveRows: number;
  outputDir: string;
  screenshotCount: number;
}): RunReport {
  return {
    generated_at: new Date().toISOString(),
    protocol_count: o.protocolCount,
    watchlist_count: o.watchlistCount,
    board_rows: o.boardRows,
    early_rows: o.earlyRows,
    live_rows: o.liveRows,
    output_dir: o.outputDir,
    screenshot_count: o.screenshotCount,
  };
}

/** Format the existing two newline-terminated stdout summary lines. */
export function describeRunReport(r: RunReport): string {
  return `Snapshot: ${r.protocol_count} protocols, ${r.watchlist_count} watchlist entries; ` +
    `${r.board_rows} board rows, ${r.early_rows} early rows, ${r.live_rows} live rows.\n` +
    `Wrote ${join(r.output_dir, 'board.json')}, ${join(r.output_dir, 'data.js')}, ${join(r.output_dir, 'dashboard')}/, ` +
    `${join(r.output_dir, 'screenshots')}/ (${r.screenshot_count} shots), and ${join(r.output_dir, 'dossier.json')}.\n`;
}

/** Write run-report.json into an existing directory and return its path. */
export function writeRunReport(dir: string, r: RunReport): string {
  const reportPath: string = join(dir, 'run-report.json');
  writeFileSync(reportPath, JSON.stringify(r, null, 2) + '\n');
  return reportPath;
}
