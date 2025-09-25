export type ParseError = { message: string };

export type ParseResult<T> = {
  data: T[];
  errors: ParseError[];
};

export type ParseConfig<T> = {
  header?: boolean;
  delimiter?: string;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
  complete?: (result: ParseResult<T>) => void;
  error?: (err: Error) => void;
};

function splitCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);

  if (inQuotes) {
    throw new Error('Unclosed quote in CSV line');
  }

  return values;
}

function normalizeHeaders(rawHeaders: string[], transform?: (header: string) => string): string[] {
  return rawHeaders.map((header) => {
    const trimmed = header.trim();
    return transform ? transform(trimmed) : trimmed;
  });
}

function parseText<T extends Record<string, unknown>>(input: string, config: ParseConfig<T>): ParseResult<T> {
  const delimiter = config.delimiter ?? ",";
  const lines = input.split(/\r?\n/);
  const data: T[] = [];
  const errors: ParseError[] = [];

  let headers: string[] | null = null;

  for (const rawLine of lines) {
    if (!rawLine) {
      if (config.skipEmptyLines) continue;
      if (!config.header && headers === null) {
        headers = [];
      }
    }

    const line = rawLine.replace(/\r$/, "");
    if (config.skipEmptyLines && line.trim() === "") {
      continue;
    }

    const cells = splitCsvLine(line, delimiter);

    if (!headers) {
      if (config.header) {
        headers = normalizeHeaders(cells, config.transformHeader);
        continue;
      }
      headers = normalizeHeaders(cells, config.transformHeader);
      data.push((cells as unknown) as T);
      continue;
    }

    const row: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i] ?? `field_${i}`;
      const value = cells[i] ?? "";
      row[key] = value;
    }

    data.push(row as T);
  }

  return { data, errors };
}

const Papa = {
  parse<T extends Record<string, unknown>>(input: string, config: ParseConfig<T>) {
    try {
      const result = parseText<T>(input, config);
      config.complete?.(result);
    } catch (err) {
      if (config.error) {
        config.error(err as Error);
      } else {
        throw err;
      }
    }
  },
};

export default Papa;
