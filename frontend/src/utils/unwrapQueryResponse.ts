/**
 * Safely unwrap common API envelopes `{ data: T }` and `{ data: { data: T } }`
 * without throwing when an intermediate `data` is `null` (nested destructuring defaults do not apply to `null`).
 */
export function unwrapQueryDataBody<T = unknown>(body: unknown): T | undefined {
  if (body == null) return undefined;
  if (typeof body !== "object") return body as T;

  const record = body as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, "data")) {
    return body as T;
  }

  const first = record.data;
  if (first == null) return undefined;
  if (typeof first !== "object") return first as T;

  const inner = first as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(inner, "data")) {
    return inner.data as T;
  }

  return first as T;
}
