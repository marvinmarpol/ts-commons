/**
 * PII (Personally Identifiable Information) masking utilities.
 * Generic helpers to mask sensitive data in strings and objects for logs or outputs.
 */

const DEFAULT_VISIBLE_START = 3;
const DEFAULT_VISIBLE_END = 3;
const DEFAULT_MASK_CHAR = '*';
const DEFAULT_REDACT_PLACEHOLDER = '[REDACTED]';
const SHORT_STRING_MAX_LENGTH = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How a PII field value should be transformed.
 *
 * - `mask`   — show partial characters, hide the middle with a mask character
 * - `redact` — replace the entire value with a placeholder string
 * - `hash`   — replace with a SHA-256 hex digest (non-reversible, Node.js only)
 */
export type PIIStrategy = 'mask' | 'redact' | 'hash';

/**
 * Sensitivity level from the company PII Data Classification policy.
 *
 * - `P0` — No one can see the data except the personal owner (NIK, passport, OTP, …)
 * - `P1` — Data owner can see the data (email, phone, name, bank account, …)
 * - `P2` — Data owner and data client can see (occupation, education, marital status)
 */
export type PIILevel = 'P0' | 'P1' | 'P2';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for masking a single string value via {@link maskPII}.
 */
export interface MaskPIIOptions {
  /** Number of characters to leave visible at the start. Default: `3` */
  visibleStart?: number;
  /** Number of characters to leave visible at the end. Default: `3` */
  visibleEnd?: number;
  /** Character used for masking. Default: `'*'` */
  maskChar?: string;
}

/**
 * Per-field definition stored in the PII field registry.
 * Used by {@link maskPIIInObject} to determine how each field is transformed.
 */
export interface PIIFieldDefinition {
  /** Sensitivity level of this field. */
  level: PIILevel;
  /** Transformation strategy applied to this field. */
  strategy: PIIStrategy;
  /** Characters to show at the start when strategy is `'mask'`. */
  visibleStart?: number;
  /** Characters to show at the end when strategy is `'mask'`. */
  visibleEnd?: number;
  /** Mask character override for this specific field. */
  maskChar?: string;
  /** Placeholder string override for this specific field when strategy is `'redact'`. */
  placeholder?: string;
}

/**
 * Options accepted by {@link maskPIIInObject}.
 */
export interface MaskPIIInObjectOptions {
  /**
   * **[Legacy]** Fully replaces the built-in field set with an explicit list.
   * When provided, `customPIIFields`, `fieldDefinitions`, `minLevel`, and `placeholder`
   * are all ignored, and every matched field is masked with {@link maskPII}.
   *
   * Prefer `fieldDefinitions` for new code.
   *
   * @deprecated Use `fieldDefinitions` to override or extend the built-in registry.
   */
  piiFields?: Set<string> | string[];

  /**
   * **[Legacy]** Extra field names added on top of {@link DEFAULT_PII_FIELDS}.
   * Ignored when `piiFields` is provided.
   *
   * Prefer `fieldDefinitions` for new code.
   *
   * @deprecated Use `fieldDefinitions` to add new fields with level and strategy metadata.
   */
  customPIIFields?: Set<string> | string[];

  /**
   * Override or extend individual field definitions on top of {@link DEFAULT_PII_FIELD_DEFINITIONS}.
   * Only the keys you supply are affected; all other fields keep their defaults.
   *
   * @example
   * // Change email strategy, add a brand-new field, override a placeholder
   * fieldDefinitions: {
   *   email:          { level: 'P1', strategy: 'hash' },
   *   driver_license: { level: 'P0', strategy: 'redact', placeholder: '[LICENSE HIDDEN]' },
   *   salary:         { level: 'P1', strategy: 'redact' },
   * }
   */
  fieldDefinitions?: Record<string, Partial<PIIFieldDefinition>>;

  /**
   * Skip fields whose sensitivity level is below this threshold.
   * Useful when a consumer is allowed to see lower-sensitivity data.
   *
   * | `minLevel` | P0 processed | P1 processed | P2 processed |
   * |------------|:---:|:---:|:---:|
   * | `'P0'`     | ✅  | ❌  | ❌  |
   * | `'P1'`     | ✅  | ✅  | ❌  |
   * | `'P2'`     | ✅  | ✅  | ✅  | ← default
   *
   * Default: `'P2'` (process all levels)
   */
  minLevel?: PIILevel;

