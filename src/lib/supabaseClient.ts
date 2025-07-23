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
  // Campos calculados de depreciación
  book_value_today?: number;
  rate?: number;
  depreciation_y1?: number;
  depreciation_y2?: number;
  depreciation_y3?: number;
  depreciation_y4?: number;
  depreciation_y5?: number;
  years_elapsed?: number;
  years_exact?: number;
}

export interface DepreciacionData {
  serial_number: string;
  year_number: number;
  depreciation_year: number;
  book_value_end_year: number;
}

// Función para obtener equipos con datos de depreciación en tiempo real
export const getEquiposWithDepreciation = async (): Promise<Equipo[]> => {
  // Obtener equipos con depreciación en tiempo real
  const { data: equiposLive, error: liveError } = await supabase
    .from('equipos_depreciacion_live')
    .select('*')
    .order('serial_number', { ascending: true });
  
  if (liveError) throw liveError;
  if (!equiposLive) return [];

  // Obtener datos adicionales de equipos_ti que no están en la vista live
  const { data: equiposBase, error: baseError } = await supabase
    .from('equipos_ti')
    .select('serial_number, company, assigned_to, insured, file_url, created_at, updated_at')
    .order('serial_number', { ascending: true });
  
  if (baseError) throw baseError;

  // Obtener datos de depreciación por años (para columnas Año 1-5)
  const { data: depreciacionData, error: depError } = await supabase
    .from('equipos_depreciacion_v2')
    .select('serial_number, year_number, depreciation_year')
    .order('serial_number')
    .order('year_number');
  
  if (depError) throw depError;

  // Combinar todos los datos
  return equiposLive.map(equipoLive => {
    const equipoBase = equiposBase?.find(e => e.serial_number === equipoLive.serial_number);
    const equipoDepreciation = (depreciacionData || []).filter(d => d.serial_number === equipoLive.serial_number);
    
    // Calcular años transcurridos (enteros para referencia)
    const yearsElapsed = equipoLive.purchase_date 
      ? Math.min(5, Math.floor((new Date().getTime() - new Date(equipoLive.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365)))
      : 0;
    
    // Obtener depreciaciones por año
    const depreciation_y1 = equipoDepreciation.find(d => d.year_number === 1)?.depreciation_year || 0;
    const depreciation_y2 = equipoDepreciation.find(d => d.year_number === 2)?.depreciation_year || 0;
    const depreciation_y3 = equipoDepreciation.find(d => d.year_number === 3)?.depreciation_year || 0;
    const depreciation_y4 = equipoDepreciation.find(d => d.year_number === 4)?.depreciation_year || 0;
    const depreciation_y5 = equipoDepreciation.find(d => d.year_number === 5)?.depreciation_year || 0;
    

    return {
      // Datos base del equipo
      serial_number: equipoLive.serial_number,
      model: equipoLive.model,
      purchase_date: equipoLive.purchase_date,
      purchase_cost: equipoLive.purchase_cost,
      company: equipoBase?.company || 'AJA',
      assigned_to: equipoBase?.assigned_to || null,
      insured: equipoBase?.insured || false,
      file_url: equipoBase?.file_url || null,
      created_at: equipoBase?.created_at,
      updated_at: equipoBase?.updated_at,
      
      // Datos de depreciación en tiempo real
      rate: equipoLive.rate,
      book_value_today: equipoLive.book_value_today,
      years_exact: equipoLive.years_exact,
      
      // Depreciaciones por año (fijas)
      depreciation_y1,
      depreciation_y2,
      depreciation_y3,
      depreciation_y4,
      depreciation_y5,
      years_elapsed: yearsElapsed
    };
  });
};

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