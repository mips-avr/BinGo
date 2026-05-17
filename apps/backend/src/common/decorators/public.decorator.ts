import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'bingo:isPublic';

/**
 * Menandai handler/controller sebagai publik, sehingga `JwtAuthGuard`
 * akan melewatinya tanpa memerlukan token. Berguna untuk register/login.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
