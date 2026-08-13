INSERT INTO "material_category_metadata"
  ("code", "public_name", "description", "preparation", "icon", "display_order", "active", "updated_at")
VALUES
  ('ORGANIC', 'Organik', 'Sisa makanan, daun, dan bahan organik yang dapat diolah.', 'Pisahkan dari kemasan dan cairan berlebih.', 'leaf', 1, true, CURRENT_TIMESTAMP),
  ('PAPER', 'Kertas dan Kardus', 'Kertas dan kardus yang bersih serta kering.', 'Lipat kardus dan jaga agar tetap kering.', 'file-text', 2, true, CURRENT_TIMESTAMP),
  ('PET', 'Plastik PET', 'Botol dan kemasan plastik berkode PET.', 'Kosongkan, bilas, dan pisahkan tutup bila diminta.', 'droplet', 3, true, CURRENT_TIMESTAMP),
  ('HDPE', 'Plastik HDPE', 'Kemasan plastik kaku berkode HDPE.', 'Kosongkan isi dan bersihkan sisa produk.', 'box', 4, true, CURRENT_TIMESTAMP),
  ('METAL', 'Logam', 'Kaleng dan logam yang aman untuk ditangani.', 'Kosongkan isi dan hindari bagian tajam terbuka.', 'tool', 5, true, CURRENT_TIMESTAMP),
  ('GLASS', 'Kaca', 'Botol atau wadah kaca yang diterima fasilitas.', 'Kemas pecahan secara aman dan beri penanda.', 'hexagon', 6, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "waste_reports"
SET "photo_key" = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80'
WHERE "photo_key" IS NULL OR "photo_key" LIKE 'demo/reports/%';

ALTER TABLE "waste_reports" ALTER COLUMN "photo_key" SET NOT NULL;
