# PII Utils

Generic helpers for masking, redacting, and hashing personally identifiable information (PII) in strings and objects. Designed for use in logs, API responses, and any output where raw PII must not appear.

---

## Exports at a glance

| Export | Type | Description |
|---|---|---|
| `maskPII` | function | Mask a single string value |
| `redactPII` | function | Return a fixed redaction placeholder |
| `hashPII` | function | SHA-256 hash a value (Node.js only) |
| `maskPIIInObject` | function | Recursively sanitize a JSON object |
| `DEFAULT_PII_FIELD_DEFINITIONS` | const | Full field registry (level + strategy) |
| `DEFAULT_PII_FIELDS` | const | ⚠️ Legacy flat field name set |
| `PIILevel` | type | `'P0' \| 'P1' \| 'P2'` |
| `PIIStrategy` | type | `'mask' \| 'redact' \| 'hash'` |
| `PIIFieldDefinition` | interface | Shape of one registry entry |
| `MaskPIIOptions` | interface | Options for `maskPII` |
| `MaskPIIInObjectOptions` | interface | Options for `maskPIIInObject` |

---

## Sensitivity levels

| Level | Who can see the real value | Examples |
|---|---|---|
| `P0` | Data owner only | NIK, passport, OTP, password, PIN |
| `P1` | Data owner | Email, phone, full name, bank account |
| `P2` | Data owner + data client | Occupation, education, marital status |

---

## Core functions

### `maskPII(value, options?)`

Masks a plain string by replacing its middle section with a repeated character.

```typescript
maskPII('JohnDoe123')
// → 'Joh****123'   (default: 3 visible at start, 3 at end)

maskPII('1234567890', { visibleStart: 2, visibleEnd: 2 })
// → '12******90'

maskPII('abcdefgh', { maskChar: '•' })
// → 'abc••fgh'

maskPII('Hi')    // short string (≤ 5 chars) → show first char only
// → 'H*'
```

**Options** (`MaskPIIOptions`):

| Option | Type | Default | Description |
|---|---|---|---|
| `visibleStart` | `number` | `3` | Chars to show at the start |
| `visibleEnd` | `number` | `3` | Chars to show at the end |
| `maskChar` | `string` | `'*'` | Replacement character |

---

### `redactPII(placeholder?)`

Returns a placeholder string. Use when the value must not appear at all.

```typescript
redactPII()            // → '[REDACTED]'
redactPII('[HIDDEN]')  // → '[HIDDEN]'
```

---

### `hashPII(value)`

Returns the SHA-256 hex digest of the value. Non-reversible; useful for audit logs where a consistent fingerprint is needed without exposing the raw value.

> **Node.js only** — relies on the built-in `crypto` module.

```typescript
hashPII('budi@example.com')
// → 'a3f2c1...' (64-char hex string, always the same for the same input)
```

---

## `maskPIIInObject(obj, options?)`

Recursively traverses an object (or array of objects) and transforms all recognised PII fields. Non-PII fields and non-string values are copied as-is.

### Default behaviour

With no options, or using only `fieldDefinitions` / `minLevel` / `placeholder`, the function uses `DEFAULT_PII_FIELD_DEFINITIONS` to determine how each field is handled.

```typescript
maskPIIInObject({
  nik:        '3201010101980001',
  email:      'budi@example.com',
  full_name:  'Budi Santoso',
  occupation: 'Software Engineer',
  username:   'budi99',   // not in registry → untouched
})

// →
// {
//   nik:        '[REDACTED]',          // P0 redact
//   email:      'bud*************om',  // P1 mask
//   full_name:  'Bud*******nto',       // P1 mask
//   occupation: 'Sof*************er',  // P2 mask
//   username:   'budi99',
// }
```

---

### `fieldDefinitions` — override or extend the registry

Override individual field strategies, mask settings, or placeholders without touching any defaults.

```typescript
// Change email from mask → hash
maskPIIInObject({ email: 'budi@example.com' }, {
  fieldDefinitions: {
    email: { level: 'P1', strategy: 'hash' },
  },
})
// → { email: 'a3f2...sha256' }


// Add a new field not in the built-in registry
maskPIIInObject({ driver_license: 'SIM-A-12345' }, {
  fieldDefinitions: {
    driver_license: { level: 'P0', strategy: 'redact', placeholder: '[LICENSE HIDDEN]' },
  },
})
// → { driver_license: '[LICENSE HIDDEN]' }


// Custom mask settings per field
maskPIIInObject({ card_number: '4111111111111234' }, {
  fieldDefinitions: {
    card_number: { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 4, maskChar: '•' },
  },
})
// → { card_number: '••••••••••••1234' }
```

