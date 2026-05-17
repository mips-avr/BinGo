-- Dijalankan otomatis oleh image postgis/postgis pada saat container pertama kali diinisialisasi.
-- Memastikan ekstensi PostGIS aktif di database aplikasi (selain template1) sehingga
-- migrasi Prisma berikutnya dapat langsung membuat kolom geometry(Point, 4326).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
