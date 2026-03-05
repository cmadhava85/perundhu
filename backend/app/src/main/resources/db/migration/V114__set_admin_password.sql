-- V114: Set password for perundhu_admin to Perundhu@070185
--
-- All previous migrations (V111-V113) set the hash for 'Admin123!@#Change'.
-- This migration sets the correct hash for the intended password.
--
-- Hash: $2b$10$ryz4DbfRar2fOM7Tyh.8luIVPn.fCUv0E3W1F9JmqjOQj9s5WYh0G
-- Verified: bcrypt.checkpw(b'Perundhu@070185', hash) == True
-- Note: $2b$ prefix is accepted by Spring Security's BCryptPasswordEncoder.
-- Username: perundhu_admin
-- Password: Perundhu@070185

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
    '$2b$10$ryz4DbfRar2fOM7Tyh.8luIVPn.fCUv0E3W1F9JmqjOQj9s5WYh0G',
    'admin@perundhu.com',
    'Perundhu Administrator',
    TRUE,
    'ROLE_ADMIN,ROLE_USER',
    TRUE,
    TRUE,
    TRUE,
    'V114_MIGRATION'
) ON DUPLICATE KEY UPDATE
    password_hash            = '$2b$10$ryz4DbfRar2fOM7Tyh.8luIVPn.fCUv0E3W1F9JmqjOQj9s5WYh0G',
    enabled                  = TRUE,
    account_non_expired      = TRUE,
    account_non_locked       = TRUE,
    credentials_non_expired  = TRUE,
    updated_by               = 'V114_MIGRATION';
