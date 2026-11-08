-- M5b: replaces the unused M0 plan/list tables (never written to) with client-synced records.
/*
  Warnings:

  - The primary key for the `ShoppingList` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `planId` on the `ShoppingList` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ShoppingList` table. All the data in the column will be lost.
  - You are about to drop the `MealPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MealPlanEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShoppingListItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `changedAt` to the `ShoppingList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `items` to the `ShoppingList` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MealPlan" DROP CONSTRAINT "MealPlan_userId_fkey";

-- DropForeignKey
ALTER TABLE "MealPlanEntry" DROP CONSTRAINT "MealPlanEntry_planId_fkey";

-- DropForeignKey
ALTER TABLE "MealPlanEntry" DROP CONSTRAINT "MealPlanEntry_variantId_fkey";

-- DropForeignKey
ALTER TABLE "ShoppingList" DROP CONSTRAINT "ShoppingList_planId_fkey";

-- DropForeignKey
ALTER TABLE "ShoppingListItem" DROP CONSTRAINT "ShoppingListItem_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "ShoppingListItem" DROP CONSTRAINT "ShoppingListItem_listId_fkey";

-- DropIndex
DROP INDEX "ShoppingList_userId_idx";

-- AlterTable
ALTER TABLE "ShoppingList" DROP CONSTRAINT "ShoppingList_pkey",
DROP COLUMN "planId",
DROP COLUMN "updatedAt",
ADD COLUMN     "changedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fromPlanEnd" DATE,
ADD COLUMN     "fromPlanStart" DATE,
ADD COLUMN     "items" JSONB NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT,
ADD CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("userId", "id");

-- DropTable
DROP TABLE "MealPlan";

-- DropTable
DROP TABLE "MealPlanEntry";

-- DropTable
DROP TABLE "ShoppingListItem";

-- DropEnum
DROP TYPE "ShoppingItemSource";

-- CreateTable
CREATE TABLE "PlanEntry" (
    "userId" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" "MealSlot" NOT NULL,
    "mealSlug" TEXT NOT NULL,
    "mealName" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlanEntry_pkey" PRIMARY KEY ("userId","id")
);

-- CreateIndex
CREATE INDEX "PlanEntry_userId_date_idx" ON "PlanEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "PlanEntry" ADD CONSTRAINT "PlanEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
