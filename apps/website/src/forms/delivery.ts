import { formsConfig } from './config';

// Ответ бота, разобранный по контракту: страница показывает по нему сообщение и решает, что делать с полями.
export type Outcome =
  | { kind: 'accepted'; duplicate: boolean }
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'rate_limited' }
  | { kind: 'blocked' }
  | { kind: 'captcha_failed' }
  | { kind: 'rejected' }
  | { kind: 'unavailable' };

export interface DeliveryOptions {
  bases?: readonly string[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function fieldsOf(body: Record<string, unknown>): Record<string, string> {
  const raw = body['fields'];
  if (!isRecord(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

/** Переводит ответ в исход. `undefined` — ответ серверной ошибки, его стоит повторить на другом адресе. */
export async function outcomeOf(response: Response): Promise<Outcome | undefined> {
  const { status } = response;
  if (status >= 500) return undefined;
  if (status === 200 || status === 201 || status === 202) {
    const body = await bodyOf(response);
    return { kind: 'accepted', duplicate: body['duplicate'] === true };
  }
  const body = await bodyOf(response);
  if (status === 422) return { kind: 'validation', fields: fieldsOf(body) };
  if (status === 429) return { kind: 'rate_limited' };
  if (status === 403) return body['error'] === 'captcha_failed' ? { kind: 'captcha_failed' } : { kind: 'blocked' };
  return { kind: 'rejected' };
}

/**
 * Общий путь запроса: сначала адрес за Cloudflare, при сетевой ошибке, таймауте или 5xx — прямой, с теми же
 * заголовками (в том числе `Idempotency-Key`). Ответ 4xx не повторяется никогда. Если не ответил ни один адрес —
 * `undefined`.
 */
async function attempt(path: string, init: RequestInit, options: DeliveryOptions): Promise<{ outcome?: Outcome; response?: Response } | undefined> {
  const { bases = [formsConfig.primaryBase, formsConfig.directBase], timeoutMs = formsConfig.timeoutMs, fetchImpl = fetch } = options;
  for (const base of bases) {
    try {
      const response = await fetchImpl(`${base}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      const outcome = await outcomeOf(response.clone());
      if (outcome !== undefined || response.status < 500) return { outcome, response };
    } catch {
      // Сеть, таймаут или обрыв: следующий адрес
    }
  }
  return undefined;
}

/** Отправка формы: `kind` — `cfp`, `feedback` или `question`. */
export async function submitForm(kind: string, payload: unknown, idempotencyKey: string, options: DeliveryOptions = {}): Promise<Outcome> {
  const result = await attempt(
    `/forms/${kind}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify(payload),
    },
    options,
  );
  return result?.outcome ?? { kind: 'unavailable' };
}

export interface CurrentEvent {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  speakers: { id: string; name: string; talkTitle: string }[];
}

export type CurrentEventResult = { kind: 'found'; event: CurrentEvent } | { kind: 'none' } | { kind: 'unavailable' };

const isCurrentEvent = (value: unknown): value is CurrentEvent =>
  isRecord(value) &&
  typeof value['id'] === 'string' &&
  typeof value['title'] === 'string' &&
  Array.isArray(value['speakers']) &&
  value['speakers'].every((speaker) => isRecord(speaker) && typeof speaker['id'] === 'string' && typeof speaker['name'] === 'string');

/** Текущий митап для отзыва и вопроса: 404 значит «сейчас нет такого митапа», остальные неудачи — «не получилось». */
export async function fetchCurrentEvent(options: DeliveryOptions = {}): Promise<CurrentEventResult> {
  const result = await attempt('/public/events/current', { method: 'GET', headers: { accept: 'application/json' } }, options);
  if (!result?.response) return { kind: 'unavailable' };
  if (result.response.status === 404) return { kind: 'none' };
  if (!result.response.ok) return { kind: 'unavailable' };
  const body = await bodyOf(result.response);
  if (!isCurrentEvent(body)) return { kind: 'unavailable' };
  return { kind: 'found', event: { ...body, speakers: body.speakers.map((speaker) => ({ talkTitle: '', ...speaker })) } };
}

// Один ключ на одну попытку отправки: повтор того же содержимого после неудачи идёт с тем же ключом,
// изменённые данные — новая отправка и новый ключ.
export function createKeyKeeper(generate: () => string = () => crypto.randomUUID()) {
  let fingerprint: string | undefined;
  let key: string | undefined;
  return {
    keyFor(payload: unknown): string {
      const next = JSON.stringify(payload);
      if (key === undefined || fingerprint !== next) {
        key = generate();
        fingerprint = next;
      }
      return key;
    },
    reset(): void {
      key = undefined;
      fingerprint = undefined;
    },
  };
}
