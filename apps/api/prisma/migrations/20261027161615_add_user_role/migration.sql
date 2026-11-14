-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'BARISTA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER';
