INSERT INTO system_users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
) VALUES (
    'mteresa@solucioning.net',
    '$2b$10$YedtCeLRQS/OTawDkmiHBepd6mucMpN2PgfVkDdMO0abuBCKsSUcO',
    'superadmin',
    'Miquel',
    'Teresa',
    true,
    NOW(),
    NOW()
); 