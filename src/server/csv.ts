import "server-only";

import { HttpError } from "@/server/http";

export function parseCsv(input: string, maxRows = 5_000) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      if (rows.length > maxRows + 1) throw new HttpError(413, `CSV ${maxRows} qatordan oshmasligi kerak`);
    } else {
      field += char;
    }
  }
  if (quoted) throw new HttpError(422, "CSV ichida yopilmagan qo‘shtirnoq bor", "VALIDATION_ERROR");
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export function csvCell(value: unknown) {
  let normalized = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((values) => values.map(csvCell).join(",")).join("\n")}`;
}
