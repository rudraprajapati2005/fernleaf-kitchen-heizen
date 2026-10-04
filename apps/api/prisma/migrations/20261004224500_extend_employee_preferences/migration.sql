ALTER TABLE "Employee"
  ADD COLUMN "canChooseOwnDeliveryAddress" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canChangeDeliveryTime" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canChangePackaging" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "_EmployeeAllergies" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_EmployeeAllergies_AB_unique" ON "_EmployeeAllergies"("A", "B");
CREATE INDEX "_EmployeeAllergies_B_index" ON "_EmployeeAllergies"("B");

CREATE TABLE "_EmployeeDietaryPreferences" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_EmployeeDietaryPreferences_AB_unique" ON "_EmployeeDietaryPreferences"("A", "B");
CREATE INDEX "_EmployeeDietaryPreferences_B_index" ON "_EmployeeDietaryPreferences"("B");

ALTER TABLE "_EmployeeAllergies"
  ADD CONSTRAINT "_EmployeeAllergies_A_fkey" FOREIGN KEY ("A") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_EmployeeAllergies_B_fkey" FOREIGN KEY ("B") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EmployeeDietaryPreferences"
  ADD CONSTRAINT "_EmployeeDietaryPreferences_A_fkey" FOREIGN KEY ("A") REFERENCES "DietaryTag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_EmployeeDietaryPreferences_B_fkey" FOREIGN KEY ("B") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
