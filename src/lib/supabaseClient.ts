import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqrobbmdvanuozzhjdun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxcm9iYm1kdmFudW96emhqZHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjY0ODgsImV4cCI6MjA2NjQwMjQ4OH0.Pv6RDwe1-1rlxDPdEw-hD_kuxRDQsEwG4MK41QSzTdc';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Equipo {
  serial_number: string;
  model: 'mac_pro' | 'mac_air' | 'lenovo';
  company: 'HBL' | 'AJA';
  assigned_to: string | null;
  insured: boolean;
  purchase_date: string | null;
  purchase_cost: number | null;
  file_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export const uploadPDF = async (file: File, equipoSerial: string) => {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Solo se permiten archivos PDF');
  }
  
  // Validate file size (20MB limit)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('El archivo no puede ser mayor a 20MB');
  }
  
  const fileName = `${equipoSerial}_${Date.now()}.pdf`;
  const filePath = `facturas/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('facturas')
    .upload(filePath, file, { upsert: false });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('facturas')
    .getPublicUrl(filePath);
  
  return { path: data.path, publicUrl };
};

export const getPublicUrl = (filePath: string) => {
  const { data: { publicUrl } } = supabase.storage
    .from('facturas')
    .getPublicUrl(filePath);
  
  return publicUrl;
};