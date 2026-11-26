import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { updateProfileSchema } from '../shared';

describe('Authentication and Security Logic', () => {
  const secret = 'test_secret_for_auth_eval_2026';

  it('securely hashes and compares passwords using bcrypt', async () => {
    const rawPassword = 'StrongPassword#2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    const isCorrect = await bcrypt.compare(rawPassword, hash);
    expect(isCorrect).toBe(true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    expect(isWrong).toBe(false);
  });

  it('signs and verifies JWT authentication tokens', () => {
    const payload = { userId: 'usr-12345', email: 'asraful@studyflow.dev' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('rejects tampered JWT tokens', () => {
    const token = jwt.sign({ userId: 'usr-123' }, secret, { expiresIn: '1h' });
    const tampered = token.slice(0, -5) + 'abcde';

    expect(() => {
      jwt.verify(tampered, secret);
    }).toThrow();
  });

  it('validates avatar URL correctly in updateProfileSchema', () => {
    // Valid HTTPS URL
    const validHttp = updateProfileSchema.safeParse({
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });
    expect(validHttp.success).toBe(true);

    // Empty string (clearing avatar)
    const emptyString = updateProfileSchema.safeParse({
      avatarUrl: '',
    });
    expect(emptyString.success).toBe(true);

    // Null (clearing avatar)
    const nullVal = updateProfileSchema.safeParse({
      avatarUrl: null,
    });
    expect(nullVal.success).toBe(true);

    // Undefined (omitted)
    const omitted = updateProfileSchema.safeParse({});
    expect(omitted.success).toBe(true);

    // Invalid non-URL string
    const invalidString = updateProfileSchema.safeParse({
      avatarUrl: 'not-a-valid-url',
    });
    expect(invalidString.success).toBe(false);

    // Invalid URL without protocol
    const noProtocol = updateProfileSchema.safeParse({
      avatarUrl: 'example.com/avatar.jpg',
    });
    expect(noProtocol.success).toBe(false);
  });
});
