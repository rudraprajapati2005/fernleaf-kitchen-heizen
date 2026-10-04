-- Complete catalogue fields while preserving any existing dishes.
CREATE TYPE "DishTemperature" AS ENUM ('HOT', 'COLD');

ALTER TABLE "Dish"
  ADD COLUMN "image" TEXT,
  ADD COLUMN "minimumOrderQuantity" INTEGER,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "temperature" "DishTemperature";

UPDATE "Dish"
SET "sku" = 'DISH-' || "id",
    "temperature" = 'HOT'
WHERE "sku" IS NULL OR "temperature" IS NULL;

ALTER TABLE "Dish"
  ALTER COLUMN "sku" SET NOT NULL,
  ALTER COLUMN "temperature" SET NOT NULL;

CREATE UNIQUE INDEX "Dish_sku_key" ON "Dish"("sku");
CREATE INDEX "Dish_isActive_name_idx" ON "Dish"("isActive", "name");
CREATE INDEX "Dish_temperature_isActive_idx" ON "Dish"("temperature", "isActive");
CREATE INDEX "Option_isActive_name_idx" ON "Option"("isActive", "name");
