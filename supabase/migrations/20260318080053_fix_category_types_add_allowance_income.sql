
-- Fix: Allowance is currently under 'expense' but should be an income category
-- Update its type to 'income' and give it an appropriate income color/icon
UPDATE categories
SET type = 'income', icon = 'hand-coins', color = '#FBBF24'
WHERE name = 'Allowance' AND type = 'expense' AND is_default = true;

-- Fix: Salary is duplicated — one under expense (wrong), one under income (correct)
-- Remove the incorrectly typed Salary under expense
DELETE FROM categories
WHERE name = 'Salary' AND type = 'expense' AND is_default = true;
;
