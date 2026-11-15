import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@moscowcss/design-system';

const line = `${vars.border.width.thin} ${vars.border.style.solid} ${vars.color.border}`;

export const root = style({
  display: vars.display.flex,
  flexDirection: vars.flexDirection.column,
  gap: vars.spacing.s,
  minWidth: 0,
  color: vars.color.text,
});

export const label = style({
  font: vars.font.shorthand.body,
  fontWeight: 'bolder',
});

export const mark = style({
  fontWeight: 'normal',
});

export const hint = style({
  margin: 0,
  font: vars.font.shorthand.caption,
});

export const control = style({
  boxSizing: 'border-box',
  inlineSize: '100%',
  minBlockSize: vars.size.archiveControl,
  paddingBlock: vars.padding.s,
  paddingInline: vars.padding.l,
  border: line,
  borderRadius: 0,
  background: vars.color.background,
  color: vars.color.text,
  font: vars.font.shorthand.body,
  selectors: {
    '&[aria-invalid="true"]': { borderColor: vars.color.danger, borderWidth: vars.border.width.medium },
  },
});

export const textarea = style({
  resize: 'vertical',
});

const arrow = vars.spacing.s;
export const select = style({
  cursor: 'pointer',
  appearance: 'none',
  paddingInlineEnd: `calc(${vars.padding.l} * 2 + ${arrow})`,
  backgroundImage: 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
  backgroundPosition: `right calc(${vars.padding.l} + ${arrow} / 2) center, right ${vars.padding.l} center`,
  backgroundSize: `calc(${arrow} / 2) calc(${arrow} / 2)`,
  backgroundRepeat: 'no-repeat',
});

export const check = style({
  display: vars.display.flex,
  alignItems: 'flex-start',
  gap: vars.spacing.m,
  minBlockSize: vars.size.hitTarget,
  font: vars.font.shorthand.body,
  cursor: 'pointer',
});

export const checkbox = style({
  flexShrink: 0,
  inlineSize: vars.size.decorCheckbox,
  blockSize: vars.size.decorCheckbox,
  marginBlock: vars.spacing.xs,
  marginInline: 0,
  accentColor: vars.color.text,
  cursor: 'pointer',
});

// Текст ошибки остаётся цветом текста: красный токен не дотягивает до контраста AA на светлом фоне,
// поэтому сообщение отличает полоса слева и слово в начале, а не только цвет.
export const error = style({
  margin: 0,
  paddingInlineStart: vars.padding.m,
  borderInlineStart: `${vars.border.width.thick} ${vars.border.style.solid} ${vars.color.danger}`,
  font: vars.font.shorthand.caption,
  selectors: {
    '&[hidden]': { display: vars.display.none },
  },
});

globalStyle(`${check} a`, {
  color: vars.color.link,
});
