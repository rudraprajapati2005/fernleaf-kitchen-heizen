CREATE TYPE "PackagingType" AS ENUM ('STANDARD', 'INSULATED', 'RECYCLABLE');

ALTER TABLE "Company"
  ADD COLUMN "defaultDeliveryTime" VARCHAR(5),
  ADD COLUMN "kitchenDepartureLeadMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "defaultPackaging" "PackagingType" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "driverInstructions" TEXT,
  ADD COLUMN "defaultDriverId" TEXT,
  ADD COLUMN "defaultDeliveryAddressId" TEXT;

ALTER TABLE "Company"
  ADD CONSTRAINT "Company_defaultDriverId_fkey"
    FOREIGN KEY ("defaultDriverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Company_defaultDeliveryAddressId_fkey"
    FOREIGN KEY ("defaultDeliveryAddressId") REFERENCES "CompanyDeliveryAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
