-- Fix demo user password
-- Generated hash for password: demo123
UPDATE users 
SET password_hash = '$2a$10$7AXSUNPulYqfqHHZPUFlIe00dJDFSXo3v1Hs/PlI.zYVTTonApglG' 
WHERE email = 'demo@finlapor.airi.click';

-- Verify
SELECT email, substring(password_hash, 1, 10) as hash_prefix FROM users WHERE email = 'demo@finlapor.airi.click';
