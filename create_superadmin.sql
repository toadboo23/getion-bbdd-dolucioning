INSERT INTO users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
) VALUES (
    'dsanchez@gabinetsallent.com',
    '$2b$10$ByZOOtOxhavLHz6S09RpaOUkerQSMp1sTV3X5Kot2Q/3dx6gMxnfm',
    'superadmin',
    'Dori',
    'Sanchez',
    true,
    NOW(),
    NOW()
); 