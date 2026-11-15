// Единственное место с адресом бота и ключом капчи: в других файлах они не повторяются.
export const formsConfig = {
  // HTTP API бота (moscowcss-bot, спека 005): nginx на сервере, без Cloudflare перед ним
  apiBase: 'https://api.css.moscow',
  // Публичный ключ Cloudflare Turnstile виджета для css.moscow; секретная пара живёт только на сервере бота
  turnstileSiteKey: '0x4AAAAAAGB_qEV7hzYwuObm',
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

// Куда писать, если форма не отправилась. Ссылку с пустым адресом страница не показывает.
export const fallbackLinks: readonly FallbackLink[] = [
  { labelKey: 'forms.fallback.bot', href: 'https://t.me/MoscowCSS_bot' },
  { labelKey: 'forms.fallback.vk', href: 'https://vk.ru/css_moscow' },
  { labelKey: 'forms.fallback.chat', href: 'https://t.me/moscowcss_chat' },
  { handle: '@DreamShaded', href: 'https://t.me/DreamShaded' },
  { handle: '@RinaPa', href: 'https://t.me/RinaPa' },
  { handle: '@antytoto', href: 'https://t.me/antytoto' },
];
