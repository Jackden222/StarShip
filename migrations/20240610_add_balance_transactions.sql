-- Создаем таблицу для транзакций
CREATE TABLE balance_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    amount INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Добавляем индекс для быстрого поиска по user_id
CREATE INDEX idx_balance_transactions_user_id ON balance_transactions(user_id);

-- Добавляем поле balance в таблицу users
ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0; 