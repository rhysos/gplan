-- Add quantity column to plants table
ALTER TABLE plants ADD COLUMN quantity INTEGER DEFAULT 0 NOT NULL;
