
export interface Convention {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  association_id: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ConventionFormData {
  name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  location: string;
}

export interface ConventionInvitation {
  id: string;
  code: string;
  convention_id: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  uses_remaining: number | null;
}
