import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('merges tailwind classes correctly', () => {
        expect(cn('p-2', 'm-2')).toBe('p-2 m-2');
    });

    it('handles conditional classes', () => {
        expect(cn('p-2', true && 'text-red-500', false && 'text-blue-500')).toBe('p-2 text-red-500');
    });

    it('resolves tailwind conflicts', () => {
        // tailwind-merge should resolve conflicts (p-4 overrides p-2)
        expect(cn('p-2', 'p-4')).toBe('p-4');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles arrays and objects', () => {
        expect(cn(['p-2', 'm-2'])).toBe('p-2 m-2');
        expect(cn({ 'p-2': true, 'm-2': false })).toBe('p-2');
    });
});
