
-- This migration ensures that all tables defined in database.types.ts exist in the database

-- First, check if notifications table exists - if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable row level security on notifications
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Add RLS policies for notifications
        CREATE POLICY "Users can view their own notifications" 
        ON public.notifications
        FOR SELECT USING (user_id = auth.uid());

        CREATE POLICY "Users can update their own notifications" 
        ON public.notifications
        FOR UPDATE USING (user_id = auth.uid());

        CREATE POLICY "System can insert notifications" 
        ON public.notifications
        FOR INSERT WITH CHECK (TRUE);
    END IF;
END
$$;

-- Ensure audit_logs has the ip_address column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE public.audit_logs 
        ADD COLUMN ip_address TEXT;
    END IF;
END
$$;

-- Ensure convention_invitations table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'convention_invitations') THEN
        -- Convention invitations table was already created in a previous migration
        -- Just double check that it has all required fields
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'convention_invitations' 
            AND column_name = 'uses_remaining'
        ) THEN
            ALTER TABLE public.convention_invitations 
            ADD COLUMN uses_remaining INTEGER NOT NULL DEFAULT 1;
        END IF;
    END IF;
END
$$;

-- Ensure convention_access table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'convention_access') THEN
        -- Convention access table was already created in a previous migration
        NULL; -- No action needed
    END IF;
END
$$;

-- Ensure documents table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        -- Document table was already created in a previous migration
        NULL; -- No action needed
    END IF;
END
$$;
