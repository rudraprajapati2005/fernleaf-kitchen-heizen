CREATE TABLE "OptionGroup" (
  "id" TEXT NOT NULL,
  "dishId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL,
  "usesPortions" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OptionGroup_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OptionGroupOption" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  CONSTRAINT "OptionGroupOption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PortionSize" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortionSize_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OptionGroupPortion" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "portionSizeId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "extraCharge" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "OptionGroupPortion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OptionGroupOptionPortion" (
  "optionGroupOptionId" TEXT NOT NULL,
  "optionGroupPortionId" TEXT NOT NULL,
  CONSTRAINT "OptionGroupOptionPortion_pkey" PRIMARY KEY ("optionGroupOptionId","optionGroupPortionId")
);
CREATE UNIQUE INDEX "OptionGroup_dishId_displayOrder_key" ON "OptionGroup"("dishId","displayOrder");
CREATE INDEX "OptionGroup_dishId_displayOrder_idx" ON "OptionGroup"("dishId","displayOrder");
CREATE UNIQUE INDEX "OptionGroupOption_groupId_optionId_key" ON "OptionGroupOption"("groupId","optionId");
CREATE UNIQUE INDEX "OptionGroupOption_groupId_displayOrder_key" ON "OptionGroupOption"("groupId","displayOrder");
CREATE INDEX "OptionGroupOption_optionId_idx" ON "OptionGroupOption"("optionId");
CREATE UNIQUE INDEX "PortionSize_name_key" ON "PortionSize"("name");
CREATE INDEX "PortionSize_isActive_name_idx" ON "PortionSize"("isActive","name");
CREATE UNIQUE INDEX "OptionGroupPortion_groupId_portionSizeId_key" ON "OptionGroupPortion"("groupId","portionSizeId");
CREATE UNIQUE INDEX "OptionGroupPortion_groupId_displayOrder_key" ON "OptionGroupPortion"("groupId","displayOrder");
ALTER TABLE "OptionGroup" ADD CONSTRAINT "OptionGroup_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptionGroupOption" ADD CONSTRAINT "OptionGroupOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptionGroupOption" ADD CONSTRAINT "OptionGroupOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OptionGroupPortion" ADD CONSTRAINT "OptionGroupPortion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptionGroupPortion" ADD CONSTRAINT "OptionGroupPortion_portionSizeId_fkey" FOREIGN KEY ("portionSizeId") REFERENCES "PortionSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OptionGroupOptionPortion" ADD CONSTRAINT "OptionGroupOptionPortion_optionGroupOptionId_fkey" FOREIGN KEY ("optionGroupOptionId") REFERENCES "OptionGroupOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptionGroupOptionPortion" ADD CONSTRAINT "OptionGroupOptionPortion_optionGroupPortionId_fkey" FOREIGN KEY ("optionGroupPortionId") REFERENCES "OptionGroupPortion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
