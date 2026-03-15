import {
  DEFAULT_PII_FIELDS,
  DEFAULT_PII_FIELD_DEFINITIONS,
  maskPII,
  maskPIIInObject,
  redactPII,
  hashPII,
} from './pii.utils';

// ─────────────────────────────────────────────────────────────────────────────
// maskPII
// ─────────────────────────────────────────────────────────────────────────────

describe('maskPII', () => {
  describe('when given a normal-length string', () => {
    it('should show first 3 and last 3 chars by default', () => {
      expect(maskPII('JohnDoe123')).toBe('Joh****123');
    });

    it('should mask the middle with asterisks', () => {
      expect(maskPII('abcdefgh')).toBe('abc**fgh');
    });
  });

  describe('when given a short string (length <= 5)', () => {
    it('should show only the first char and mask the rest', () => {
      expect(maskPII('Hi')).toBe('H*');
      expect(maskPII('ABCDE')).toBe('A****');
    });

    it('should return a single mask char for a single-char string', () => {
      expect(maskPII('x')).toBe('*');
    });
  });

  describe('when given an empty or non-string value', () => {
    it('should return the value unchanged', () => {
      expect(maskPII('')).toBe('');
      expect(maskPII('   ')).toBe('   ');
      expect(maskPII(null as unknown as string)).toBe(null);
    });
  });

  describe('when given custom options', () => {
    it('should respect visibleStart and visibleEnd', () => {
      expect(maskPII('1234567890', { visibleStart: 2, visibleEnd: 2 })).toBe('12******90');
    });

    it('should use a custom maskChar', () => {
      expect(maskPII('abcdefgh', { maskChar: 'x' })).toBe('abcxxfgh');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// redactPII
// ─────────────────────────────────────────────────────────────────────────────

describe('redactPII', () => {
  it('should return the default placeholder', () => {
    expect(redactPII()).toBe('[REDACTED]');
  });

  it('should return a custom placeholder', () => {
    expect(redactPII('[HIDDEN]')).toBe('[HIDDEN]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hashPII
// ─────────────────────────────────────────────────────────────────────────────

describe('hashPII', () => {
  it('should return a 64-char hex string', () => {
    expect(hashPII('test')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should be deterministic for the same input', () => {
    expect(hashPII('budi@example.com')).toBe(hashPII('budi@example.com'));
  });

  it('should produce different hashes for different inputs', () => {
    expect(hashPII('a')).not.toBe(hashPII('b'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// maskPIIInObject — legacy behaviour (piiFields)
// ─────────────────────────────────────────────────────────────────────────────

describe('maskPIIInObject (legacy — piiFields)', () => {
  describe('when object has PII string fields', () => {
    it('should mask fields in DEFAULT_PII_FIELDS', () => {
      const obj = { full_name: 'John Doe', email: 'john@example.com', id: 1 };
      const result = maskPIIInObject(obj);
      expect(result.full_name).toBe('Joh**Doe');
      expect(result.email).toBe('joh**********com');
      expect(result.id).toBe(1);
    });

    it('should normalize field names (lowercase, spaces to underscores)', () => {
      const obj = { 'Full Name': 'Jane Smith' };
      const result = maskPIIInObject(obj);
      expect(result['Full Name']).toBe('Jan****ith');
    });

    it('should not mask fields that are not in the PII set', () => {
      const obj = { title: 'Manager', status: 'active' };
      const result = maskPIIInObject(obj);
      expect(result.title).toBe('Manager');
      expect(result.status).toBe('active');
    });
  });

  describe('when using customPIIFields', () => {
    it('should mask default fields plus the custom fields', () => {
      const obj = { email: 'a@b.com', internal_id: 'secret123' };
      const result = maskPIIInObject(obj, { customPIIFields: ['internal_id'] });
      expect(result.email).toBe('a@b*com');
      expect(result.internal_id).toBe('sec***123');
    });
  });

  describe('when using piiFields override', () => {
    it('should use only the provided field set, ignoring defaults', () => {
      const obj = { email: 'a@b.com', custom_secret: 'xyz' };
      const result = maskPIIInObject(obj, { piiFields: ['custom_secret'] });
      expect(result.email).toBe('a@b.com');
      expect(result.custom_secret).toBe('x**');
    });
  });

  describe('when the object contains nested objects and arrays', () => {
    it('should recurse into nested objects', () => {
      const obj = { user: { full_name: 'Nested Name', nested:{date_of_birth: 30091992, inner:{date_of_birth: "30091992"}} } };
      const result = maskPIIInObject(obj);
      expect(result.user.full_name).toBe('Nes*****ame');
      expect(result.user.nested.date_of_birth).toBe('3009****');
      expect(result.user.nested.inner.date_of_birth).toBe('3009****');
    });

    it('should recurse into arrays', () => {
      const obj = { items: [{ email: 'test@test.com' }] };
      const result = maskPIIInObject(obj);
      expect(result.items[0].email).toBe('tes*******com');
    });
  });

  describe('when passing maskOptions', () => {
    it('should forward maskOptions to maskPII, overriding field-level defaults', () => {
      const obj = { full_name: 'ABCDEFGH' };
      const result = maskPIIInObject(obj, { maskOptions: { visibleStart: 2, visibleEnd: 2 } });
      expect(result.full_name).toBe('AB****GH');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// maskPIIInObject — default behaviour (fieldDefinitions)
// ─────────────────────────────────────────────────────────────────────────────

describe('maskPIIInObject (default — fieldDefinitions)', () => {
  describe('when using built-in P0 fields', () => {
    it('should redact P0 fields by default', () => {
      const result = maskPIIInObject({ nik: '3201010101980001', otp: '123456' });
      expect(result.nik).toBe('[REDACTED]');
      expect(result.otp).toBe('[REDACTED]');
    });

    it('should pass through non-PII fields untouched', () => {
      const result = maskPIIInObject({ nik: '320101', username: 'budi99' });
      expect(result.username).toBe('budi99');
    });
  });

  describe('when overriding strategy via fieldDefinitions', () => {
    it('should hash a field when strategy is overridden to hash', () => {
      const result = maskPIIInObject(
        { email: 'budi@example.com' },
        { fieldDefinitions: { email: { level: 'P1', strategy: 'hash' } } },
      );
      expect(result.email).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should redact a field when strategy is overridden to redact', () => {
      const result = maskPIIInObject(
        { email: 'budi@example.com' },
        { fieldDefinitions: { email: { level: 'P1', strategy: 'redact' } } },
      );
      expect(result.email).toBe('[REDACTED]');
    });

    it('should use a field-level placeholder when provided', () => {
      const result = maskPIIInObject(
        { nik: '320101', otp: '123456' },
        {
          fieldDefinitions: { nik: { level: 'P0', strategy: 'redact', placeholder: '[NIK HIDDEN]' } },
          placeholder: '[SECRET]',
        },
      );
      expect(result.nik).toBe('[NIK HIDDEN]');
      expect(result.otp).toBe('[SECRET]');
    });

    it('should allow per-field visibleStart and visibleEnd for mask strategy', () => {
      const result = maskPIIInObject(
        { card_number: '4111111111111234' },
        {
          fieldDefinitions: {
            card_number: { level: 'P1', strategy: 'mask', visibleStart: 0, visibleEnd: 4, maskChar: '•' },
          },
        },
      );
      expect(result.card_number).toBe('••••••••••••1234');
    });
  });

  describe('when adding a brand-new custom field via fieldDefinitions', () => {
    it('should apply the custom field definition', () => {
      const result = maskPIIInObject(
        { driver_license: 'SIM-A-12345', full_name: 'Budi' },
        { fieldDefinitions: { driver_license: { level: 'P0', strategy: 'redact' } } },
      );
      expect(result.driver_license).toBe('[REDACTED]');
      expect(result.full_name).toBe('B***'); // short-string rule
    });
  });

  describe('when using maskOptions with fieldDefinitions', () => {
    it('should give maskOptions precedence over field-level visibleStart/visibleEnd', () => {
      const result = maskPIIInObject(
        { full_name: 'ABCDEFGH' },
        { maskOptions: { visibleStart: 2, visibleEnd: 2 } },
      );
      // full_name definition has visibleStart:3, visibleEnd:3
      // maskOptions: { visibleStart:2, visibleEnd:2 } should win
      expect(result.full_name).toBe('AB****GH');
    });
  });

  describe('when using minLevel', () => {
    it('should skip P2 fields when minLevel is P1', () => {
      const result = maskPIIInObject(
        { nik: '320101', email: 'a@b.com', occupation: 'Engineer' },
        { minLevel: 'P1' },
      );
      expect(result.nik).toBe('[REDACTED]');   // P0 — processed
      expect(result.email).toBe('a@b*com');    // P1 — processed
      expect(result.occupation).toBe('Engineer'); // P2 — skipped
    });

    it('should skip P1 and P2 fields when minLevel is P0', () => {
      const result = maskPIIInObject(
        { nik: '320101', email: 'a@b.com', occupation: 'Engineer' },
        { minLevel: 'P0' },
      );
      expect(result.nik).toBe('[REDACTED]');
      expect(result.email).toBe('a@b.com');
      expect(result.occupation).toBe('Engineer');
    });

    it('should process all levels when minLevel is P2 (default)', () => {
      const result = maskPIIInObject({ nik: '320101', email: 'a@b.com', occupation: 'Engineer' });
      expect(result.nik).toBe('[REDACTED]');
      expect(result.email).toBe('a@b*com');
      expect(result.occupation).not.toBe('Engineer');
    });
  });

  describe('when using a global placeholder', () => {
    it('should apply the custom placeholder to all redact-strategy fields', () => {
      const result = maskPIIInObject(
        { nik: '320101', password: 'secret99' },
        { placeholder: '***' },
      );
      expect(result.nik).toBe('***');
      expect(result.password).toBe('***');
    });
  });

  describe('when the object contains nested objects and arrays', () => {
    it('should recurse into nested objects', () => {
      const result = maskPIIInObject({ user: { nik: '320101', full_name: 'Budi Santoso' } });
      expect(result.user.nik).toBe('[REDACTED]');
      expect(result.user.full_name).toBe('Bud******oso');
    });

    it('should recurse into arrays', () => {
      const result = maskPIIInObject({ users: [{ nik: '320101' }, { nik: '320102' }] });
      expect(result.users[0].nik).toBe('[REDACTED]');
      expect(result.users[1].nik).toBe('[REDACTED]');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry exports
// ─────────────────────────────────────────────────────────────────────────────

describe('DEFAULT_PII_FIELDS (legacy registry)', () => {
  it('should include the original common PII field names', () => {
    expect(DEFAULT_PII_FIELDS.has('email')).toBe(true);
    expect(DEFAULT_PII_FIELDS.has('phone')).toBe(true);
    expect(DEFAULT_PII_FIELDS.has('full_name')).toBe(true);
    expect(DEFAULT_PII_FIELDS.has('nik')).toBe(true);
  });
});

describe('DEFAULT_PII_FIELD_DEFINITIONS', () => {
  it('should classify nik as P0 redact', () => {
    expect(DEFAULT_PII_FIELD_DEFINITIONS['nik']).toEqual({ level: 'P0', strategy: 'redact' });
  });

  it('should classify email as P1 mask', () => {
    expect(DEFAULT_PII_FIELD_DEFINITIONS['email'].level).toBe('P1');
    expect(DEFAULT_PII_FIELD_DEFINITIONS['email'].strategy).toBe('mask');
  });

  it('should classify occupation as P2 mask', () => {
    expect(DEFAULT_PII_FIELD_DEFINITIONS['occupation'].level).toBe('P2');
    expect(DEFAULT_PII_FIELD_DEFINITIONS['occupation'].strategy).toBe('mask');
  });
});