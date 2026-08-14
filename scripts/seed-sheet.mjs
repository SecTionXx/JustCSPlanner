// Seed the Google Sheet with the required structure (idempotent).
// Creates the 5 tabs + header rows, seeds reference data (Team, Templates).
// Leaves JobCards / Todos / ActivityLog empty — those are filled by the app.
//
// Run: node scripts/seed-sheet.mjs
import { google } from "googleapis";
import { readFileSync } from "node:fs";

// --- load .env.local (tiny manual parser, no dependency) ---
const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const KEYFILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const TABS = {
  JobCards: [
    "jobId", "customer", "bookingNumber", "shipmentType", "serviceType",
    "route", "origin", "destination", "carrier", "owner", "backup", "status",
    "priority", "deadline", "cutoff", "etd", "eta", "latestSummary",
    "docLinks", "createdBy", "createdAt", "updatedAt",
  ],
  Todos: [
    "todoId", "jobId", "title", "assignee", "status", "deadline", "source",
    "completedAt", "createdBy", "createdAt",
  ],
  ActivityLog: [
    "logId", "jobId", "actor", "timestamp", "event", "field", "oldValue",
    "newValue", "reason", "refLink",
  ],
  Team: ["csId", "displayName", "role", "active", "email"],
  Templates: ["templateType", "order", "todoTitle", "deadlineOffsetHours", "notes"],
  Notifications: [
    "notifId", "jobId", "recipientCsId", "event", "channel", "subject", "body",
    "status", "createdAt", "readAt",
  ],
  EmailInbox: [
    "emailId", "fromAddress", "subject", "body", "receivedAt", "source",
    "matchedJobId", "status", "handledBy", "handledAt",
  ],
};

const TEAM_ROWS = [
  ["jantana", "จันทนา", "lead", "TRUE", "jantana@example.com"],
  ["aom", "อ้อม", "cs_owner", "TRUE", "aom@example.com"],
  ["may", "เมย์", "cs_owner", "TRUE", "may@example.com"],
  ["nina", "นีน่า", "cs_assistant", "TRUE", "nina@example.com"],
  ["somchai", "สมชาย", "requester", "TRUE", "somchai@example.com"],
  ["pan", "แพน", "admin", "TRUE", "pan@example.com"],
];

const TEMPLATE_ROWS = [
  ["Export Sea", 1, "ตรวจ Booking Confirmation", 96, ""],
  ["Export Sea", 2, "ยืนยันเรือ", 72, ""],
  ["Export Sea", 3, "รับเอกสาร", 60, ""],
  ["Export Sea", 4, "ส่ง SI", 48, ""],
  ["Export Sea", 5, "ตรวจ draft B/L", 24, ""],
  ["Export Sea", 6, "ติดตาม cut-off", 4, ""],
  ["Import Sea", 1, "รับ Arrival Notice", 96, ""],
  ["Import Sea", 2, "ตรวจเอกสาร", 72, ""],
  ["Import Sea", 3, "ประสานเคลียร์สินค้า", 24, ""],
  ["Import Sea", 4, "แจ้งลูกค้า", 4, ""],
  ["Air Freight", 1, "ยืนยัน flight", 48, ""],
  ["Air Freight", 2, "ตรวจ AWB", 24, ""],
  ["Air Freight", 3, "ติดตาม cargo cut-off", 8, ""],
  ["Air Freight", 4, "แจ้ง ETA", 2, ""],
];

const auth = new google.auth.GoogleAuth({
  keyFilename: KEYFILE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// create missing tabs
const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
const existing = new Set(meta.data.sheets.map((s) => s.properties.title));
const requests = Object.keys(TABS)
  .filter((t) => !existing.has(t))
  .map((title) => ({ addSheet: { properties: { title } } }));
if (requests.length) {
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } });
  console.log("Created tabs:", requests.map((r) => r.addSheet.properties.title).join(", "));
} else {
  console.log("All tabs already exist.");
}

// write headers if empty, seed reference data if empty
for (const [tab, headers] of Object.entries(TABS)) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!1:1`,
  });
  const hasHeader = r.data.values && r.data.values[0] && r.data.values[0].length;
  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log(`Headers written: ${tab} (${headers.length} cols)`);
  } else {
    console.log(`Headers already present: ${tab}`);
  }
}

async function rowCount(tab) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A2:Z`,
  });
  return (r.data.values || []).filter((row) => row.some((c) => String(c).trim() !== "")).length;
}

// seed Team
if ((await rowCount("Team")) === 0) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Team!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: TEAM_ROWS },
  });
  console.log(`Seeded Team: ${TEAM_ROWS.length} members`);
} else {
  console.log("Team already has data — skipped.");
}

// seed Templates
if ((await rowCount("Templates")) === 0) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Templates!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: TEMPLATE_ROWS },
  });
  console.log(`Seeded Templates: ${TEMPLATE_ROWS.length} rows`);
} else {
  console.log("Templates already has data — skipped.");
}

console.log("\n✅ Done. JobCards/Todos/ActivityLog/EmailInbox are empty — fill them via the app.");
