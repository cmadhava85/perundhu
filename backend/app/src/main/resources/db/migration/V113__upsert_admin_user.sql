-- V113: UPSERT perundhu_admin with verified-correct BCrypt hash
--
-- Why V112 (UPDATE only) was insufficient:
--   UPDATE returns 0 affected rows and silently no-ops when the row doesn't
--   exist in admin_users. If run_v100_migration.py or check_and_fix_admin.py
--   left the table empty, V112 never wrote anything and login kept failing.
--
-- This migration handles both cases:
--   • Row doesn't exist → INSERT creates it with enabled=TRUE and correct hash
--   • Row exists       → UPDATE forces correct hash + all account flags = TRUE
--
-- Hash: $2a$10$R0Q5VXD4CuF.0r.AhpaBw.sqisbri7GOjCKjQohnj6tKUze7FBvMu
-- Verified: bcrypt.checkpw(b'Admin123!@#Change', hash) == True
-- Username: perundhu_admin
-- Password: Admin123!@#Change

INSERT INTO admin_users (
    username,
    password_hash,
    email,
    full_name,
    enabled,
    roles,
    account_non_expired,
    account_non_locked,
    credentials_non_expired,
    created_by
) VALUES (
    'perundhu_admin',
    '$2a$10$R0Q5VXD4CuF.0r.AhpaBw.sqisbri7GOjCKjQohnj6tKUze7FBvMu',
    'admin@perundhu.com',
    'Perundhu Administrator',
    TRUE,
    'ROLE_ADMIN,ROLE_USER',
    TRUE,
    TRUE,
    TRUE,
    'V113_MIGRATION'
) ON DUPLICATE KEY UPDATE
    password_hash            = '$2a$10$R0Q5VXD4CuF.0r.AhpaBw.sqisbri7GOjCKjQohnj6tKUze7FBvMu',
    enabled                  = TRUE,
    account_non_expired      = TRUE,
    account_non_locked       = TRUE,
    credentials_non_expired  = TRUE,
    updated_by               = 'V113_MIGRATION';
