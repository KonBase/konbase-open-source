
-- This schema represents the database structure for the EventNexus Supply application
-- To be executed in your Supabase project's SQL editor

-- Profiles table (extension of auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  association_id UUID NULL,
  profile_image TEXT NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Associations table
CREATE TABLE public.associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  logo TEXT NULL,
  address TEXT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NULL,
  website TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Association members (many-to-many relationship between users and associations)
CREATE TABLE public.association_members (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  association_id UUID REFERENCES associations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- role within this specific association
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, association_id)
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
  is_room BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  serial_number TEXT NULL,
  barcode TEXT NULL,
  condition TEXT NOT NULL, -- new, good, fair, poor, damaged, retired
  purchase_date DATE NULL,
  purchase_price DECIMAL(10,2) NULL,
  warranty_expiration DATE NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  is_consumable BOOLEAN DEFAULT false,
  quantity INTEGER NULL,
  minimum_quantity INTEGER NULL,
  image TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item Tags (Many-to-many)
CREATE TABLE public.item_tags (
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (item_id, tag)
);

-- Equipment Sets
CREATE TABLE public.equipment_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Set Items (many-to-many)
CREATE TABLE public.equipment_set_items (
  set_id UUID REFERENCES equipment_sets(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (set_id, item_id)
);

-- Conventions
CREATE TABLE public.conventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NULL,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, active, completed, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convention Locations (locations specific to a convention)
CREATE TABLE public.convention_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convention_id UUID NOT NULL REFERENCES conventions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NULL,
  parent_id UUID NULL REFERENCES convention_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Movements
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  from_location_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
  to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  convention_id UUID NULL REFERENCES conventions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- checkout, return, transfer
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirements
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  convention_id UUID NOT NULL REFERENCES conventions(id) ON DELETE CASCADE,
  location_id UUID NULL REFERENCES convention_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested', -- requested, approved, fulfilled, denied
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirement Items (fulfillment details)
CREATE TABLE public.requirement_items (
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (requirement_id, item_id)
);

-- Audit Log
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  changes JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT NULL
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backups
CREATE TABLE public.backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to create profile entry when user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create RLS policies to secure the data
-- Example policy for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Example policy for associations
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view associations they are members of"
  ON public.associations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.association_members
      WHERE user_id = auth.uid() AND association_id = id
    )
  );

-- Add more RLS policies for all tables as needed
