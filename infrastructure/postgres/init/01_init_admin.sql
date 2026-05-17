-- infrastructure/postgres/init/01_init_admin.sql

-- Create admin account (only runs on first DB initialization)
INSERT INTO users (id, username, password, email, full_name, role, created_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$12$Vu8OzbQO39rZkZiuQdCn.uYS1yr93qW.FRVY1SJr79KbGZgWuZ.Y6',
    'admin@scholarhub.com',
    'System Administrator',
    'ADMIN',
    NOW()
)
ON CONFLICT (username) DO NOTHING;  -- Safe to re-run, won't duplicate