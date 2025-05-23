import { supabase } from './client';

export interface OutlineServer {
  id: string;
  name: string;
  api_url: string;
  cert_sha256: string;
  created_at: string;
  updated_at: string;
}

export const addOutlineServer = async (name: string, apiUrl: string, certSha256: string) => {
  const { data, error } = await supabase
    .from('outline_servers')
    .insert([
      {
        name,
        api_url: apiUrl,
        cert_sha256: certSha256,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as OutlineServer;
};

export const getOutlineServers = async () => {
  const { data, error } = await supabase
    .from('outline_servers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as OutlineServer[];
}; 