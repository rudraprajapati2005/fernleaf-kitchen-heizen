ALTER TABLE "Company" ADD COLUMN "billingContactName" TEXT,
ADD COLUMN "billingContactEmail" TEXT,
ADD COLUMN "billingContactPhone" TEXT,
ADD COLUMN "ownerEmployeeId" TEXT;

CREATE TABLE "MenuCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuCategoryDish" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "dishId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "MenuCategoryDish_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompanyEmailDomain" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyEmailDomain_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompanyDeliveryAddress" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'US',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyDeliveryAddress_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Order" ADD COLUMN "deliveryAddressId" TEXT,
ADD COLUMN "deliveryAddressSnapshot" JSONB;
CREATE UNIQUE INDEX "MenuCategory_displayOrder_key" ON "MenuCategory"("displayOrder");
CREATE INDEX "MenuCategory_isActive_displayOrder_idx" ON "MenuCategory"("isActive","displayOrder");
CREATE UNIQUE INDEX "MenuCategoryDish_categoryId_dishId_key" ON "MenuCategoryDish"("categoryId","dishId");
CREATE UNIQUE INDEX "MenuCategoryDish_categoryId_displayOrder_key" ON "MenuCategoryDish"("categoryId","displayOrder");
CREATE INDEX "MenuCategoryDish_dishId_idx" ON "MenuCategoryDish"("dishId");
CREATE UNIQUE INDEX "CompanyEmailDomain_domain_key" ON "CompanyEmailDomain"("domain");
CREATE INDEX "CompanyDeliveryAddress_companyId_isActive_idx" ON "CompanyDeliveryAddress"("companyId","isActive");
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MenuCategoryDish" ADD CONSTRAINT "MenuCategoryDish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuCategoryDish" ADD CONSTRAINT "MenuCategoryDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompanyEmailDomain" ADD CONSTRAINT "CompanyEmailDomain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyDeliveryAddress" ADD CONSTRAINT "CompanyDeliveryAddress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "CompanyDeliveryAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
