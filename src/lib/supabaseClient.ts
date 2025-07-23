import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqrobbmdvanuozzhjdun.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxcm9iYm1kdmFudW96emhqZHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgyNjQ4OCwiZXhwIjoyMDY2NDAyNDg4fQ.1zNAVJPKi_l2xI5I3Xb5qEWO4CL1NTSTUAEyv9du6L4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Equipo {
  serial_number: string;
  model: 'mac_pro' | 'mac_air' | 'lenovo';
  company: 'HBL' | 'AJA';
  assigned_to: string | null;
  insured: boolean;
  purchase_date: string | null;
  purchase_cost: number | null;
  depr_rate: number | null;
  created_at: string;
  updated_at: string;
  file_url: string | null;
}