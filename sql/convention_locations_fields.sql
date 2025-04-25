-- Add building, floor, type, capacity, and map coordinates to convention_locations table
ALTER TABLE public.convention_locations
ADD COLUMN type TEXT,
ADD COLUMN building TEXT,
ADD COLUMN floor TEXT,
ADD COLUMN capacity INTEGER,
ADD COLUMN map_x DECIMAL DEFAULT 50,
ADD COLUMN map_y DECIMAL DEFAULT 50;