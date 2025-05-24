-- Добавляем поле short_id в таблицу ad_ref_links
ALTER TABLE ad_ref_links ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Создаем индекс для быстрого поиска по short_id
CREATE INDEX IF NOT EXISTS idx_ad_ref_links_short_id ON ad_ref_links(short_id);

-- Обновляем существующие записи, генерируя short_id
UPDATE ad_ref_links 
SET short_id = SUBSTRING(referrer_id, 1, 8)
WHERE short_id IS NULL; 