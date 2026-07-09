-- SQL script to set up authentication for Space Oracle CRM
-- This script creates a users table and adds a test user

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Do not insert default credentials. Create users with hashed passwords only.
-- Example (requires pgcrypto): INSERT INTO users (username, password) VALUES ('your_admin', crypt('replace_with_strong_password', gen_salt('bf', 12)));
-- Ensure unique, high-entropy passwords and rotate any previously exposed credentials.