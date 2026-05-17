import { id } from './id';
import { en } from './en';

export type Locale = 'id' | 'en';
export const DEFAULT_LOCALE: Locale = 'id';

export const translations: Record<Locale, typeof id> = {
  id,
  en,
};

export { id, en };
export type { TranslationDict } from './id';
