import { describe, expect, it } from 'vitest';
import { heroCtaAt } from './cta';

// 32-й митап: 26 ноября 2026, 19:00 по Москве (+03:00).
const start = new Date('2026-11-26T19:00:00+03:00');
const at = (iso: string) => new Date(`${iso}+03:00`);

describe('heroCtaAt', () => {
  it('за неделю — регистрация', () => {
    expect(heroCtaAt(start, at('2026-11-19T12:00:00'), true)).toBe('register');
  });

  it('регистрация закрывается ровно за 48 часов до начала', () => {
    expect(heroCtaAt(start, at('2026-11-24T18:59:59'), true)).toBe('register');
    expect(heroCtaAt(start, at('2026-11-24T19:00:00'), true)).toBeNull();
  });

  it('между закрытием регистрации и вечером митапа кнопки нет', () => {
    expect(heroCtaAt(start, at('2026-11-26T17:59:59'), true)).toBeNull();
  });

  it('с 18:00 до 22:00 — вопрос спикеру, в том числе без ссылки на регистрацию', () => {
    expect(heroCtaAt(start, at('2026-11-26T18:00:00'), true)).toBe('question');
    expect(heroCtaAt(start, at('2026-11-26T20:30:00'), false)).toBe('question');
    expect(heroCtaAt(start, at('2026-11-26T21:59:59'), true)).toBe('question');
  });

  it('после 22:00 кнопки нет', () => {
    expect(heroCtaAt(start, at('2026-11-26T22:00:00'), true)).toBeNull();
  });

  it('без ссылки на регистрацию до вечера митапа кнопки нет', () => {
    expect(heroCtaAt(start, at('2026-11-19T12:00:00'), false)).toBeNull();
  });
});
