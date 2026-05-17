/**
 * Re-export i18n bersama. Komponen mobile cukup mengimpor `id`
 * (atau locale aktif) langsung dari sini.
 *
 * Pada Phase 2 kita akan menambahkan provider context untuk
 * mengganti bahasa runtime; di Phase 1 cukup ekspor objek statis.
 */
import { id } from '@bingo/i18n';

export const t = id;
export { id };
