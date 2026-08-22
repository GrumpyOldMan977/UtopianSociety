import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [baseSqlArg, migrationSqlArg, qaDbArg] = process.argv.slice(2);
if (!baseSqlArg || !migrationSqlArg || !qaDbArg) {
  console.error("Usage: node scripts/validate-founder-production-migration.mjs <base-export.sql> <migration.sql> <new-qa.sqlite>");
  process.exit(1);
}

const qaDb = resolve(qaDbArg);
const db = new DatabaseSync(qaDb);
db.exec(readFileSync(resolve(baseSqlArg), "utf8"));
db.exec("PRAGMA foreign_keys = ON;");

const statements = readFileSync(resolve(migrationSqlArg), "utf8")
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter((statement) => statement && !statement.startsWith("--"));

for (let index = 0; index < statements.length; index += 1) {
  try {
    db.exec(`${statements[index]};`);
  } catch (error) {
    console.error(JSON.stringify({ index: index + 1, statement: statements[index].slice(0, 500), error: error.message }, null, 2));
    db.close();
    process.exit(1);
  }
}

const receipt = {
  statements: statements.length,
  founderAccount: db.prepare("SELECT login_name, civic_id FROM civic_accounts WHERE login_name = 'TheFounder'").get(),
  mediaAssets: db.prepare("SELECT COUNT(*) AS count FROM civic_media_assets WHERE civic_id = 'USC-5ddca661-dc79-4cbd-a00f-afbeb698f958'").get().count,
  foreignKeyViolations: db.prepare("PRAGMA foreign_key_check").all(),
};
console.log(JSON.stringify(receipt, null, 2));
db.close();
