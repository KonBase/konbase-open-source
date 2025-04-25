-- Add map coordinates to convention_locations table
ALTER TABLE convention_locations
ADD COLUMN map_x DECIMAL DEFAULT NULL,
ADD COLUMN map_y DECIMAL DEFAULT NULL;