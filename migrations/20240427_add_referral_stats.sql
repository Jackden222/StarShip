-- Добавляем поля для статистики рефералов
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(10,2) DEFAULT 0;

-- Создаем функцию для обновления статистики рефералов
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_end IS NOT NULL AND 
       (OLD.subscription_end IS NULL OR NEW.subscription_end > OLD.subscription_end) THEN
        -- Обновляем статистику реферера
        UPDATE users 
        SET referral_count = referral_count + 1,
            referral_earnings = referral_earnings + 10,
            balance = balance + 10
        WHERE id = NEW.referred_by;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления статистики
DROP TRIGGER IF EXISTS update_referral_stats_trigger ON users;
CREATE TRIGGER update_referral_stats_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_stats(); 