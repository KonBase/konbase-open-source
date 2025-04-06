
-- Add missing tables to the database

-- Convention invitations table
CREATE TABLE IF NOT EXISTS public.convention_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL, 
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uses_remaining INTEGER NOT NULL DEFAULT 1,
  UNIQUE(code)
);

-- Enable RLS on convention invitations
ALTER TABLE public.convention_invitations ENABLE ROW LEVEL SECURITY;

-- Convention access table
CREATE TABLE IF NOT EXISTS public.convention_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitation_code TEXT REFERENCES public.convention_invitations(code) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(convention_id, user_id)
);

-- Enable RLS on convention access
ALTER TABLE public.convention_access ENABLE ROW LEVEL SECURITY;

-- Equipment sets table
CREATE TABLE IF NOT EXISTS public.equipment_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on equipment sets
ALTER TABLE public.equipment_sets ENABLE ROW LEVEL SECURITY;

-- Equipment set items table
CREATE TABLE IF NOT EXISTS public.equipment_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID REFERENCES public.equipment_sets(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(set_id, item_id)
);

-- Enable RLS on equipment set items
ALTER TABLE public.equipment_set_items ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for each table
-- Convention Invitations
CREATE POLICY "Users can view convention invitations" ON public.convention_invitations
  FOR SELECT USING (
    created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Admins can create convention invitations" ON public.convention_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
      )
    )
  );

-- Convention Access
CREATE POLICY "Users can view their convention access" ON public.convention_access
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.conventions c
      WHERE c.id = convention_id AND c.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can create their convention access" ON public.convention_access
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Equipment Sets
CREATE POLICY "Users can view equipment sets in their associations" ON public.equipment_sets
  FOR SELECT USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create equipment sets" ON public.equipment_sets
  FOR INSERT WITH CHECK (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

CREATE POLICY "Admins can update equipment sets" ON public.equipment_sets
  FOR UPDATE USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete equipment sets" ON public.equipment_sets
  FOR DELETE USING (
    association_id IN (
      SELECT association_id FROM public.association_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin')
    )
  );

-- Equipment Set Items
CREATE POLICY "Users can view equipment set items" ON public.equipment_set_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can create equipment set items" ON public.equipment_set_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

CREATE POLICY "Admins can update equipment set items" ON public.equipment_set_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

CREATE POLICY "Admins can delete equipment set items" ON public.equipment_set_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.equipment_sets es
      WHERE es.id = set_id AND es.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

-- Documents
CREATE POLICY "Users can view documents in their associations" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.association_id IN (
        SELECT association_id FROM public.association_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'system_admin', 'super_admin', 'manager')
      )
    )
  );

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can mark their notifications as read" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid() AND
    (read IS NOT NULL)
  );

CREATE POLICY "Administrators can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    TRUE
  );
