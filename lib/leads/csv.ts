// A small, dependency-free CSV parser — handles quoted fields with
// embedded commas/newlines, which is enough for creator-exported contact lists.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

const NAME_KEYS = ["name", "contact", "contact name", "full name"];
const COMPANY_KEYS = ["company", "brand", "brand name", "organization", "org"];
const EMAIL_KEYS = ["email", "email address", "e-mail"];
const PLATFORM_KEYS = ["platform", "social", "channel", "network"];
const WEBSITE_KEYS = ["website", "site", "url", "web", "homepage"];

function findCol(headers: string[], keys: string[]): number {
  return headers.findIndex((h) => keys.includes(h.trim().toLowerCase()));
}

export interface ParsedLeadRow {
  name: string;
  company: string | null;
  email: string | null;
  platform: string | null;
  website: string | null;
}

export function parseLeadsCsv(csvText: string): ParsedLeadRow[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = findCol(headers, NAME_KEYS);
  const companyIdx = findCol(headers, COMPANY_KEYS);
  const emailIdx = findCol(headers, EMAIL_KEYS);
  const platformIdx = findCol(headers, PLATFORM_KEYS);
  const websiteIdx = findCol(headers, WEBSITE_KEYS);

  const out: ParsedLeadRow[] = [];
  for (const r of rows.slice(1)) {
    const rawName = nameIdx >= 0 ? r[nameIdx] : undefined;
    const rawCompany = companyIdx >= 0 ? r[companyIdx] : undefined;
    const name = (rawName || rawCompany || "").trim();
    if (!name) continue;
    out.push({
      name,
      company: rawCompany?.trim() || null,
      email: emailIdx >= 0 ? r[emailIdx]?.trim() || null : null,
      platform: platformIdx >= 0 ? r[platformIdx]?.trim() || null : null,
      website: websiteIdx >= 0 ? r[websiteIdx]?.trim() || null : null,
    });
  }
  return out;
}
