import Field from '@moscowcss/ui/components/Field';

export default {
  title: 'Components/Field',
  component: Field,
};

export const Text = {
  args: { name: 'contact', label: 'Как с вами связаться', hint: 'Telegram @ник или почта', required: true, autocomplete: 'off' },
};

export const Textarea = {
  args: { name: 'theses', label: 'Тезисы', control: 'textarea', rows: 5, maxlength: 2000 },
};

export const Checkbox = {
  args: { name: 'consent', control: 'checkbox', required: true, slots: { default: 'Согласен на обработку данных' } },
};
