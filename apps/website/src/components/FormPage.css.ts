import { style } from '@vanilla-extract/css';
import { vars } from '@moscowcss/design-system';

const line = `${vars.border.width.thin} ${vars.border.style.solid} ${vars.color.border}`;

export const root = style({
  display: vars.display.flex,
  flexDirection: vars.flexDirection.column,
  gap: vars.spacing.xl,
  maxWidth: '40rem',
  color: vars.color.text,
  font: vars.font.shorthand.body,
});

export const form = style({
  display: vars.display.flex,
  flexDirection: vars.flexDirection.column,
  gap: vars.spacing.xxl,
  selectors: {
    '&[hidden]': { display: vars.display.none },
  },
});

export const group = style({
  display: vars.display.flex,
  flexDirection: vars.flexDirection.column,
  gap: vars.spacing.xxl,
  selectors: {
    '&[hidden]': { display: vars.display.none },
  },
});

export const note = style({
  margin: 0,
  font: vars.font.shorthand.caption,
});

// Виджет Turnstile — рамка 300×65: место под него занято заранее, чтобы форма не сдвигалась после загрузки скрипта.
export const captcha = style({
  minBlockSize: '4.0625rem',
});

export const submit = style({
  maxInlineSize: '20rem',
  selectors: {
    '&[aria-disabled="true"]': { opacity: 0.5, cursor: 'progress' },
  },
});

export const status = style({
  margin: 0,
  font: vars.font.shorthand.body,
  selectors: {
    '&:empty': { display: vars.display.none },
  },
});

export const panel = style({
  padding: vars.padding.xl,
  border: line,
  selectors: {
    '&[hidden]': { display: vars.display.none },
  },
});

export const fallback = style([
  panel,
  {
    display: vars.display.flex,
    flexDirection: vars.flexDirection.column,
    gap: vars.spacing.m,
    selectors: {
      '&[hidden]': { display: vars.display.none },
    },
  },
]);

export const fallbackList = style({
  display: vars.display.flex,
  flexWrap: 'wrap',
  gap: vars.spacing.m,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const policy = style({
  margin: 0,
  font: vars.font.shorthand.caption,
});

// Приманка для ботов: выведена из потока и обрезана до точки, а не `display: none`, который боты распознают.
export const trap = style({
  position: vars.position.absolute,
  inlineSize: vars.border.width.thin,
  blockSize: vars.border.width.thin,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
});
