-- Ensure admin account exists and set password to bcrypt hash of '12345678'
-- Hash generated with bcryptjs saltRounds=10
-- $2b$10$4wHqjDmcOu8woP3LAjI6TecJSmTqZs26UcWP.9B.LeIgWhImlGUJa

INSERT INTO "public"."User" ("id", "email", "password", "fullName", "role", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@trellix.dev',
  '$2b$10$4wHqjDmcOu8woP3LAjI6TecJSmTqZs26UcWP.9B.LeIgWhImlGUJa',
  'Admin',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "role" = 'ADMIN',
  "updatedAt" = CURRENT_TIMESTAMP;


