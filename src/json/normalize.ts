type JsonRecord = Record<string, unknown>;

export const JSONReplacer = function (
  this: JsonRecord,
  key: string,
  value: unknown,
) {
  if (key === "hash") return undefined;

  if (this[key] instanceof Date) {
    return this[key].toISOString().replace("Z", "+00:00");
  }

  if (typeof this[key] === "bigint") {
    return this[key].toString();
  }

  if (this[key] === "null") return null;
  if (this[key] === "false") return false;
  if (this[key] === "true") return true;

  const current = this[key];
  if (
    current &&
    typeof current === "object" &&
    "toJSON" in current &&
    typeof (current as { toJSON?: () => unknown }).toJSON === "function"
  ) {
    this[key] = (current as { toJSON: () => unknown }).toJSON();
  }

  return value;
};

export const normalizeJSON = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj, JSONReplacer), JSONReplacer);
};
