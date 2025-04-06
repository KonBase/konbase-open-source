
import type { Database } from '@/integrations/supabase/types';
export type { Database };

// Re-export the Json type to maintain backward compatibility
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
