// Test stub for src/lib/sheets/google-sheets-repository. The real module
// throws at import time when GOOGLE_SHEETS_SPREADSHEET_ID is unset, which
// breaks any test whose import graph reaches the repository seam. Unit tests
// never touch real Sheets — any actual use of this stub is a test bug.
export class SheetsJobRepository {
  constructor() {
    throw new Error(
      "SheetsJobRepository is stubbed in tests — use the mock repository.",
    );
  }
}
