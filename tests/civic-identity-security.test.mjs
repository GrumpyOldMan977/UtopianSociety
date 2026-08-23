import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

function section(text, start, end) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing section start: ${start}`);
  assert.notEqual(endIndex, -1, `missing section end: ${end}`);
  return text.slice(startIndex, endIndex);
}

test("certificate identifiers cannot authorize activation or credential recovery", async () => {
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const login = section(worker, "async function loginCivicAccount", "async function requireCivicSession");
  const loginUi = await source("app/components/CivicLogin.tsx");

  assert.match(login, /cleanActivationToken\(input\.activationToken/);
  assert.match(login, /activation_token_hash/);
  assert.match(login, /credential_upgrade_support_required/);
  assert.match(login, /A public certificate cannot authorize account recovery/);
  assert.doesNotMatch(login, /cleanCertificateNumber|input\.certificateNumber|activation_certificate_number/);
  assert.doesNotMatch(loginUi, /Immigration certificate number|credential upgrade/i);
  assert.match(loginUi, /A certificate number never activates, restores, or recovers an account/);
  assert.match(loginUi, /One-time activation code/);
});

test("new activation codes are random, digest-only, and consumed once", async () => {
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const provisioning = section(worker, "async function provisionPendingCivicAccount", "async function recordFailedLogin");
  const login = section(worker, "async function loginCivicAccount", "async function requireCivicSession");
  const migration = await source("cloudflare/civic-ledger/migrations/0018_v3_private_activation_tokens.sql");

  assert.match(provisioning, /const activationToken = randomToken\(\)/);
  assert.match(provisioning, /const activationTokenHash = await digest\(activationToken\)/);
  assert.match(provisioning, /activation_token_hash/);
  assert.match(login, /SET password_salt[\s\S]*activation_token_hash = NULL/);
  assert.match(login, /WHERE account_id = \?1 AND status = 'pending_activation'[\s\S]*activation_token_hash = \?6/);
  assert.match(login, /activationResult\.meta\?\.changes/);
  assert.match(migration, /ADD COLUMN activation_token_hash TEXT/);
  assert.doesNotMatch(migration, /activation_token\s+TEXT/);
});

test("public population, citizen register, and ledger serialization redact certificates", async () => {
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const client = await source("app/lib/civic-ledger.ts");
  const population = section(worker, "async function population", "async function listCitizens");
  const citizens = section(worker, "async function listCitizens", "async function createCitizen");
  const serializer = section(worker, "const PUBLIC_LEDGER_PRIVATE_KEYS", "async function registerRelease");

  assert.doesNotMatch(population, /certificate/i);
  assert.doesNotMatch(citizens, /certificate/i);
  assert.match(serializer, /"certificateNumber"/);
  assert.match(serializer, /"certificate_number"/);
  assert.match(serializer, /publicSubjectRef\(row\.subject_ref\)/);
  assert.doesNotMatch(section(client, "export type PopulationSummary", "export type PublicCivicRecognition"), /certificate/i);
});

test("the public citizen directory lists only explicit public visibility", async () => {
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const directory = section(worker, "async function publicCivicDirectory", "function publicRecognition");
  const route = section(worker, "async function route", "export default");
  const page = await source("app/citizens/page.tsx");
  const component = await source("app/components/PublicCitizenDirectory.tsx");

  assert.match(directory, /WHERE profile_visibility = 'public'/);
  assert.doesNotMatch(directory, /civic_id|certificate|activation|login/i);
  assert.match(route, /path === "\/v3\/public\/citizens"/);
  assert.match(page, /Civic lives, shared by choice/);
  assert.match(component, /getPublicCitizenDirectory/);
  assert.match(component, /Certificate identifiers and private Civic Profile records are never part of this directory/);
  assert.match(component, /citizen\.civicTitle/);
  assert.match(component, /publicProfileAvatarUrl/);
  assert.doesNotMatch(component, /citizen\.publicBio|citizen\.primaryContribution|citizen\.civicStanding/);
});

test("profile photographs are framed in authenticated profile settings before upload", async () => {
  const portal = await source("app/components/CitizenPortal.tsx");
  const hero = section(portal, '<section className="citizen-identity"', "{identitySettingsOpen &&");
  const cropper = section(portal, "function ProfilePhotoSettings", "function PublicProfileSettings");
  const publicSettings = section(portal, "function PublicProfileSettings", "function PrivateIdentitySettings");
  const styles = await source("app/citizen-portal.css");

  assert.doesNotMatch(hero, /type="file"|Replace photo|deleteProfileAvatar|uploadProfileAvatar/);
  assert.match(cropper, /const canvas = document\.createElement\("canvas"\)/);
  assert.match(cropper, /canvas\.width = CROPPED_AVATAR_SIZE/);
  assert.match(cropper, /uploadProfileAvatar\(new File/);
  assert.match(cropper, /Reframe current photo/);
  assert.match(cropper, /Only the finished 512 × 512 crop is uploaded/);
  assert.match(publicSettings, /<ProfilePhotoSettings/);
  assert.match(styles, /\.profile-photo-crop-mask/);
  assert.match(styles, /touch-action:none/);
});
