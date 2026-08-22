import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const [sourceDbArg, sourceCivicId, targetCivicId, outputDirArg] = process.argv.slice(2);

if (!sourceDbArg || !sourceCivicId || !targetCivicId || !outputDirArg) {
  console.error("Usage: node scripts/prepare-founder-production-migration.mjs <source-db> <source-civic-id> <target-civic-id> <output-dir>");
  process.exit(1);
}

const sourceDb = resolve(sourceDbArg);
const outputDir = resolve(outputDirArg);
mkdirSync(outputDir, { recursive: true });

const db = new DatabaseSync(sourceDb, { readOnly: true });
const excludedTables = new Set([
  "_cf_METADATA",
  "d1_migrations",
  "sqlite_sequence",
  "citizens",
  "civic_sessions",
  "ledger_entries",
  "assessment_attempts",
  "assessment_attempt_questions",
  "public_analytics_daily",
  "editorial_publications",
  "editorial_ticker_announcements",
  "editorial_sync_runs",
]);

const tables = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all().map(({ name }) => String(name));

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const tableColumns = new Map();
const tableForeignKeys = new Map();
const selected = new Map();

for (const table of tables) {
  tableColumns.set(table, db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all());
  tableForeignKeys.set(table, db.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(table)})`).all());
}

function rowKey(table, row) {
  const columns = tableColumns.get(table) || [];
  const primary = columns.filter((column) => Number(column.pk) > 0).sort((a, b) => Number(a.pk) - Number(b.pk));
  const keys = primary.length ? primary.map((column) => column.name) : columns.map((column) => column.name);
  return keys.map((key) => `${key}:${String(row[key] ?? "<null>")}`).join("|");
}

function addRows(table, rows) {
  if (!rows.length || excludedTables.has(table)) return 0;
  if (!selected.has(table)) selected.set(table, new Map());
  const bucket = selected.get(table);
  let added = 0;
  for (const row of rows) {
    const key = rowKey(table, row);
    if (!bucket.has(key)) {
      bucket.set(key, row);
      added += 1;
    }
  }
  return added;
}

// Founder-scoped rows form the migration root. This deliberately excludes local
// sessions, test citizens, local ledger history, and public analytics.
for (const table of tables) {
  if (excludedTables.has(table)) continue;
  const columns = (tableColumns.get(table) || []).map((column) => String(column.name));
  const identityColumns = columns.filter((column) =>
    column === "civic_id" || column === "reporting_civic_id" || column === "responding_civic_id"
  );
  if (!identityColumns.length) continue;
  const where = identityColumns.map((column) => `${quoteIdentifier(column)} = ?1`).join(" OR ");
  addRows(table, db.prepare(`SELECT * FROM ${quoteIdentifier(table)} WHERE ${where}`).all(sourceCivicId));
}

// Pull bridge/detail rows that are children of already-selected founder records.
// We intentionally do not traverse from shared reference rows back into other
// citizens' records.
let changed = true;
while (changed) {
  changed = false;
  for (const childTable of tables) {
    if (excludedTables.has(childTable)) continue;
    for (const foreignKey of tableForeignKeys.get(childTable) || []) {
      const parentTable = String(foreignKey.table);
      const parentRows = [...(selected.get(parentTable)?.values() || [])];
      if (!parentRows.length) continue;
      const values = [...new Set(parentRows.map((row) => row[foreignKey.to]).filter((value) => value !== null && value !== undefined))];
      if (!values.length) continue;
      const placeholders = values.map((_, index) => `?${index + 1}`).join(", ");
      const rows = db.prepare(
        `SELECT * FROM ${quoteIdentifier(childTable)} WHERE ${quoteIdentifier(foreignKey.from)} IN (${placeholders})`
      ).all(...values);
      if (addRows(childTable, rows)) changed = true;
    }
  }
}

// Residence definitions are parent records that may be unique to the founder.
const residenceIds = [...(selected.get("residence_assignments")?.values() || [])]
  .map((row) => row.residence_id)
  .filter(Boolean);
if (residenceIds.length && tables.includes("residences")) {
  const placeholders = residenceIds.map((_, index) => `?${index + 1}`).join(", ");
  addRows("residences", db.prepare(`SELECT * FROM residences WHERE residence_id IN (${placeholders})`).all(...residenceIds));
}

function includeReferencedRows(table, idColumn, values) {
  const ids = [...new Set(values.filter(Boolean))];
  if (!ids.length || !tables.includes(table)) return;
  const placeholders = ids.map((_, index) => `?${index + 1}`).join(", ");
  addRows(table, db.prepare(
    `SELECT * FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(idColumn)} IN (${placeholders})`
  ).all(...ids));
}

includeReferencedRows(
  "contribution_positions",
  "position_id",
  [...(selected.get("contribution_assignments")?.values() || [])].map((row) => row.position_id),
);
includeReferencedRows(
  "usu_courses",
  "course_id",
  [
    ...[...(selected.get("learning_recommendations")?.values() || [])].map((row) => row.course_id),
    ...[...(selected.get("usu_enrollments")?.values() || [])].map((row) => row.course_id),
  ],
);

function mapped(value) {
  return typeof value === "string" ? value.replaceAll(sourceCivicId, targetCivicId) : value;
}

function sqlLiteral(value) {
  const finalValue = mapped(value);
  if (finalValue === null || finalValue === undefined) return "NULL";
  if (typeof finalValue === "number") return Number.isFinite(finalValue) ? String(finalValue) : "NULL";
  if (typeof finalValue === "bigint") return String(finalValue);
  if (finalValue instanceof Uint8Array) return `X'${Buffer.from(finalValue).toString("hex")}'`;
  return `'${String(finalValue).replaceAll("'", "''")}'`;
}

