-- CreateEnum
CREATE TYPE "SourceMatch" AS ENUM ('EXACT', 'CLOSE', 'PROXY');

-- AlterTable
ALTER TABLE "IngredientNutrients" ADD COLUMN     "matchNote" TEXT,
ADD COLUMN     "matchQuality" "SourceMatch" NOT NULL DEFAULT 'EXACT';

-- AlterTable
ALTER TABLE "MealVariant" ADD COLUMN     "recipeReviewed" BOOLEAN NOT NULL DEFAULT false;