---

### `minLevel` — skip lower-sensitivity fields

Use this when a caller is permitted to see P2 (or P1) data and you only want to redact the most sensitive fields.

```typescript
maskPIIInObject(
  { nik: '320101', email: 'a@b.com', occupation: 'Engineer' },
  { minLevel: 'P1' },
)
// nik (P0) → '[REDACTED]'   ✅ processed
// email (P1) → 'a@b*com'    ✅ processed
// occupation (P2) → 'Engineer'  ❌ skipped — below minLevel
```

| `minLevel` | P0 | P1 | P2 |
|---|:---:|:---:|:---:|
| `'P0'` | ✅ | ❌ | ❌ |
| `'P1'` | ✅ | ✅ | ❌ |
| `'P2'` | ✅ | ✅ | ✅ | ← default |

---

### `placeholder` — global redact text

Sets the placeholder for all `'redact'` strategy fields in one call. A field-level `placeholder` in `fieldDefinitions` takes priority.

```typescript
maskPIIInObject({ nik: '320101', otp: '123456' }, {
  placeholder: '***',
  fieldDefinitions: {
    nik: { level: 'P0', strategy: 'redact', placeholder: '[NIK HIDDEN]' },
  },
})
// → { nik: '[NIK HIDDEN]', otp: '***' }
```

---

### `maskOptions` — global mask overrides

Forwarded to `maskPII` for every `'mask'` strategy field. **Takes precedence over per-field `visibleStart` / `visibleEnd` / `maskChar`** defined in the registry.

```typescript
maskPIIInObject({ full_name: 'ABCDEFGH' }, {
  maskOptions: { visibleStart: 2, visibleEnd: 2 },
})
// full_name registry default is 3+3, but maskOptions wins
// → { full_name: 'AB****GH' }
```

---

### Nested objects and arrays

Traversal is automatic and recursive.

```typescript
maskPIIInObject({
  user: {
    full_name: 'Siti Rahayu',
    contact: { email: 'siti@example.com' },
  },
  orders: [
    { card_number: '4111111111111234' },
  ],
})
// All PII fields at any depth are transformed.
```

---

## Migration guide

### From the legacy `piiFields` / `customPIIFields` API

The old API is still fully supported and will not be removed. When `piiFields` is present, the function behaves exactly as before: every matched field is masked with `maskPII` using the provided `maskOptions`.

```typescript
// ── Old (still works) ──────────────────────────────────────────────────────

maskPIIInObject(obj, {
  piiFields: ['email', 'phone'],           // replaces entire field set
  maskOptions: { visibleStart: 2 },
})

maskPIIInObject(obj, {
  customPIIFields: ['internal_token'],     // adds to default set
})


// ── New (preferred) ────────────────────────────────────────────────────────

// Override a specific field's strategy
maskPIIInObject(obj, {
  fieldDefinitions: {
    internal_token: { level: 'P0', strategy: 'redact' },
  },
})

// Change how a built-in field is handled
maskPIIInObject(obj, {
  fieldDefinitions: {
    email: { level: 'P1', strategy: 'hash' },
  },
})
```

Key differences when migrating:

| Behaviour | Legacy (`piiFields`) | Default (no `piiFields`) |
|---|---|---|
| Strategy per field | Always `mask` | `mask`, `redact`, or `hash` per definition |
| `minLevel` filtering | ❌ ignored | ✅ supported |
| `placeholder` option | ❌ ignored | ✅ supported |
| Field-level defaults | ❌ all use maskPII defaults | ✅ per field in registry |

---

## Built-in field registry summary

### P0 — always redacted
`nik`, `national_id`, `passport_number`, `kk_number`, `family_card_number`, `medical_record`, `parent_nik`, `marriage_certificate`, `marriage_certificate_number`, `divorce_certificate`, `divorce_certificate_number`, `iris_scan`, `password`, `pin`, `birth_certificate`, `birth_certificate_number`, `npwp`, `otp`

### P1 — masked (some redacted)
`phone`, `phone_number`, `mobile_number`, `email`, `full_name`, `alias`, `name`, `address`, `residential_address`, `date_of_birth`, `place_of_birth`, `nationality`, `postal_code`, `latitude`, `longitude`, `account_number`, `card_number`, `id_number`, `document_id`, `bank_account`, `bank_account_number`, `card_expiry`, `card_expiry_date`, `mother_maiden_name` — **redacted**: `religion`, `salary`, `fingerprint`, `signature`

### P2 — lightly masked
`occupation`, `job`, `education`, `education_qualification`, `marital_status`