import { describe, it, expect } from 'vitest';
import { normalizeEmail, pairHash } from './utils';

describe('Convex Utils', () => {
    describe('normalizeEmail', () => {
        it('lowercases strings', () => {
            expect(normalizeEmail('USER@Example.COM')).toBe('user@example.com');
        });

        it('trims whitespace', () => {
            expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
        });

        it('handles both trimming and lowercasing', () => {
            expect(normalizeEmail('  Test@Unlp.Edu.Ar ')).toBe('test@unlp.edu.ar');
        });
    });

    describe('pairHash', () => {
        it('creates alphabetical hash from two strings', () => {
            expect(pairHash('b', 'a')).toBe('a__b');
            expect(pairHash('a', 'b')).toBe('a__b');
        });

        it('handles identical strings consistently', () => {
            expect(pairHash('a', 'a')).toBe('a__a');
        });
    });
});
