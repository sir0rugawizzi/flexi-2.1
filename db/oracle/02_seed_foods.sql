-- ============================================================================
-- FlexiFit: Oracle 23c / APEX Deliverable
-- Script: 02_seed_foods.sql
-- Run in APEX SQL Workshop > SQL Scripts
-- ============================================================================

DELETE FROM foods WHERE id LIKE 'food-%';

-- Staples
INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-1', 'Steamed Matooke', 'Amatooke', 'staple', 122.0, 1.3, 29.6, 0.4, 2.3, 200.0, 'plate portion (~200g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-2', 'Boiled Cassava', 'Mawogo / Muhogo', 'staple', 160.0, 1.4, 38.1, 0.3, 1.8, 150.0, 'medium piece (150g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-3', 'Millet Bread (Kalo)', 'Akalo / Oburo', 'staple', 205.0, 4.5, 42.0, 1.2, 3.5, 180.0, 'lump (180g)', 'Uganda Ministry of Agriculture', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-4', 'Posho (Ugali / Maize Meal)', 'Akawunga', 'staple', 145.0, 3.1, 31.0, 0.6, 1.5, 200.0, 'serving (200g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-5', 'Sweet Potatoes (Steamed)', 'Embooko / Lumonde', 'staple', 90.0, 1.6, 20.7, 0.1, 3.0, 150.0, '1 medium potato (150g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-6', 'Irish Potatoes (Boiled)', 'Enkokoote / Obummonde', 'staple', 87.0, 1.9, 20.1, 0.1, 1.8, 150.0, '2 small tubers (150g)', 'USDA / East Africa Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-7', 'White Rice (Cooked)', 'Omucere', 'staple', 130.0, 2.7, 28.2, 0.3, 0.4, 180.0, '1 cup cooked (180g)', 'Standard Reference', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-8', 'Maize Flour Porridge (Uji)', 'Obushera / Ekitirima', 'staple', 65.0, 1.4, 14.0, 0.5, 0.8, 250.0, '1 mug (250ml)', 'Uganda Food Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-9', 'Katogo (Matooke with Beans)', 'Katogo w''ebijanjaalo', 'staple', 135.0, 4.8, 24.5, 1.8, 3.8, 300.0, '1 breakfast bowl (300g)', 'FlexiFit Culinary Standard', 1, 0);

-- Legumes & Proteins
INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-12', 'Stewed Yellow Beans', 'Ebijanjaalo', 'protein', 125.0, 8.2, 21.5, 0.6, 6.4, 150.0, '1 ladle (150g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-13', 'Groundnut Sauce (G-Nut)', 'Ebinyebwa', 'protein', 280.0, 12.5, 10.2, 22.0, 4.2, 120.0, '1 sauce ladle (120g)', 'Uganda Food Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-15', 'Stewed Fresh Peas', 'Kawo / Amakawo', 'protein', 105.0, 6.8, 18.0, 0.5, 5.0, 150.0, '1 ladle (150g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-19', 'Fresh Tilapia (Steamed / Boiled)', 'Ngege', 'protein', 96.0, 20.1, 0.0, 1.7, 0.0, 180.0, '1 medium fillet (180g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-21', 'Nile Perch (Boiled / Stewed)', 'Mputa', 'protein', 120.0, 19.5, 0.0, 4.5, 0.0, 180.0, '1 steak (180g)', 'Uganda Fishery Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-22', 'Silverfish (Mukene Dried & Stewed)', 'Mukene', 'protein', 290.0, 48.0, 2.0, 9.5, 0.0, 60.0, '1 cup stewed (60g)', 'Uganda Fishery Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-23', 'Lean Beef Stew', 'Ennyama y''ente', 'protein', 185.0, 24.0, 1.5, 9.0, 0.3, 150.0, '3-4 chunks (150g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-24', 'Goat Meat Stew', 'Ennyama y''embuzi', 'protein', 190.0, 23.5, 1.2, 10.0, 0.2, 150.0, '3-4 chunks (150g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-25', 'Local Chicken Stew', 'Enkoko y''ekinafu', 'protein', 165.0, 25.0, 0.8, 6.8, 0.1, 160.0, '1 piece (160g)', 'Uganda Food Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-28', 'Boiled Egg', 'Eggi erifumbe', 'protein', 155.0, 12.6, 1.1, 10.6, 0.0, 50.0, '1 egg (50g)', 'Standard Reference', 1, 0);

-- Vegetables
INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-29', 'Dodo (Amaranth Greens Steamed)', 'Ennaku / Dodo', 'vegetable', 35.0, 3.2, 5.5, 0.4, 2.8, 120.0, '1 cup cooked (120g)', 'Uganda Food Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-30', 'Sukuma Wiki (Collard Greens)', 'Sukuma Wiki', 'vegetable', 45.0, 2.8, 6.2, 1.2, 3.2, 120.0, '1 cup cooked (120g)', 'FAO East Africa Food Tables', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-33', 'Fresh Hass Avocado', 'Ova / Paapa', 'fruit', 160.0, 2.0, 8.5, 14.7, 6.7, 100.0, 'half avocado (100g)', 'Standard Reference', 1, 0);

-- Street Foods & Popular Treats
INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-35', 'Rolex (1 Chapati + 2 Eggs + Veggies)', 'Rolex', 'street_food', 245.0, 9.8, 28.5, 10.5, 2.0, 180.0, '1 standard rolex (180g)', 'Uganda Nutritional Survey', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-36', 'Plain Fried Chapati', 'Ekicapati', 'street_food', 310.0, 7.2, 48.0, 10.2, 2.5, 90.0, '1 chapati (90g)', 'Standard Reference', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-37', 'Mandazi', 'Amandazi', 'street_food', 335.0, 6.5, 52.0, 11.5, 1.8, 60.0, '1 piece (60g)', 'Standard Reference', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-40', 'Gonja (Roasted Plantain)', 'Gonja omwoke', 'street_food', 140.0, 1.2, 34.0, 0.2, 2.4, 120.0, '1 finger (120g)', 'Uganda Food Comp', 1, 0);

INSERT INTO foods (id, name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit, source, is_verified, is_custom)
VALUES ('food-42', 'Muchomo (Grilled Beef Skewer)', 'Muchomo', 'street_food', 220.0, 26.5, 0.5, 12.0, 0.0, 100.0, '1 stick (100g)', 'FlexiFit Culinary Standard', 1, 0);

COMMIT;
/
