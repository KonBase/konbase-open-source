
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extended User type with additional properties needed by the application
export interface User extends SupabaseUser {
  name?: string;
  profileImage?: string;
  role?: string;
  email?: string;
}