const preferredOrder = [
  "residences",
  "contribution_positions",
  "usu_courses",
  "civic_profiles",
  "civic_media_assets",
  "civic_accounts",
  "ccu_accounts",
  "learning_records",
  "civic_private_identities",
  "civic_private_name_variants",
  "civic_private_identity_audit",
  "protected_documents",
  "protected_document_access_log",
  "contribution_assignments",
  "contribution_time_entries",
  "ccu_transactions",
  "civic_value_flows",
  "civic_requests",
  "civic_public_recognitions",
  "learning_goals",
  "learning_evaluations",
  "learning_evaluation_documents",
  "learning_q_scores",
  "learning_evidence_contracts",
  "learning_observations",
  "learning_profile_versions",
  "learning_challenges",
  "learning_recommendations",
  "healing_timeline",
  "healing_prescriptions",
  "healing_appointment_requests",
  "harms",
  "harmony_proceedings",
  "harmony_findings",
  "restoration_requirements",
  "residence_assignments",
  "usu_enrollments",
];
const orderedTables = [...selected.keys()].sort((a, b) => {
  const ai = preferredOrder.indexOf(a);
  const bi = preferredOrder.indexOf(b);
  return (ai < 0 ? 10_000 : ai) - (bi < 0 ? 10_000 : bi) || a.localeCompare(b);
});

const sql = [
  "-- Founder private civic data migration generated from the isolated local-v3 database.",
  "-- Local sessions, test fixtures, local ledger history, and analytics are intentionally excluded.",
];
const batchDir = join(outputDir, "founder-production-migration-batches");
mkdirSync(batchDir, { recursive: true });
const counts = {};
for (const [tableIndex, table] of orderedTables.entries()) {
  const rows = [...selected.get(table).values()];
  if (table === "learning_evidence_contracts") {
    rows.sort((left, right) =>
      String(left.document_id || "").localeCompare(String(right.document_id || ""))
      || Number(left.contract_version || 0) - Number(right.contract_version || 0)
      || String(left.created_at || "").localeCompare(String(right.created_at || ""))
    );
  }
  counts[table] = rows.length;
  const tableSql = [
    `-- Founder production migration batch ${String(tableIndex + 1).padStart(2, "0")}: ${table}`,
  ];
  for (const row of rows) {
    const columns = Object.keys(row);
    const insertMode = table === "contribution_positions" || table === "usu_courses"
      ? "INSERT OR IGNORE"
      : "INSERT OR REPLACE";
    const statement = `${insertMode} INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map((column) => sqlLiteral(row[column])).join(", ")});`;
    sql.push(statement);
    tableSql.push(statement);
  }
  writeFileSync(
    join(batchDir, `${String(tableIndex + 1).padStart(2, "0")}-${table}.sql`),
    `${tableSql.join("\n")}\n`,
    "utf8"
  );
}
sql.push("");

