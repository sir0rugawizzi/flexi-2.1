import { Router, Request, Response } from 'express';
import { getDbAdapter } from '../db';
import { searchOpenFoodFacts } from '../services/openFoodFactsService';
import { authMiddleware, AuthenticatedRequest } from '../services/authService';

const router = Router();

// Search and list foods from local Ugandan database
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;
    const cat = req.query.cat as string | undefined;

    const db = await getDbAdapter();
    const foods = await db.getFoods(q, cat);
    res.json(foods);
  } catch (err: unknown) {
    console.error('[Foods] Get foods error:', err);
    res.status(500).json({ error: 'Failed to retrieve food items' });
  }
});

// Get Kampala local market prices benchmark and markets metadata
router.get('/market-prices', async (req: Request, res: Response): Promise<void> => {
  try {
    const { KAMPALA_MARKETS, KAMPALA_FOOD_PRICES } = await import('../../data/kampalaMarketPrices');
    res.json({
      markets: Object.values(KAMPALA_MARKETS),
      food_prices: KAMPALA_FOOD_PRICES,
      last_updated: 'Current Kampala Market Survey',
    });
  } catch (err: unknown) {
    console.error('[Foods] Market prices error:', err);
    res.status(500).json({ error: 'Failed to retrieve market prices' });
  }
});

// Calculate live budget for meal items
router.post('/calculate-budget', async (req: Request, res: Response): Promise<void> => {
  try {
    const { meals, market_id } = req.body;
    const { calculatePlanCost } = await import('../../utils/marketPriceCalc');
    const summary = calculatePlanCost(meals || [], market_id || 'nakawa');
    res.json(summary);
  } catch (err: unknown) {
    console.error('[Foods] Calculate budget error:', err);
    res.status(500).json({ error: 'Failed to calculate meal budget' });
  }
});

// Get food details by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const food = await db.getFoodById(req.params.id);
    if (!food) {
      res.status(404).json({ error: 'Food item not found' });
      return;
    }
    res.json(food);
  } catch (err: unknown) {
    console.error('[Foods] Get food error:', err);
    res.status(500).json({ error: 'Failed to retrieve food item' });
  }
});

// Add custom food (Trainer or Client)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, local_name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, typical_serving_g, serving_unit } = req.body;

    if (!name || !calories_100g || !protein_100g || !carbs_100g || !fat_100g || !typical_serving_g) {
      res.status(400).json({ error: 'Name, macro values per 100g, and typical serving required' });
      return;
    }

    const db = await getDbAdapter();
    const food = await db.createFood({
      name,
      local_name,
      category: category || 'staple',
      calories_100g: Number(calories_100g),
      protein_100g: Number(protein_100g),
      carbs_100g: Number(carbs_100g),
      fat_100g: Number(fat_100g),
      fiber_100g: Number(fiber_100g) || 0,
      typical_serving_g: Number(typical_serving_g),
      serving_unit: serving_unit || 'portion (g)',
      source: `Added by ${req.user!.name}`,
      is_verified: false,
      is_custom: true,
    });

    res.status(201).json(food);
  } catch (err: unknown) {
    console.error('[Foods] Create food error:', err);
    res.status(500).json({ error: 'Failed to create food item' });
  }
});

// Search free Open Food Facts API for grocery items
router.get('/external/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.json([]);
      return;
    }
    const results = await searchOpenFoodFacts(q);
    res.json(results);
  } catch (err: unknown) {
    console.error('[Foods] OpenFoodFacts error:', err);
    res.status(500).json({ error: 'Failed to search external food catalog' });
  }
});

export default router;
