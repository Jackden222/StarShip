-- Добавляем новые поля в таблицу promo_codes
ALTER TABLE promo_codes
ADD COLUMN max_uses INTEGER,
ADD COLUMN used_count INTEGER DEFAULT 0,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Обновляем существующие записи
UPDATE promo_codes
SET used_count = (
  SELECT COUNT(*)
  FROM used_promo_codes
  WHERE used_promo_codes.promo_id = promo_codes.id
); 