  /**
   * Masking options forwarded to {@link maskPII} for every `'mask'` strategy field.
   * These take precedence over per-field `visibleStart` / `visibleEnd` / `maskChar`
   * defined in the field registry.
   */
  maskOptions?: MaskPIIOptions;

  /**
   * Global placeholder for all `'redact'` strategy fields.
   * A field-level `placeholder` in `fieldDefinitions` takes precedence over this.
   *
   * Default: `'[REDACTED]'`
   */
  placeholder?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default field registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The original flat set of PII field names used by the legacy `piiFields` path.
 *
 * @deprecated Use {@link DEFAULT_PII_FIELD_DEFINITIONS} which includes level and strategy metadata.
 */
export const DEFAULT_PII_FIELDS = new Set([
  'nik',
  'full_name',
  'alias',
  'email',
  'phone',
  'phone_number',
  'mobile_number',
  'account_number',
  'card_number',
  'id_number',
  'document_id',
  'date_of_birth',
  'place_of_birth',
  'nationality',
  'address',
  'postal_code',
  'latitude',
  'longitude',
]);

/**
 * Full PII field registry based on the company PII Data Classification policy.
 * Every field carries a sensitivity `level` and a default `strategy`.
 *
 * Override individual entries at call-site via `MaskPIIInObjectOptions.fieldDefinitions`.
 */
export const DEFAULT_PII_FIELD_DEFINITIONS: Record<string, PIIFieldDefinition> = {
  // ── P0 — redact entirely (only the data owner may see) ──────────────────────
  nik:                         { level: 'P0', strategy: 'redact' },
  national_id:                 { level: 'P0', strategy: 'redact' },
  passport_number:             { level: 'P0', strategy: 'redact' },
  kk_number:                   { level: 'P0', strategy: 'redact' },
  family_card_number:          { level: 'P0', strategy: 'redact' },
  medical_record:              { level: 'P0', strategy: 'redact' },
  parent_nik:                  { level: 'P0', strategy: 'redact' },
  marriage_certificate:        { level: 'P0', strategy: 'redact' },
  marriage_certificate_number: { level: 'P0', strategy: 'redact' },
  divorce_certificate:         { level: 'P0', strategy: 'redact' },
  divorce_certificate_number:  { level: 'P0', strategy: 'redact' },
  iris_scan:                   { level: 'P0', strategy: 'redact' },
  password:                    { level: 'P0', strategy: 'redact' },
  pin:                         { level: 'P0', strategy: 'redact' },
  birth_certificate:           { level: 'P0', strategy: 'redact' },
  birth_certificate_number:    { level: 'P0', strategy: 'redact' },
  npwp:                        { level: 'P0', strategy: 'redact' },
  otp:                         { level: 'P0', strategy: 'redact' },

  // ── P1 — partially masked (data owner may see) ───────────────────────────────
  phone:               { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  phone_number:        { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  mobile_number:       { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  religion:            { level: 'P1', strategy: 'redact' },
  mother_maiden_name:  { level: 'P1', strategy: 'mask', visibleStart: 1, visibleEnd: 0 },
  salary:              { level: 'P1', strategy: 'redact' },
  date_of_birth:       { level: 'P1', strategy: 'mask', visibleStart: 4, visibleEnd: 0 },
  place_of_birth:      { level: 'P1', strategy: 'mask', visibleStart: 2, visibleEnd: 0 },
  email:               { level: 'P1', strategy: 'mask' },
  fingerprint:         { level: 'P1', strategy: 'redact' },
  address:             { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 0 },
  residential_address: { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 0 },
  signature:           { level: 'P1', strategy: 'redact' },
  full_name:           { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 3 },
  alias:               { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 3 },
  name:                { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 3 },
  account_number:      { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 4 },
  card_number:         { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 4 },
  id_number:           { level: 'P1', strategy: 'mask', visibleStart: 2, visibleEnd: 2 },
  document_id:         { level: 'P1', strategy: 'mask', visibleStart: 2, visibleEnd: 2 },
  bank_account:        { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 4 },
  bank_account_number: { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 4 },
  card_expiry:         { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 2 },
  card_expiry_date:    { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 2 },
  nationality:         { level: 'P1', strategy: 'mask', visibleStart: 2, visibleEnd: 0 },
  postal_code:         { level: 'P1', strategy: 'mask', visibleStart: 2, visibleEnd: 0 },
  latitude:            { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 0 },
  longitude:           { level: 'P1', strategy: 'mask', visibleStart: 3, visibleEnd: 0 },

  // ── P2 — lightly masked (data owner and data client may see) ────────────────
  occupation:              { level: 'P2', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  job:                     { level: 'P2', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  education:               { level: 'P2', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  education_qualification: { level: 'P2', strategy: 'mask', visibleStart: 3, visibleEnd: 2 },
  marital_status:          { level: 'P2', strategy: 'mask', visibleStart: 1, visibleEnd: 1 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Public transformation functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mask a string by replacing the middle section with a repeated mask character.
 *
 * - Strings longer than `SHORT_STRING_MAX_LENGTH` (5): show `visibleStart` chars at the
 *   front and `visibleEnd` chars at the back; mask everything in between.
 * - Short strings (≤ 5 chars): show only the first character; mask the rest.
 * - Empty strings or non-strings: returned unchanged.
 *
 * @example
 * maskPII('JohnDoe123')                            // 'Joh****123'
 * maskPII('abcdefgh', { visibleStart: 2, visibleEnd: 2 }) // 'ab****gh'
 * maskPII('Hi')                                    // 'H*'
 */
export function maskPII(value: string, options: MaskPIIOptions = {}): string {
  if (value == null || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.length) return value;

  const visibleStart = options.visibleStart ?? DEFAULT_VISIBLE_START;
  const visibleEnd   = options.visibleEnd   ?? DEFAULT_VISIBLE_END;
  const maskChar     = options.maskChar     ?? DEFAULT_MASK_CHAR;

  if (trimmed.length <= SHORT_STRING_MAX_LENGTH) {
    return trimmed.length > 1
      ? `${trimmed[0]}${maskChar.repeat(trimmed.length - 1)}`
      : maskChar;
  }

  const totalVisible = visibleStart + visibleEnd;
  if (trimmed.length <= totalVisible) {
    return maskChar.repeat(trimmed.length);
  }

  const start       = trimmed.substring(0, visibleStart);
  const end         = trimmed.substring(trimmed.length - visibleEnd);
  const maskedLength = Math.max(1, trimmed.length - totalVisible);
  return `${start}${maskChar.repeat(maskedLength)}${end}`;
}

/**
 * Return a fixed placeholder string, representing a fully redacted value.
 *
 * @example
 * redactPII()           // '[REDACTED]'
 * redactPII('[HIDDEN]') // '[HIDDEN]'
 */
export function redactPII(placeholder = DEFAULT_REDACT_PLACEHOLDER): string {
  return placeholder;
}

/**
 * Return the SHA-256 hex digest of a string value (non-reversible).
 * Useful for audit logs where the exact value must never appear but a
 * consistent fingerprint is still needed.
 *
 * **Node.js only** — not browser-safe.
 *
 * @example
 * hashPII('budi@example.com') // 'a3f2...' (64-char hex string)
 */
export function hashPII(value: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(value).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeFieldKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '_');
}

const LEVEL_ORDER: PIILevel[] = ['P0', 'P1', 'P2'];

function meetsMinLevel(fieldLevel: PIILevel, minLevel: PIILevel): boolean {
  return LEVEL_ORDER.indexOf(fieldLevel) <= LEVEL_ORDER.indexOf(minLevel);
}

function buildLegacyFieldSet(options: MaskPIIInObjectOptions): Set<string> {
  if (options.piiFields) {
    return options.piiFields instanceof Set
      ? new Set(options.piiFields)
      : new Set(options.piiFields.map((k) => normalizeFieldKey(k)));
  }
  const base = new Set(DEFAULT_PII_FIELDS);
  if (options.customPIIFields) {
    for (const k of options.customPIIFields) {
      base.add(normalizeFieldKey(k));
    }
  }
  return base;
}

function resolveFieldDefinition(
  normalizedKey: string,
  options: MaskPIIInObjectOptions,
): PIIFieldDefinition | undefined {
  const base     = DEFAULT_PII_FIELD_DEFINITIONS[normalizedKey];
  const override = options.fieldDefinitions?.[normalizedKey];
  if (!base && !override) return undefined;
  return { ...base, ...override } as PIIFieldDefinition;
}

function applyStrategy(
  value: string,
  def: PIIFieldDefinition,
  options: MaskPIIInObjectOptions,
): string {
  const callerMask    = options.maskOptions ?? {};
  const globalHolder  = options.placeholder ?? DEFAULT_REDACT_PLACEHOLDER;

  switch (def.strategy) {
    case 'redact':
      return redactPII(def.placeholder ?? globalHolder);

    case 'hash':
      return hashPII(value);

    case 'mask':
    default:
      // maskOptions (caller intent) takes precedence over per-field registry defaults
      return maskPII(value, {
        visibleStart: callerMask.visibleStart ?? def.visibleStart,
        visibleEnd:   callerMask.visibleEnd   ?? def.visibleEnd,
        maskChar:     callerMask.maskChar     ?? def.maskChar,
      });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively mask PII fields in an object or array.
 * Returns a new object — the original is never mutated.
 *
 * **Default behaviour** (no options or only `fieldDefinitions` / `minLevel` / `placeholder`):
 * - Every field found in {@link DEFAULT_PII_FIELD_DEFINITIONS} is transformed
 *   according to its `strategy` and `level`.
 * - Non-PII fields and non-string values are copied as-is.
 * - Nested objects and arrays are traversed recursively.
 *
 * **Legacy behaviour** (when `piiFields` is supplied):
 * - Every matched field is masked with {@link maskPII} using the provided `maskOptions`.
 * - `fieldDefinitions`, `minLevel`, and `placeholder` are ignored.
 * - This path exists solely for backward compatibility; prefer the default behaviour
 *   for new code.
 *
 * @example
 * // Default — uses built-in registry
 * maskPIIInObject({ nik: '320101', email: 'a@b.com', username: 'budi' })
 * // → { nik: '[REDACTED]', email: 'a@b***com', username: 'budi' }
 *
 * @example
 * // Override a field strategy
 * maskPIIInObject({ email: 'a@b.com' }, {
 *   fieldDefinitions: { email: { level: 'P1', strategy: 'hash' } },
 * })
 * // → { email: 'a3f2...sha256' }
 *
 * @example
 * // Legacy — explicit field list (backward compatible)
 * maskPIIInObject({ email: 'a@b.com' }, { piiFields: ['email'] })
 * // → { email: 'a@b***com' }
 */
export function maskPIIInObject<T>(obj: T, options: MaskPIIInObjectOptions = {}): T {
  if (obj == null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskPIIInObject(item, options)) as T;
  }

  // ── Legacy path ─────────────────────────────────────────────────────────────
  // Triggered only when the caller explicitly passes `piiFields`.
  // Preserves the original flat-mask behaviour exactly.
  if (options.piiFields) {
    const legacyFields = buildLegacyFieldSet(options);
    const maskOptions  = options.maskOptions ?? {};
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const normalizedKey = normalizeFieldKey(key);
      if (legacyFields.has(normalizedKey) && typeof value === 'string' && value.length > 0) {
        result[key] = maskPII(value, maskOptions);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = maskPIIInObject(value as Record<string, unknown>, options);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  // ── Default path ─────────────────────────────────────────────────────────────
  // Uses DEFAULT_PII_FIELD_DEFINITIONS merged with any caller-supplied fieldDefinitions.
  const minLevel = options.minLevel ?? 'P2';
  const legacyFallbackFields = buildLegacyFieldSet(options);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const normalizedKey = normalizeFieldKey(key);
    const def = resolveFieldDefinition(normalizedKey, options);

    // Determine whether this field should be processed
    const shouldProcess = def
      ? meetsMinLevel(def.level, minLevel)
      : legacyFallbackFields.has(normalizedKey);

    if (shouldProcess && typeof value === 'string' && value.length > 0) {
      result[key] = def
        ? applyStrategy(value, def, options)
        // Field is in the legacy fallback set but has no definition — use maskPII
        : maskPII(value, options.maskOptions ?? {});
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskPIIInObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}