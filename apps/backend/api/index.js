/*
 * Entry point yang dilihat Vercel.
 *
 * Sengaja JavaScript biasa dan sengaja setipis ini. Berkas di `api/` dikompilasi
 * oleh runtime Vercel sendiri, bukan oleh `tsc` milik proyek — dan kompilator
 * itu tidak memancarkan metadata dekorator yang dibutuhkan dependency injection
 * NestJS. Menaruh kode Nest di sini membuat DI gagal saat runtime dengan pesan
 * yang menyesatkan tentang parameter yang tidak dapat di-resolve.
 *
 * Jalan keluarnya: seluruh kode Nest dikompilasi lebih dulu oleh `tsc` (dengan
 * emitDecoratorMetadata) lewat buildCommand, dan berkas ini hanya memuat
 * hasilnya dari `dist/`.
 */
const { default: handler } = require('../dist/serverless');

module.exports = handler;
