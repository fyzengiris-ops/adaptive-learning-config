export type MaterialChildTypeScheme = 'multiple-only' | 'all';

export function materialChildTypeText(label: string, scheme: MaterialChildTypeScheme, isMultiple: boolean) {
  if (!label) return null;
  if (scheme === 'multiple-only' && !isMultiple) return null;
  return `（${label}）`;
}
