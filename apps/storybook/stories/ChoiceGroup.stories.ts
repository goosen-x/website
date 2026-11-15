import ChoiceGroup from '@moscowcss/ui/components/ChoiceGroup';

export default {
  title: 'Components/ChoiceGroup',
  component: ChoiceGroup,
};

export const Column = {
  args: {
    name: 'format',
    legend: 'Формат',
    required: true,
    options: [
      { value: 'talk', label: 'Доклад' },
      { value: 'standup', label: 'Стендап' },
      { value: 'workshop', label: 'Воркшоп' },
      { value: 'other', label: 'Другое' },
    ],
  },
};

export const Scale = {
  args: {
    name: 'eventRating',
    legend: 'Оценка митапа',
    hint: '1 — плохо, 5 — отлично',
    layout: 'row',
    required: true,
    options: ['1', '2', '3', '4', '5'].map((value) => ({ value, label: value })),
  },
};
