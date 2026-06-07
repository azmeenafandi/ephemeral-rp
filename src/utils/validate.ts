type SchemaField = 'string' | 'number' | 'boolean' | 'object' | 'array';

/**
 * Schema value: either a type string for simple typeof checks,
 * or `{ type, oneOf? }` for types that also enforce enum membership.
 */
type SchemaEntry =
  | SchemaField
  | { type: SchemaField; oneOf: readonly (string | number | boolean)[] };

type Schema = Record<string, SchemaEntry>;

export function validateShape(
  obj: unknown,
  schema: Schema,
  context: string,
): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`${context}: not an object`);
  }
  const record = obj as Record<string, unknown>;
  for (const [key, entry] of Object.entries(schema)) {
    const type = typeof entry === 'string' ? entry : entry.type;
    const oneOf = typeof entry === 'string' ? undefined : entry.oneOf;

    if (type === 'array') {
      if (!Array.isArray(record[key])) {
        throw new Error(`${context}: ${key} must be an array`);
      }
    } else if (typeof record[key] !== type) {
      throw new Error(`${context}: ${key} must be ${type}`);
    }

    if (oneOf && !oneOf.includes(record[key] as string | number | boolean)) {
      throw new Error(
        `${context}: ${key} must be one of ${oneOf.map((v) => JSON.stringify(v)).join(', ')}`,
      );
    }
  }
  return record;
}
