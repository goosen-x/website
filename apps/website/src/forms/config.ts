// Единственное место с адресами бота и ключом капчи. Значения временные: их подставляют при
// развёртывании бота, в других файлах адреса не повторяются.
export const formsConfig = {
  // Адрес за Cloudflare: пробуем первым
  primaryBase: 'https://bot-api.css.moscow',
  // Прямой адрес сервера: запасной путь, если первый не ответил
  directBase: 'https://bot-direct.css.moscow',
  // Публичный ключ Cloudflare Turnstile; сейчас официальный тестовый, пропускает любой ответ
  turnstileSiteKey: '1x00000000000000000000AA',
  turnstileScript: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  // Сколько ждать ответа одного адреса до перехода к следующему, мс
  timeoutMs: 8000,
} as const;

export interface FallbackLink {
  /** Ключ словаря с названием ссылки; у ссылок на людей названия нет — подписью служит ник */
  labelKey?: 'forms.fallback.bot' | 'forms.fallback.vk' | 'forms.fallback.chat';
  /** Ник для подписи ссылки на человека */
  handle?: string;
  href: string;
}

// Куда писать, если форма не отправилась. Пока бот не развёрнут, у его ссылки пустой адрес:
// такую ссылку страница не показывает, а при развёртывании сюда ставят настоящий адрес.
export const fallbackLinks: readonly FallbackLink[] = [
  { labelKey: 'forms.fallback.bot', href: '' },
  { labelKey: 'forms.fallback.vk', href: 'https://vk.ru/css_moscow' },
  { labelKey: 'forms.fallback.chat', href: 'https://t.me/moscowcss_chat' },
  { handle: '@DreamShaded', href: 'https://t.me/DreamShaded' },
  { handle: '@RinaPa', href: 'https://t.me/RinaPa' },
  { handle: '@antytoto', href: 'https://t.me/antytoto' },
];
