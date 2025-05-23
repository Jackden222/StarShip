-- Create broadcast_templates table
CREATE TABLE broadcast_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create scheduled_broadcasts table
CREATE TABLE scheduled_broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_ids UUID[],
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE broadcast_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_broadcasts ENABLE ROW LEVEL SECURITY;

-- Policies for broadcast_templates
CREATE POLICY "Allow admin to manage broadcast templates"
  ON broadcast_templates
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin');

-- Policies for scheduled_broadcasts
CREATE POLICY "Allow admin to manage scheduled broadcasts"
  ON scheduled_broadcasts
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin'); 