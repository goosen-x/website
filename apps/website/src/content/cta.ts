// Что показывает плавающая кнопка на главной в данный момент. Сайт собирается при пуше, а не по часам,
// поэтому то же решение главная пересчитывает в браузере (скрипт в pages/[...locale]/index.astro).

const HOUR_MS = 60 * 60 * 1000;

/** Регистрация закрывается за двое суток до начала: дальше список участников уже у площадки. */
export const REGISTRATION_CLOSES_BEFORE_MS = 48 * HOUR_MS;

/**
 * Окно «вопрос спикеру»: с часа до начала (сбор гостей) до трёх часов после — весь вечер митапа,
 * для тех, у кого не открывается Telegram и чат митапа с хэштегом #вопрос_спикеру.
 */
export const QUESTIONS_OPEN_BEFORE_MS = HOUR_MS;
export const QUESTIONS_CLOSE_AFTER_MS = 3 * HOUR_MS;

export type HeroCta = 'register' | 'question' | null;

/**
 * Кнопка для митапа, который начинается в `startsAt`. `hasRegistration` — у митапа есть ссылка
 * на регистрацию. Между закрытием регистрации и началом окна вопросов кнопки нет.
 */
export function heroCtaAt(startsAt: Date, now: Date, hasRegistration: boolean): HeroCta {
  const start = startsAt.getTime();
  const at = now.getTime();
  if (at >= start - QUESTIONS_OPEN_BEFORE_MS && at < start + QUESTIONS_CLOSE_AFTER_MS) return 'question';
  if (hasRegistration && at < start - REGISTRATION_CLOSES_BEFORE_MS) return 'register';
  return null;
}
