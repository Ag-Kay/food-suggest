-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('LOSE_WEIGHT', 'GAIN_WEIGHT', 'BUILD_MUSCLE', 'MAINTAIN_WEIGHT', 'EAT_HEALTHIER');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('OMNIVORE', 'VEGETARIAN', 'VEGAN', 'PESCATARIAN');

-- CreateEnum
CREATE TYPE "Allergen" AS ENUM ('PEANUT', 'TREE_NUT', 'MILK', 'EGG', 'FISH', 'CRUSTACEAN', 'MOLLUSC', 'SOY', 'WHEAT_GLUTEN', 'SESAME', 'MUSTARD', 'CELERY', 'SULPHITES', 'LUPIN');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "CookingSkill" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "BudgetLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "NutritionMethod" AS ENUM ('CALCULATED_FROM_INGREDIENTS', 'LAB_ANALYSIS', 'EXTERNAL_SOURCE');

-- CreateEnum
CREATE TYPE "NutritionReliability" AS ENUM ('ESTIMATED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DietCompatibility" AS ENUM ('VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'OMNIVORE_ONLY');

-- CreateEnum
CREATE TYPE "IngredientPreference" AS ENUM ('LIKE', 'DISLIKE', 'AVOID');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShoppingItemSource" AS ENUM ('GENERATED', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletionRequestedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" UUID NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "heightCm" DECIMAL(5,1),
    "weightKg" DECIMAL(5,1),
    "sex" "Sex",
    "activityLevel" "ActivityLevel",
    "goal" "Goal",
    "dietType" "DietType",
    "mealsPerDay" INTEGER,
    "preferredSlots" "MealSlot"[],
    "maxCookMinutes" INTEGER,
    "cookingSkill" "CookingSkill",
    "budget" "BudgetLevel",
    "showCalories" BOOLEAN NOT NULL DEFAULT false,
    "countryCode" CHAR(2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserAllergen" (
    "userId" UUID NOT NULL,
    "allergen" "Allergen" NOT NULL,

    CONSTRAINT "UserAllergen_pkey" PRIMARY KEY ("userId","allergen")
);

-- CreateTable
CREATE TABLE "UserIngredientPref" (
    "userId" UUID NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "preference" "IngredientPreference" NOT NULL,

    CONSTRAINT "UserIngredientPref_pkey" PRIMARY KEY ("userId","ingredientId")
);

