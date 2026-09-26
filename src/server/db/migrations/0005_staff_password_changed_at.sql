-- When each staff member last chose their own password (see the column's
-- comment in schema/people.ts). Every existing account is left null: they
-- were all created by the seed script with a password somebody else chose
-- (by default one written in this public repository), so each person is
-- asked to choose their own the next time they sign in.
ALTER TABLE "staff_users" ADD COLUMN "password_changed_at" timestamp with time zone;
