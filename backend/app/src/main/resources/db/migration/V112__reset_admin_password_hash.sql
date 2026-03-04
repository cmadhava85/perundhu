-- V112: Unconditionally reset perundhu_admin password hash to a verified-correct
-- BCrypt hash for Admin123!@#Change.
--
-- Context: V100 used ON DUPLICATE KEY UPDATE password_hash = password_hash
-- (no-op on existing rows), and V111 only updated when V100s exact hash was
-- present. If the row was created outside Flyway (e.g. manual script), both
-- earlier migrations left the hash untouched and login kept returning 401.
--
-- Hash: $2a$10$R0Q5VXD4CuF.0r.AhpaBw.sqisbri7GOjCKjQohnj6tKUze7FBvMu
-- Verified: bcrypt.checkpw(b'Admin123!@#Change', hash) == True

UPDATE admin_users
SET password_hash = '$2a$10$R0Q5VXD4CuF.0r.AhpaBw.sqisbri7GOjCKjQohnj6tKUze7FBvMu'
WHERE username = 'perundhu_admin';
