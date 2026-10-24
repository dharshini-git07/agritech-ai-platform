/**
 * Removes undefined values from Firestore payloads while preserving valid
 * values, array order, and Firestore sentinel instances such as serverTimestamp().
 */
export function omitUndefinedFields<T>(value: T): T {
  if (Array.isArray(value)) {
    const cleaned: unknown[] = [];
    for (const item of value) {
      if (item !== undefined) cleaned.push(omitUndefinedFields(item));
    }
    return cleaned as T;
  }

  if (value === null || typeof value !== "object") return value;

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  const cleaned: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (nestedValue !== undefined) cleaned[key] = omitUndefinedFields(nestedValue);
  }
  return cleaned as T;
}
  