create table outline_servers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  api_url text not null,
  cert_sha256 text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Добавляем RLS политики
alter table outline_servers enable row level security;

create policy "Enable read access for authenticated users" on outline_servers
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on outline_servers
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on outline_servers
  for update using (auth.role() = 'authenticated');

-- Триггер для обновления updated_at
create trigger set_updated_at
  before update on outline_servers
  for each row
  execute function moddatetime (updated_at); 