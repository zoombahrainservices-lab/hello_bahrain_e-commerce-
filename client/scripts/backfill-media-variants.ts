/**
 * Backfill missing optimized image variants for existing media library items.
 *
 * Usage (from client/ directory):
 *   npm run media:backfill-variants
 *   npm run media:backfill-variants -- --limit=100 --offset=0
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_* variables.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const args = process.argv.slice(2);
  let limit = 50;
  let offset = 0;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1], 10) || 50;
    if (arg.startsWith('--offset=')) offset = parseInt(arg.split('=')[1], 10) || 0;
  }

  const { backfillMediaVariants } = await import('../src/lib/media/variant-service');

  console.log(`Starting media variant backfill (limit=${limit}, offset=${offset})...`);

  const report = await backfillMediaVariants({ limit, offset, onlyMissing: true });

  console.log('\n── Backfill complete ──');
  console.log(`Processed: ${report.processed}`);
  console.log(`Succeeded: ${report.succeeded}`);
  console.log(`Failed:    ${report.failed}`);
  console.log(`Generated: ${report.totalGenerated} variant file(s)`);

  for (const item of report.items) {
    if (item.generated.length > 0 || item.errors.length > 0) {
      console.log(`\n• ${item.fileName} (${item.mediaId})`);
      if (item.generated.length) console.log(`  ✓ Generated: ${item.generated.join(', ')}`);
      if (item.errors.length) console.log(`  ✗ Errors: ${item.errors.join('; ')}`);
    }
  }

  if (report.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
