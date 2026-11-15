import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@moscowcss/design-system';

export const root = style({
  display: vars.display.flex,
  flexDirection: vars.flexDirection.column,
  gap: vars.spacing.s,
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
  color: vars.color.text,
});

export const legend = style({
  padding: 0,
  marginBlockEnd: vars.spacing.s,
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

export const options = styleVariants({
  column: {
    display: vars.display.flex,
    flexDirection: vars.flexDirection.column,
  },
  row: {
    display: vars.display.flex,
    flexWrap: 'wrap',
    columnGap: vars.spacing.xl,
  },
});

export const option = style({
  display: vars.display.flex,
  alignItems: vars.alignItems.center,
  gap: vars.spacing.m,
  minBlockSize: vars.size.hitTarget,
  font: vars.font.shorthand.body,
  cursor: 'pointer',
});

export const radio = style({
  flexShrink: 0,
  inlineSize: vars.size.decorCheckbox,
  blockSize: vars.size.decorCheckbox,
  margin: 0,
  accentColor: vars.color.text,
  cursor: 'pointer',
});

export const error = style({
  margin: 0,
  paddingInlineStart: vars.padding.m,
  borderInlineStart: `${vars.border.width.thick} ${vars.border.style.solid} ${vars.color.danger}`,
  font: vars.font.shorthand.caption,
  selectors: {
    '&[hidden]': { display: vars.display.none },
  },
});
