-- Таблица для рефералов
create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references users(id) on delete cascade,
  referred_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Добавить поле referred_by в users
alter table users add column if not exists referred_by uuid references users(id); 