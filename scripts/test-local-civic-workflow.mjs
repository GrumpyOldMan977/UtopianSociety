import assert from "node:assert/strict";

const endpoint = process.env.CIVIC_LEDGER_LOCAL_URL || "http://127.0.0.1:8788";
const origin = process.env.CIVIC_PORTAL_LOCAL_ORIGIN || "http://localhost:9877";
const civicId = "USC-LOCAL-WORKFLOW-TEST";
const commonHeaders = { Origin: origin };
const runKey = `workflow-${Date.now()}-${crypto.randomUUID()}`;
let sessionToken = "";

async function jsonRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      ...commonHeaders,
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  assert.ok(response.ok, `${method} ${path} failed: ${result.error || response.status}`);
  return result;
}

async function formRequest(path, form) {
  const response = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    body: form,
  });
  const result = await response.json();
  assert.ok(response.ok, `POST ${path} failed: ${result.error || response.status}`);
  return result;
}

async function binaryRequest(path) {
  const response = await fetch(`${endpoint}${path}`, {
    headers: {
      ...commonHeaders,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
  });
  assert.ok(response.ok, `GET ${path} failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

const login = await jsonRequest("/v3/auth/login", {
  method: "POST",
  body: {
    loginName: "LocalWorkflowTest",
    password: "Local workflow test password 2026!",
    certificateNumber: "USV-2026-000000000001",
  },
});
sessionToken = login.sessionToken;
assert.equal(login.civicId, civicId);

const before = await jsonRequest("/v3/portal/demo");
const startingBalance = before.ccu.balance;

const accepted = await jsonRequest("/v3/contribution/assignments/accept", {
  method: "POST",
  body: {
    positionId: "USP-LEARNING-MENTOR",
    idempotencyKey: `${runKey}-accept`,
  },
});
assert.equal(accepted.assignment.civicId, civicId);

const assignmentId = accepted.assignment.assignmentId;
const time = await jsonRequest(`/v3/contribution/assignments/${assignmentId}/time`, {
  method: "POST",
  body: {
    minutes: 180,
    workDate: "2026-07-23",
    description: "Three-hour local workflow validation of the Contribution pathway.",
  },
});
assert.equal(time.recordedHours, 3);

const submitted = await jsonRequest(`/v3/contribution/assignments/${assignmentId}/submit`, {
  method: "POST",
  body: {
    evidenceSummary: "Local integration evidence for the Contribution, Affirmation, CCU, and ledger transaction boundary.",
  },
});
assert.equal(submitted.status, "submitted");

const affirmed = await jsonRequest(`/v3/contribution/assignments/${assignmentId}/affirm`, {
  method: "POST",
  body: {
    affirmedBy: "Circle of Affirmation · Automated Local Test",
    idempotencyKey: `${runKey}-affirm`,
  },
});
assert.equal(affirmed.amount, 3.45);
assert.ok(Math.abs(affirmed.balanceAfter - (startingBalance + 3.45)) < 0.000001);

const avatarBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const avatarForm = new FormData();
avatarForm.set("file", new File([avatarBytes], "workflow-avatar.png", { type: "image/png" }));
const avatar = await formRequest("/v3/profile/avatar", avatarForm);
assert.equal(avatar.mediaType, "image/png");
assert.deepEqual(await binaryRequest("/v3/profile/avatar"), new Uint8Array(avatarBytes));

const documentText = [
  "Private local Learning evidence used only to validate encrypted document storage and the same-origin streaming proxy.\n",
  "Synthetic validation material. ".repeat(145000),
].join("");
const documentForm = new FormData();
documentForm.set("domain", "learning");
documentForm.set("consent", "Retain locally for citizen-directed Learning assessment.");
documentForm.set("file", new File([documentText], "learning-evidence.txt", { type: "text/plain" }));
const document = await formRequest("/v3/documents", documentForm);
assert.equal(document.encrypted, true);
assert.ok(document.byteSize > 3.6 * 1024 * 1024, "Protected upload should exercise a file larger than the former limit.");
assert.equal(new TextDecoder().decode(await binaryRequest(`/v3/documents/${document.documentId}/content`)), documentText);

const goal = await jsonRequest("/v3/learning/goals", {
  method: "POST",
  body: { goalText: "Strengthen civic systems understanding through lifelong study." },
});
assert.equal(goal.status, "active");

const enrollment = await jsonRequest("/v3/usu/enrollments", {
  method: "POST",
  body: { courseId: "USU-CIV-101" },
});
assert.equal(enrollment.status, "enrolled");

const appointment = await jsonRequest("/v3/healing/appointments", {
  method: "POST",
  body: {
    careDomain: "whole-person care",
    privateReason: "Local workflow test; not a real request for diagnosis or treatment.",
    preferredWindow: "Next available local demonstration window",
  },
});
assert.equal(appointment.status, "requested");

const harm = await jsonRequest("/v3/harmony/harms", {
  method: "POST",
  body: {
    publicSummary: "A local procedural test entered Harmony triage.",
    privateDetails: "Synthetic workflow-only details. No person is accused and no finding is requested.",
  },
});
assert.equal(harm.status, "reported");

const snapshot = await jsonRequest("/v3/portal/demo");
assert.equal(snapshot.profile.civicId, civicId);
assert.equal(snapshot.profile.hasAvatar, true);
assert.ok(Math.abs(snapshot.ccu.balance - (startingBalance + 3.45)) < 0.000001);
assert.ok(snapshot.ccu.flows.some((flow) => flow.type === "earned" && flow.amount === 3.45));
assert.ok(snapshot.contribution.assignments.some((assignment) => (
  assignment.assignmentId === assignmentId
  && assignment.status === "affirmed"
  && assignment.recordedHours === 3
)));
assert.ok(snapshot.learning.goals.some((item) => item.goal_id === goal.goalId));
assert.ok(snapshot.learning.documents.some((item) => item.document_id === document.documentId));
assert.ok(snapshot.usu.enrollments.some((item) => item.course_id === "USU-CIV-101"));
assert.ok(snapshot.healing.appointments.some((item) => item.appointment_id === appointment.appointmentId));
assert.ok(snapshot.harmony.harms.some((item) => item.harm_id === harm.harmId));
assert.ok(snapshot.ledger.some((entry) => entry.eventType === "contribution_affirmed"));
assert.ok(snapshot.ledger.some((entry) => entry.eventType === "harm_reported"));
assert.equal(snapshot.balance.livePopulation, 1);
assert.equal(snapshot.balance.scenario.sustainable_population_capacity, 120);
assert.equal(snapshot.balance.resources.length, 10);
assert.equal(snapshot.ftb.simulated, true);
assert.equal(snapshot.ftb.metrics.length, 8);
assert.equal(snapshot.ftb.adjustments.length, 3);

await jsonRequest(`/v3/documents/${document.documentId}`, { method: "DELETE" });
await jsonRequest("/v3/profile/avatar", { method: "DELETE" });

console.log(JSON.stringify({
  passed: true,
  civicId,
  assignmentId,
  creditedCcu: affirmed.amount,
  balanceAfter: snapshot.ccu.balance,
  protectedDocumentRoundTrip: true,
  avatarRoundTrip: true,
  learningGoal: true,
  usuEnrollment: enrollment.status,
  healingAppointment: appointment.status,
  harmonyReport: harm.status,
}, null, 2));
