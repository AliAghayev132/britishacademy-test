/**
 * Seed CLI — thin wrapper around SeedService.
 *
 * The content graph + wipe/insert logic lives in services/SeedService.js so the
 * admin "Developer" panel can reuse it (POST /api/admin/dev/seed).
 *
 * Usage:
 *   node scripts/seed.js          # wipe BA collections and reseed
 *   node scripts/seed.js --dry    # build + validate every doc, no DB needed
 */
import { mongoDBService } from "#services";
import { buildGraph, validateGraph, seedDatabase } from "#services/SeedService.js";

const DRY = process.argv.includes("--dry");

async function run() {
  console.log(DRY ? "🧪 Dry seed (yalnız validasiya)\n" : "🌱 Seed başladı\n");

  if (DRY) {
    const { ok, total, errors } = validateGraph(buildGraph());
    errors.forEach((e) => console.error(`  ✗ ${e.key} "${e.name}": ${e.path} — ${e.message}`));
    console.log(`\n${ok ? "✓" : "✗"} ${total - errors.length}/${total} sənəd validasiyadan keçdi`);
    process.exit(ok ? 0 : 1);
  }

  await mongoDBService.connect();
  console.log("✅ MongoDB-yə qoşuldu");
  try {
    const { counts } = await seedDatabase();
    console.log("\n✓ Seed tamamlandı:");
    for (const [k, v] of Object.entries(counts)) console.log(`   ${k.padEnd(12)} ${v}`);
    await mongoDBService.disconnect?.();
    process.exit(0);
  } catch (err) {
    console.error("Seed xətası:", err.message);
    (err.details || []).forEach((e) => console.error(`  - ${e.key} "${e.name}": ${e.path} — ${e.message}`));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Seed xətası:", err);
  process.exit(1);
});
