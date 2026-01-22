-- FinLapor Seed Data
-- Sample data for development and testing

-- Insert sample user (password: password123)
INSERT INTO users (id, email, password_hash, name, mode) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'demo@finlapor.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo User', 'personal');

-- Insert sample transactions
INSERT INTO transactions (id, user_id, category_id, type, amount, description, date) VALUES
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
        (SELECT id FROM categories WHERE name = 'Gaji' AND is_default = TRUE LIMIT 1),
        'income', 8000000, 'Gaji Januari 2026', '2026-01-01'),
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        (SELECT id FROM categories WHERE name = 'Makan & Minum' AND is_default = TRUE LIMIT 1),
        'expense', 250000, 'Makan seminggu', '2026-01-05'),
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        (SELECT id FROM categories WHERE name = 'Transportasi' AND is_default = TRUE LIMIT 1),
        'expense', 150000, 'Grab & Gojek', '2026-01-07'),
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        (SELECT id FROM categories WHERE name = 'Tagihan' AND is_default = TRUE LIMIT 1),
        'expense', 500000, 'Listrik & Internet', '2026-01-10'),
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        (SELECT id FROM categories WHERE name = 'Belanja' AND is_default = TRUE LIMIT 1),
        'expense', 350000, 'Belanja bulanan', '2026-01-12'),
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        (SELECT id FROM categories WHERE name = 'Hiburan' AND is_default = TRUE LIMIT 1),
        'expense', 100000, 'Nonton bioskop', '2026-01-15'),
    (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        (SELECT id FROM categories WHERE name = 'Makan & Minum' AND is_default = TRUE LIMIT 1),
        'expense', 300000, 'Makan siang kantor', '2026-01-18');
