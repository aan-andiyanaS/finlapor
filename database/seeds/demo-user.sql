-- Demo User Seed Data
-- Email: demo@finlapor.airi.click
-- Password: demo123

-- Insert demo user
INSERT INTO users (id, email, password_hash, name, mode, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@finlapor.airi.click',
    '$2a$10$8K1p/a0dL3jfexw8F6QTh.zJiJZKeVlAR4J7J9Z9qNvM0KqvbvB9G', -- bcrypt hash of "demo123"
    'Demo User',
    'personal',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert demo transactions
INSERT INTO transactions (id, user_id, category_id, type, amount, description, date, created_at)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE name = 'Gaji' LIMIT 1),
    'income',
    8000000,
    'Gaji Januari',
    CURRENT_DATE - INTERVAL '1 day',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM transactions WHERE user_id = '00000000-0000-0000-0000-000000000001'
);

INSERT INTO transactions (id, user_id, category_id, type, amount, description, date, created_at)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Makanan' LIMIT 1), 'expense', 85000, 'Makan siang', CURRENT_DATE, NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Transport' LIMIT 1), 'expense', 50000, 'Grab ke kantor', CURRENT_DATE, NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Belanja' LIMIT 1), 'expense', 250000, 'Belanja bulanan', CURRENT_DATE - INTERVAL '2 days', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Tagihan' LIMIT 1), 'expense', 500000, 'Listrik & Internet', CURRENT_DATE - INTERVAL '3 days', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Makanan' LIMIT 1), 'expense', 120000, 'Makan malam', CURRENT_DATE - INTERVAL '1 day', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Transport' LIMIT 1), 'expense', 75000, 'Bensin motor', CURRENT_DATE - INTERVAL '2 days', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Hiburan' LIMIT 1), 'expense', 150000, 'Nonton bioskop', CURRENT_DATE - INTERVAL '4 days', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Makanan' LIMIT 1), 'expense', 200000, 'Makan keluarga', CURRENT_DATE - INTERVAL '5 days', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Belanja' LIMIT 1), 'expense', 100000, 'Belanja groceries', CURRENT_DATE - INTERVAL '6 days', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE name = 'Kesehatan' LIMIT 1), 'expense', 150000, 'Beli obat', CURRENT_DATE - INTERVAL '7 days', NOW())
ON CONFLICT DO NOTHING;
