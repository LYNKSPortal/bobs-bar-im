ALTER TABLE "staff_users" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "staff_users" ADD COLUMN "resetTokenExpiry" TIMESTAMPTZ(3);
CREATE UNIQUE INDEX "staff_users_resetToken_key" ON "staff_users"("resetToken");
