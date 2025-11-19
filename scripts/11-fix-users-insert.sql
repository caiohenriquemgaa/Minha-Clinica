-- Fix users table insert with proper name column value
-- This script resolves the NOT NULL constraint violation on the 'name' column

-- First, let's check if the user already exists and delete if needed
DELETE FROM public.users WHERE email = 'jmmestetica.saude@gmail.com';

-- Insert the master user with both 'name' and 'full_name' columns properly filled
INSERT INTO public.users (
    id, 
    email, 
    password_hash, 
    name, 
    full_name, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'jmmestetica.saude@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash for 'jmestetica2025'
    'Admin JM', -- This fills the required 'name' column
    'JM Estética e Saúde - Administrador', -- This fills the 'full_name' column
    'admin',
    true,
    NOW(),
    NOW()
);

-- Verify the user was created successfully
SELECT id, email, name, full_name, role, is_active 
FROM public.users 
WHERE email = 'jmmestetica.saude@gmail.com';
