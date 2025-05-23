-- Обновляем referred_by для пользователя PavelQSS
UPDATE "public"."users" 
SET "referred_by" = 'ee817570-11fd-4c95-8da9-cb53652f6897'
WHERE "telegram_id" = '6990111408';

-- Добавляем запись в таблицу referrals
INSERT INTO "public"."referrals" ("referrer_id", "referred_id")
SELECT 
    'ee817570-11fd-4c95-8da9-cb53652f6897',
    id
FROM "public"."users"
WHERE "telegram_id" = '6990111408'; 