const sqlPath = join(outputDir, "founder-production-migration.sql");
writeFileSync(sqlPath, sql.join("\n"), "utf8");

const objectKeys = [...(selected.get("civic_media_assets")?.values() || [])]
  .map((row) => String(row.object_key || ""))
  .filter(Boolean);
const r2Root = resolve(dirname(sourceDb), "..", "..", "r2");
const r2Manifest = [];
if (existsSync(r2Root)) {
  const sqliteFiles = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith(".sqlite")) sqliteFiles.push(fullPath);
    }
  };
  walk(r2Root);
  for (const metadataPath of sqliteFiles) {
    let metadataDb;
    try {
      metadataDb = new DatabaseSync(metadataPath, { readOnly: true });
      const hasObjects = metadataDb.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = '_mf_objects'").get();
      if (!hasObjects) continue;
      const columns = metadataDb.prepare("PRAGMA table_info(_mf_objects)").all().map((column) => String(column.name));
      const keyColumn = columns.includes("key") ? "key" : columns.find((column) => column.includes("key"));
      const blobColumn = columns.includes("blob_id") ? "blob_id" : columns.find((column) => column.includes("blob"));
      if (!keyColumn || !blobColumn) continue;
      for (const objectKey of objectKeys) {
        const row = metadataDb.prepare(
          `SELECT ${quoteIdentifier(keyColumn)} AS object_key, ${quoteIdentifier(blobColumn)} AS blob_id FROM _mf_objects WHERE ${quoteIdentifier(keyColumn)} = ?1`
        ).get(objectKey);
        if (!row) continue;
        const bucketDirectory = dirname(metadataPath);
        const candidateRoots = [join(bucketDirectory, "blobs"), ...readdirSync(r2Root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => join(r2Root, entry.name, "blobs"))];
        const blobPath = candidateRoots.map((root) => join(root, String(row.blob_id))).find(existsSync);
        if (blobPath) r2Manifest.push({ sourceObjectKey: objectKey, objectKey: mapped(objectKey), blobPath, bytes: statSync(blobPath).size });
      }
    } catch {
      // Ignore Miniflare metadata databases that do not belong to the R2 bucket.
    } finally {
      metadataDb?.close();
    }
  }
}

const unresolvedObjectKeys = objectKeys.filter((objectKey) => !r2Manifest.some((entry) => entry.sourceObjectKey === objectKey));
const manifestPath = join(outputDir, "founder-production-r2-manifest.json");
writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), objectCount: r2Manifest.length, unresolvedObjectKeys, objects: r2Manifest }, null, 2), "utf8");
writeFileSync(join(outputDir, "founder-production-migration-summary.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceDatabase: basename(sourceDb),
  sourceCivicId,
  targetCivicId,
  tables: counts,
  rows: Object.values(counts).reduce((sum, count) => sum + count, 0),
  expectedR2Objects: objectKeys.length,
  resolvedR2Objects: r2Manifest.length,
  unresolvedObjectKeys,
  sqlPath,
  manifestPath,
}, null, 2), "utf8");

db.close();
console.log(JSON.stringify({ tables: counts, rows: Object.values(counts).reduce((sum, count) => sum + count, 0), expectedR2Objects: objectKeys.length, resolvedR2Objects: r2Manifest.length, unresolvedObjectKeys, sqlPath, manifestPath }, null, 2));
