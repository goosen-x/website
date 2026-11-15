import { formsConfig } from './config';
import { createKeyKeeper, fetchCurrentEvent, submitForm, type CurrentEvent, type Outcome } from './delivery';
import {
  cfpBody,
  feedbackBody,
  normalizeFieldKey,
  questionBody,
  validateCfp,
  validateFeedback,
  validateQuestion,
  type FieldErrors,
  type FieldValues,
  type FormKind,
  type SpeakerValues,
} from './payload';

const READY = 'data-form-ready';
const MOSCOW = 'Europe/Moscow';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
}

const turnstileOf = (): TurnstileApi | undefined => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

let turnstileLoading: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  turnstileLoading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const ready = turnstileOf();
    if (ready) {
      resolve(ready);
      return;
    }
    const script = document.createElement('script');
    script.src = formsConfig.turnstileScript;
    script.async = true;
    script.onload = () => {
      const api = turnstileOf();
      if (api) resolve(api);
      else reject(new Error('turnstile'));
    };
    script.onerror = () => reject(new Error('turnstile'));
    document.head.append(script);
  });
  return turnstileLoading;
}

function pick<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Нет элемента ${selector}`);
  return element;
}

// Подставляет значения в разметку из `<template>`: токены `__i__`, `__speaker__`, `__talk__` в атрибутах и тексте.
function fillTemplate(fragment: DocumentFragment, tokens: Record<string, string>): void {
  const replace = (value: string) => Object.entries(tokens).reduce((text, [token, replacement]) => text.split(token).join(replacement), value);
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Element) {
      for (const attribute of Array.from(node.attributes)) {
        if (attribute.value.includes('__')) node.setAttribute(attribute.name, replace(attribute.value));
      }
    } else if (node.nodeValue?.includes('__')) {
      node.nodeValue = replace(node.nodeValue);
    }
  }
}

export function setupForm(root: HTMLElement): void {
  if (root.hasAttribute(READY)) return;
  root.setAttribute(READY, '');

  const kind = root.dataset['form'] as FormKind;
  const locale = root.dataset['locale'] ?? 'ru';
  const messages = JSON.parse(root.dataset['messages'] ?? '{}') as Record<string, string>;
  const text = (key: string): string => messages[key] ?? key;

  const form = pick<HTMLFormElement>(root, 'form[data-form-form]');
  const loadingNote = root.querySelector<HTMLElement>('[data-form-loading]');
  const status = pick<HTMLElement>(root, '[data-form-status]');
  const fallback = pick<HTMLElement>(root, '[data-form-fallback]');
  const fallbackText = pick<HTMLElement>(fallback, '[data-fallback-text]');
  const success = pick<HTMLElement>(root, '[data-form-success]');
  const submit = pick<HTMLButtonElement>(form, '[data-form-submit]');
  const captcha = pick<HTMLElement>(form, '[data-form-captcha]');
  const captchaError = pick<HTMLElement>(form, '[data-captcha-error]');
  const keeper = createKeyKeeper();

  let event: CurrentEvent | undefined;
  let token: string | undefined;
  let widgetId: string | undefined;
  let captchaBroken = false;
  let sending = false;

  const fieldOf = (key: string): HTMLElement | undefined =>
    Array.from(form.querySelectorAll<HTMLElement>('[data-field]')).find((element) => element.dataset['field'] === key);

  const clearField = (wrap: HTMLElement) => {
    const message = wrap.querySelector<HTMLElement>('[data-field-error]');
    if (message) {
      message.textContent = '';
      message.hidden = true;
    }
    wrap.querySelectorAll('[data-field-control]').forEach((control) => control.removeAttribute('aria-invalid'));
  };

  const clearErrors = () => {
    form.querySelectorAll<HTMLElement>('[data-field]').forEach(clearField);
    captchaError.textContent = '';
    captchaError.hidden = true;
    status.textContent = '';
    fallback.hidden = true;
  };

  const showFieldError = (key: string, message: string): boolean => {
    const wrap = fieldOf(key);
    const slot = wrap?.querySelector<HTMLElement>('[data-field-error]');
    if (!wrap || !slot) return false;
    slot.textContent = message;
    slot.hidden = false;
    wrap.querySelectorAll('[data-field-control]').forEach((control) => control.setAttribute('aria-invalid', 'true'));
    return true;
  };

  const focusFirstInvalid = () => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();

  const messageOf = (code: FieldErrors[string], key: string): string => {
    if (key === 'consent') return text('forms.error.consent');
    if (code === 'invalid') return text('forms.error.invalid');
    const control = fieldOf(key)?.querySelector('[data-field-control]');
    return control instanceof HTMLInputElement && (control.type === 'radio' || control.type === 'checkbox') ? text('forms.error.choose') : text('forms.error.required');
  };

  const showFallback = (message: string) => {
    status.textContent = '';
    fallbackText.textContent = message;
    fallback.hidden = false;
  };

  const resetCaptcha = () => {
    token = undefined;
    if (widgetId !== undefined) turnstileOf()?.reset(widgetId);
  };

  const valuesOf = (): FieldValues => {
    const values: FieldValues = {};
    for (const [name, value] of new FormData(form).entries()) {
      if (typeof value === 'string') values[name] = value;
    }
    if (event) values['eventId'] = event.id;
    return values;
  };

  const speakersOf = (values: FieldValues): SpeakerValues[] =>
    (event?.speakers ?? []).map((speaker, index) => ({
      speakerId: speaker.id,
      rating: values[`speakers.${String(index)}.rating`],
      comment: values[`speakers.${String(index)}.comment`],
    }));

  const finish = () => {
    form.hidden = true;
    fallback.hidden = true;
    success.hidden = false;
    success.focus();
    keeper.reset();
  };

  const handle = (outcome: Outcome) => {
    switch (outcome.kind) {
      case 'accepted':
        finish();
        return;
      case 'validation': {
        const unmatched: string[] = [];
        for (const [key, message] of Object.entries(outcome.fields)) {
          if (!showFieldError(normalizeFieldKey(key), message)) unmatched.push(message);
        }
        status.textContent = [text('forms.error.summary'), ...unmatched].join(' ');
        focusFirstInvalid();
        break;
      }
      case 'rate_limited':
        status.textContent = text('forms.error.rateLimited');
        break;
      case 'blocked':
        showFallback(text('forms.error.blocked'));
        break;
      case 'captcha_failed':
        status.textContent = text('forms.error.captcha');
        break;
      case 'rejected':
        status.textContent = text('forms.error.rejected');
        break;
      case 'unavailable':
        showFallback(text('forms.fallback.title'));
        break;
    }
    resetCaptcha();
  };

  const buildBody = (values: FieldValues): { errors: FieldErrors; body: Record<string, unknown> } => {
    switch (kind) {
      case 'cfp':
        return { errors: validateCfp(values), body: cfpBody(values) };
      case 'feedback': {
        const speakers = speakersOf(values);
        return { errors: validateFeedback(values, speakers), body: feedbackBody(values, speakers) };
      }
      case 'question':
        return { errors: validateQuestion(values), body: questionBody(values, event?.id) };
    }
  };

  form.addEventListener('input', (changed) => {
    const wrap = (changed.target as HTMLElement | null)?.closest<HTMLElement>('[data-field]');
    if (wrap) clearField(wrap);
  });

  form.addEventListener('submit', (submitted) => {
    submitted.preventDefault();
    if (sending) return;
    clearErrors();

    const values = valuesOf();
    const { errors, body } = buildBody(values);
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      for (const key of keys) showFieldError(key, messageOf(errors[key] ?? 'required', key));
      status.textContent = text('forms.error.summary');
      focusFirstInvalid();
      return;
    }
    if (captchaBroken) {
      showFallback(text('forms.error.captchaLoad'));
      return;
    }
    if (!token) {
      captchaError.textContent = text('forms.error.captchaMissing');
      captchaError.hidden = false;
      return;
    }

    sending = true;
    submit.setAttribute('aria-disabled', 'true');
    status.textContent = text('forms.sending');
    // Токен капчи меняется при каждой попытке, поэтому ключ идемпотентности считается без него
    const key = keeper.keyFor(body);
    void submitForm(kind, { ...body, turnstileToken: token }, key)
      .then(handle)
      .finally(() => {
        sending = false;
        submit.removeAttribute('aria-disabled');
        if (status.textContent === text('forms.sending')) status.textContent = '';
      });
  });

  const reveal = () => {
    if (loadingNote) loadingNote.hidden = true;
    form.hidden = false;
    loadTurnstile()
      .then((api) => {
        widgetId = api.render(captcha, {
          sitekey: formsConfig.turnstileSiteKey,
          language: locale,
          theme: document.documentElement.dataset['theme'] ?? 'auto',
          callback: (value: string) => {
            token = value;
            captchaError.hidden = true;
          },
          'expired-callback': () => {
            token = undefined;
          },
          'error-callback': () => {
            token = undefined;
            captchaBroken = true;
            showFallback(text('forms.error.captchaLoad'));
            return true;
          },
        });
      })
      .catch(() => {
        captchaBroken = true;
        showFallback(text('forms.error.captchaLoad'));
      });
  };

  const eventLine = (current: CurrentEvent): string => {
    const date = new Date(current.startsAt);
    const when = Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: MOSCOW }).format(date);
    return [current.title, when, current.venue].filter(Boolean).join(' · ');
  };

  const setupFeedback = (current: CurrentEvent) => {
    pick<HTMLElement>(form, '[data-event-info]').textContent = text('forms.feedback.event').replace('{event}', eventLine(current));

    const venue = pick<HTMLElement>(form, '[data-venue-block]');
    const syncVenue = () => {
      const offline = new FormData(form).get('attendance') === 'offline';
      venue.hidden = !offline;
      venue.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-field-control]').forEach((control) => {
        control.disabled = !offline;
      });
    };
    form.querySelectorAll('input[name="attendance"]').forEach((radio) => radio.addEventListener('change', syncVenue));
    syncVenue();

    const block = pick<HTMLElement>(form, '[data-speakers]');
    const template = pick<HTMLTemplateElement>(form, 'template[data-speaker-template]');
    current.speakers.forEach((speaker, index) => {
      const clone = template.content.cloneNode(true) as DocumentFragment;
      fillTemplate(clone, { __i__: String(index), __speaker__: speaker.name, __talk__: speaker.talkTitle });
      if (speaker.talkTitle === '') {
        const hint = clone.querySelector('[id$="-hint"]');
        const control = clone.querySelectorAll('[aria-describedby]');
        control.forEach((element) => {
          element.setAttribute('aria-describedby', (element.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id !== hint?.id).join(' '));
        });
        hint?.remove();
      }
      pick(block, '[data-speakers-list]').append(clone);
    });
    block.hidden = current.speakers.length === 0;
  };

  const setupQuestion = (current: CurrentEvent | undefined) => {
    const pickWrap = pick<HTMLElement>(form, '[data-speaker-pick]');
    const select = pick<HTMLSelectElement>(pickWrap, 'select');
    const speakerOption = pick<HTMLInputElement>(form, 'input[name="target"][value="speaker"]');
    const note = pick<HTMLElement>(form, '[data-no-event]');

    if (current && current.speakers.length > 0) {
      for (const speaker of current.speakers) {
        const option = document.createElement('option');
        option.value = speaker.id;
        option.textContent = speaker.talkTitle ? `${speaker.name} — ${speaker.talkTitle}` : speaker.name;
        select.append(option);
      }
    } else {
      speakerOption.disabled = true;
      note.hidden = false;
    }

    const sync = () => {
      const toSpeaker = new FormData(form).get('target') === 'speaker';
      pickWrap.hidden = !toSpeaker;
      select.disabled = !toSpeaker;
    };
    form.querySelectorAll('input[name="target"]').forEach((radio) => radio.addEventListener('change', sync));
    sync();
  };

  if (kind === 'cfp') {
    reveal();
    return;
  }

  if (loadingNote) loadingNote.hidden = false;

  void fetchCurrentEvent().then((result) => {
    if (loadingNote) loadingNote.hidden = true;
    if (kind === 'question') {
      if (result.kind === 'found') event = result.event;
      setupQuestion(event);
      reveal();
      return;
    }
    if (result.kind === 'found') {
      event = result.event;
      setupFeedback(event);
      reveal();
    } else if (result.kind === 'none') {
      const none = pick<HTMLElement>(root, '[data-form-none]');
      none.hidden = false;
    } else {
      showFallback(text('forms.feedback.loadFailed'));
    }
  });
}
