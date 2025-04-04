
export interface Convention {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  association_id: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ConventionFormData {
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  location?: string;
}
