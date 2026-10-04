-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "kitchenStationId" TEXT;

-- CreateTable
CREATE TABLE "Allergen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietaryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AllergenToDish" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AllergenToDish_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AllergenToOption" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AllergenToOption_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DietaryTagToDish" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DietaryTagToDish_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DietaryTagToOption" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DietaryTagToOption_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_key" ON "Allergen"("name");

-- CreateIndex
CREATE INDEX "Allergen_isActive_name_idx" ON "Allergen"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryTag_name_key" ON "DietaryTag"("name");

-- CreateIndex
CREATE INDEX "DietaryTag_isActive_name_idx" ON "DietaryTag"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenStation_name_key" ON "KitchenStation"("name");

-- CreateIndex
CREATE INDEX "KitchenStation_isActive_name_idx" ON "KitchenStation"("isActive", "name");

-- CreateIndex
CREATE INDEX "_AllergenToDish_B_index" ON "_AllergenToDish"("B");

-- CreateIndex
CREATE INDEX "_AllergenToOption_B_index" ON "_AllergenToOption"("B");

-- CreateIndex
CREATE INDEX "_DietaryTagToDish_B_index" ON "_DietaryTagToDish"("B");

-- CreateIndex
CREATE INDEX "_DietaryTagToOption_B_index" ON "_DietaryTagToOption"("B");

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_kitchenStationId_fkey" FOREIGN KEY ("kitchenStationId") REFERENCES "KitchenStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllergenToDish" ADD CONSTRAINT "_AllergenToDish_A_fkey" FOREIGN KEY ("A") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllergenToDish" ADD CONSTRAINT "_AllergenToDish_B_fkey" FOREIGN KEY ("B") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllergenToOption" ADD CONSTRAINT "_AllergenToOption_A_fkey" FOREIGN KEY ("A") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllergenToOption" ADD CONSTRAINT "_AllergenToOption_B_fkey" FOREIGN KEY ("B") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DietaryTagToDish" ADD CONSTRAINT "_DietaryTagToDish_A_fkey" FOREIGN KEY ("A") REFERENCES "DietaryTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DietaryTagToDish" ADD CONSTRAINT "_DietaryTagToDish_B_fkey" FOREIGN KEY ("B") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DietaryTagToOption" ADD CONSTRAINT "_DietaryTagToOption_A_fkey" FOREIGN KEY ("A") REFERENCES "DietaryTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DietaryTagToOption" ADD CONSTRAINT "_DietaryTagToOption_B_fkey" FOREIGN KEY ("B") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
