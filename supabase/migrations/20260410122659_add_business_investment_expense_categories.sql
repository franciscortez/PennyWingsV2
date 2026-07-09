-- Add Business and Investment as expense categories
INSERT INTO categories (user_id, name, type, icon, color, is_default)
VALUES 
  (NULL, 'Business', 'expense', 'briefcase', '#F43F5E', true),
  (NULL, 'Investment', 'expense', 'trending-down', '#E11D48', true)
ON CONFLICT DO NOTHING;;
