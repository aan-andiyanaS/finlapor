-- FinLapor Migration: Multi-Category Transactions
-- This migration adds support for:
-- 1. Category Groups (for organizing categories)
-- 2. Transaction Items (for split amounts per category)

-- =============================================
-- STEP 1: Create Category Groups Table
-- =============================================
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_category_groups_user_id ON category_groups(user_id);

-- =============================================
-- STEP 2: Add group_id to Categories Table
-- =============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL;

-- =============================================
-- STEP 3: Create Transaction Items Table
-- =============================================
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_category_id ON transaction_items(category_id);

-- =============================================
-- STEP 4: Add total_amount column to transactions
-- (to store the sum of all items for quick queries)
-- =============================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2);

-- =============================================
-- STEP 5: Migrate existing transactions to new format
-- Create transaction_items from existing category_id and amount
-- =============================================
INSERT INTO transaction_items (id, transaction_id, category_id, amount, note)
SELECT 
    uuid_generate_v4(),
    t.id,
    t.category_id,
    t.amount,
    NULL
FROM transactions t
WHERE t.category_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM transaction_items ti WHERE ti.transaction_id = t.id
);

-- Update total_amount for existing transactions
UPDATE transactions 
SET total_amount = amount 
WHERE total_amount IS NULL;

-- =============================================
-- STEP 6: Insert Default Category Groups
-- =============================================
INSERT INTO category_groups (id, user_id, name, icon, color, sort_order)
SELECT 
    uuid_generate_v4(),
    NULL,
    name,
    icon,
    color,
    sort_order
FROM (VALUES
    ('Pemasukan', '💰', '#22c55e', 1),
    ('Pengeluaran Harian', '🛒', '#f97316', 2),
    ('Tagihan & Utilitas', '📄', '#ef4444', 3),
    ('Gaya Hidup', '🎮', '#8b5cf6', 4),
    ('Lainnya', '📦', '#6b7280', 5)
) AS default_groups(name, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM category_groups WHERE user_id IS NULL);

-- =============================================
-- STEP 7: Assign existing categories to groups
-- =============================================
-- Update income categories
UPDATE categories c
SET group_id = (SELECT id FROM category_groups WHERE name = 'Pemasukan' AND user_id IS NULL LIMIT 1)
WHERE c.type = 'income' AND c.group_id IS NULL AND c.user_id IS NULL;

-- Update expense categories - daily spending
UPDATE categories c
SET group_id = (SELECT id FROM category_groups WHERE name = 'Pengeluaran Harian' AND user_id IS NULL LIMIT 1)
WHERE c.name IN ('Makanan', 'Transport', 'Belanja') AND c.group_id IS NULL AND c.user_id IS NULL;

-- Update expense categories - bills
UPDATE categories c
SET group_id = (SELECT id FROM category_groups WHERE name = 'Tagihan & Utilitas' AND user_id IS NULL LIMIT 1)
WHERE c.name IN ('Tagihan', 'Kesehatan') AND c.group_id IS NULL AND c.user_id IS NULL;

-- Update expense categories - lifestyle
UPDATE categories c
SET group_id = (SELECT id FROM category_groups WHERE name = 'Gaya Hidup' AND user_id IS NULL LIMIT 1)
WHERE c.name IN ('Hiburan', 'Pendidikan') AND c.group_id IS NULL AND c.user_id IS NULL;

-- Update remaining categories
UPDATE categories c
SET group_id = (SELECT id FROM category_groups WHERE name = 'Lainnya' AND user_id IS NULL LIMIT 1)
WHERE c.group_id IS NULL AND c.user_id IS NULL;
