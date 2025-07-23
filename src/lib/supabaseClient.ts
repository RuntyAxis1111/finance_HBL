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
  valor_libro?: number;
  depreciation_y1?: number;
  depreciation_y2?: number;
  depreciation_y3?: number;
  depreciation_y4?: number;
  depreciation_y5?: number;
  years_elapsed?: number;
  depreciation_rate?: number;
}

export interface DepreciacionData {
  serial_number: string;
  year_number: number;
  depreciation_year: number;
  book_value_end_year: number;
}

// Función para obtener datos de depreciación
export const getDepreciacionData = async (): Promise<DepreciacionData[]> => {
  const { data, error } = await supabase
    .from('equipos_depreciacion')
    .select('serial_number, year_number, depreciation_year, book_value_end_year')
    .order('serial_number')
    .order('year_number');
  
  if (error) throw error;
  return data || [];
};

// Función para obtener equipos con datos de depreciación
export const getEquiposWithDepreciation = async (): Promise<Equipo[]> => {
  // Obtener equipos base
  const { data: equipos, error: equiposError } = await supabase
    .from('equipos_ti')
    .select('*')
    .order('serial_number', { ascending: true });
  
  if (equiposError) throw equiposError;
  if (!equipos) return [];

  // Obtener datos de depreciación
  const depreciacionData = await getDepreciacionData();
  
  // Tasas de depreciación por modelo
  const depreciationRates = {
    mac_air: 0.14,
    mac_pro: 0.15,
    lenovo: 0.18
  };

  // Combinar datos
  return equipos.map(equipo => {
    const equipoDepreciation = depreciacionData.filter(d => d.serial_number === equipo.serial_number);
    
    // Calcular años transcurridos
    const yearsElapsed = equipo.purchase_date 
      ? Math.min(5, Math.floor((new Date().getTime() - new Date(equipo.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365)))
      : 0;
    
    // Obtener valor libro actual
    const currentBookValue = equipoDepreciation.find(d => d.year_number === Math.min(5, yearsElapsed));
    
    // Obtener depreciaciones por año
    const depreciation_y1 = equipoDepreciation.find(d => d.year_number === 1)?.depreciation_year || 0;
    const depreciation_y2 = equipoDepreciation.find(d => d.year_number === 2)?.depreciation_year || 0;
    const depreciation_y3 = equipoDepreciation.find(d => d.year_number === 3)?.depreciation_year || 0;
    const depreciation_y4 = equipoDepreciation.find(d => d.year_number === 4)?.depreciation_year || 0;
    const depreciation_y5 = equipoDepreciation.find(d => d.year_number === 5)?.depreciation_year || 0;

    return {
      ...equipo,
      valor_libro: currentBookValue?.book_value_end_year || equipo.purchase_cost || 0,
      depreciation_y1,
      depreciation_y2,
      depreciation_y3,
      depreciation_y4,
      depreciation_y5,
      years_elapsed: yearsElapsed,
      depreciation_rate: depreciationRates[equipo.model]
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