-- CreateTable
CREATE TABLE "UserCuisinePref" (
    "userId" UUID NOT NULL,
    "cuisineId" TEXT NOT NULL,

    CONSTRAINT "UserCuisinePref_pkey" PRIMARY KEY ("userId","cuisineId")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuisine" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" CHAR(2),

    CONSTRAINT "Cuisine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionSource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "license" TEXT NOT NULL,
    "citation" TEXT,
    "commercialUseCleared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NutritionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "shoppingCategory" TEXT NOT NULL,
    "dietCompatibility" "DietCompatibility" NOT NULL,
    "gramsPerUnit" DECIMAL(8,2),
    "gramsPerMl" DECIMAL(6,3),
    "allergensReviewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientAllergen" (
    "ingredientId" TEXT NOT NULL,
    "allergen" "Allergen" NOT NULL,

    CONSTRAINT "IngredientAllergen_pkey" PRIMARY KEY ("ingredientId","allergen")
);

-- CreateTable
CREATE TABLE "IngredientNutrients" (
    "ingredientId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceRef" TEXT,
    "basis" TEXT NOT NULL DEFAULT 'raw, edible portion',
    "energyKcal" DECIMAL(7,2) NOT NULL,
    "proteinG" DECIMAL(7,2) NOT NULL,
    "carbsG" DECIMAL(7,2) NOT NULL,
    "fatG" DECIMAL(7,2) NOT NULL,
    "fibreG" DECIMAL(7,2),
    "sugarsG" DECIMAL(7,2),
    "saturatedFatG" DECIMAL(7,2),
    "sodiumMg" DECIMAL(8,2),
    "ironMg" DECIMAL(7,2),
    "calciumMg" DECIMAL(8,2),
    "reliability" "NutritionReliability" NOT NULL DEFAULT 'ESTIMATED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientNutrients_pkey" PRIMARY KEY ("ingredientId")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localNames" TEXT[],
    "description" TEXT NOT NULL,
    "cuisineId" TEXT NOT NULL,
    "slots" "MealSlot"[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "imageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealCategory" (
    "mealId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "MealCategory_pkey" PRIMARY KEY ("mealId","categoryId")
);

-- CreateTable
CREATE TABLE "MealVariant" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "servings" INTEGER NOT NULL,
    "prepMinutes" INTEGER NOT NULL,
    "cookMinutes" INTEGER NOT NULL,
    "difficulty" "CookingSkill" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MealVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantIngredient" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "grams" DECIMAL(8,2),
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "VariantIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantStep" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "VariantStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantNutrition" (
    "variantId" TEXT NOT NULL,
    "rawGramsPerServing" DECIMAL(7,1) NOT NULL,
    "cookedGramsPerServing" DECIMAL(7,1),
    "energyKcal" DECIMAL(7,1) NOT NULL,
    "proteinG" DECIMAL(6,1) NOT NULL,
    "carbsG" DECIMAL(6,1) NOT NULL,
    "fatG" DECIMAL(6,1) NOT NULL,
    "fibreG" DECIMAL(6,1),
    "sugarsG" DECIMAL(6,1),
    "saturatedFatG" DECIMAL(6,1),
    "sodiumMg" DECIMAL(7,1),
    "method" "NutritionMethod" NOT NULL,
    "reliability" "NutritionReliability" NOT NULL DEFAULT 'ESTIMATED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariantNutrition_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "credit" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "sourceUrl" TEXT,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" UUID NOT NULL,
    "mealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","mealId")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" "MealSlot" NOT NULL,
    "variantId" TEXT NOT NULL,
    "servings" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "planId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2),
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "source" "ShoppingItemSource" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Consent_userId_type_idx" ON "Consent"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Cuisine_slug_key" ON "Cuisine"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionSource_slug_key" ON "NutritionSource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_slug_key" ON "Meal"("slug");

-- CreateIndex
CREATE INDEX "Meal_status_cuisineId_idx" ON "Meal"("status", "cuisineId");

-- CreateIndex
CREATE INDEX "MealVariant_mealId_idx" ON "MealVariant"("mealId");

-- CreateIndex
CREATE INDEX "VariantIngredient_variantId_idx" ON "VariantIngredient"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantStep_variantId_position_key" ON "VariantStep"("variantId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Image_storageKey_key" ON "Image"("storageKey");

-- CreateIndex
CREATE INDEX "MealPlan_userId_startDate_idx" ON "MealPlan"("userId", "startDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_planId_date_idx" ON "MealPlanEntry"("planId", "date");

-- CreateIndex
CREATE INDEX "ShoppingList_userId_idx" ON "ShoppingList"("userId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_listId_idx" ON "ShoppingListItem"("listId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAllergen" ADD CONSTRAINT "UserAllergen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIngredientPref" ADD CONSTRAINT "UserIngredientPref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIngredientPref" ADD CONSTRAINT "UserIngredientPref_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCuisinePref" ADD CONSTRAINT "UserCuisinePref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCuisinePref" ADD CONSTRAINT "UserCuisinePref_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientAllergen" ADD CONSTRAINT "IngredientAllergen_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientNutrients" ADD CONSTRAINT "IngredientNutrients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientNutrients" ADD CONSTRAINT "IngredientNutrients_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NutritionSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCategory" ADD CONSTRAINT "MealCategory_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCategory" ADD CONSTRAINT "MealCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealVariant" ADD CONSTRAINT "MealVariant_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantIngredient" ADD CONSTRAINT "VariantIngredient_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MealVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantIngredient" ADD CONSTRAINT "VariantIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantStep" ADD CONSTRAINT "VariantStep_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MealVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantNutrition" ADD CONSTRAINT "VariantNutrition_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MealVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MealVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
