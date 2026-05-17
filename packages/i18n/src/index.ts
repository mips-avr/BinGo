import { id } from './id';
import { en } from './en';
import type { TranslationDict } from './id';

export type Locale = 'id' | 'en';
export const DEFAULT_LOCALE: Locale = 'id';

export const translations: Record<Locale, TranslationDict> = {
  id,
  en,
};

export { id, en };
export type { TranslationDict };
