/*
  Warnings:

  - You are about to drop the column `host` on the `Listing` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `hostId` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HOST', 'GUEST');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "host",
ADD COLUMN     "hostId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'GUEST';

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "guestId" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
