-- Add quantity column to plants table
ALTER TABLE plants ADD COLUMN quantity INTEGER DEFAULT 0 NOT NULL;

-- Add user_id column to plants table
ALTER TABLE plants ADD COLUMN user_id INTEGER REFERENCES users(id);
