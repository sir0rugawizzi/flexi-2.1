export type UserRole = 'trainer' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar_url?: string;
  is_verified?: boolean;
  created_at: string;
}

export interface TrainerProfile {
  user_id: string;
  bio?: string;
  specialties?: string;
  meet_link?: string;
  zoom_link?: string;
  whatsapp_number?: string;
  preferred_channel: 'meet' | 'zoom' | 'whatsapp';
  monthly_rate_ugx: number;
  in_person_rate_ugx: number;
  verification_status?: 'pending' | 'under_review' | 'verified' | 'rejected';
  accreditation_id?: string;
  issuing_authority?: string;
  licence_number?: string;
  verification_score?: number;
  verified_at?: string;
  documents_encrypted?: boolean;
}

export interface ClientProfile {
  user_id: string;
  trainer_id?: string;
  gender?: string;
  dob?: string;
  height_cm?: number;
  target_weight_kg?: number;
  current_weight_kg?: number;
  activity_level?: string;
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'fitness' | 'rehab';
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  streak_days: number;
}

export interface Food {
  id: string;
  name: string;
  local_name?: string;
  category: 'staple' | 'protein' | 'vegetable' | 'fruit' | 'street_food' | 'dairy' | 'fat_oil' | 'snack';
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number;
  typical_serving_g: number;
  serving_unit: string;
  source: string;
  is_verified: boolean;
  is_custom?: boolean;
}

export type KampalaMarketId = 'kalerwe' | 'owino' | 'nakawa' | 'wandegeya' | 'nakasero';

export interface KampalaMarketInfo {
  id: KampalaMarketId;
  name: string;
  tagline: string;
  location: string;
  priceMultiplier: number;
  bestFor: string[];
  description: string;
}

export interface FoodMarketPrice {
  food_name: string;
  category: 'staple' | 'protein' | 'vegetable' | 'fruit' | 'street_food' | 'dairy' | 'fat_oil' | 'snack';
  retail_unit: string;
  base_price_ugx: number;
  market_prices_ugx?: Partial<Record<KampalaMarketId, number>>;
  cost_per_100g_ugx: number;
  bulk_discount_hint?: string;
  protein_per_100g: number;
  cost_per_gram_protein_ugx: number;
}

export interface MealItemCost {
  food_id: string;
  food_name: string;
  serving_grams: number;
  cost_ugx: number;
  unit_price_per_100g: number;
  cost_per_gram_protein: number;
}

export interface BudgetSwapSuggestion {
  current_food: string;
  suggested_food: string;
  daily_savings_ugx: number;
  weekly_savings_ugx: number;
  protein_comparison: string;
  reason: string;
}

export interface PlanCostSummary {
  market_id: KampalaMarketId;
  market_name: string;
  daily_cost_ugx: number;
  weekly_cost_ugx: number;
  monthly_cost_ugx: number;
  cost_per_gram_protein: number;
  budget_tier: 'ultra_budget' | 'budget_friendly' | 'moderate' | 'premium';
  budget_tier_label: string;
  breakdown_by_meal: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', number>;
  breakdown_by_category: Record<string, number>;
  smart_swaps: BudgetSwapSuggestion[];
}

export interface Exercise {
  id: string;
  name: string;
  target_muscle: string;
  secondary_muscles?: string;
  equipment: 'none' | 'dumbbell' | 'band' | 'chair' | 'mat';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  video_url?: string;
  is_bodyweight: boolean;
}

export interface WorkoutPlanDayItem {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
}

export interface WorkoutPlanDay {
  day_number: number;
  day_name: string;
  exercises: WorkoutPlanDayItem[];
}

export interface WorkoutPlan {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  goal_tag: string;
  days_per_week: number;
  schedule_json: string | WorkoutPlanDay[];
  created_at: string;
}

export interface MealPlanDayItem {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_id: string;
  food_name: string;
  serving_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanDay {
  day_number: number;
  day_name: string;
  meals: MealPlanDayItem[];
}

export interface MealPlan {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  days_json: string | MealPlanDay[];
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  created_at: string;
}

export interface PlanAssignment {
  id: string;
  client_id: string;
  workout_plan_id?: string;
  meal_plan_id?: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  plan_id?: string;
  exercise_id?: string;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_kg: number;
  duration_minutes: number;
  rpe_score?: number;
  notes?: string;
  logged_at: string;
}

export interface MealLog {
  id: string;
  client_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_id?: string;
  food_name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export interface WeightLog {
  id: string;
  client_id: string;
  weight_kg: number;
  notes?: string;
  logged_at: string;
}

export interface CheckIn {
  id: string;
  client_id: string;
  week_start_date: string;
  energy_score: number;
  sleep_hours: number;
  diet_adherence_score: number;
  workout_adherence_score: number;
  notes?: string;
  trainer_feedback?: string;
  status: 'submitted' | 'reviewed';
  submitted_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface CallRequest {
  id: string;
  client_id: string;
  trainer_id: string;
  preferred_slot: string;
  topic: string;
  channel: 'meet' | 'zoom' | 'whatsapp';
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  meeting_url?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  client_id: string;
  plan_type: 'monthly' | 'quarterly';
  network: 'MTN' | 'AIRTEL';
  phone_number: string;
  amount_ugx: number;
  status: 'active' | 'expired' | 'cancelled';
  reference_id: string;
  starts_at: string;
  expires_at: string;
}

export interface PoseSession {
  id: string;
  client_id: string;
  exercise: 'squat' | 'push_up' | 'plank';
  reps_completed: number;
  duration_seconds: number;
  avg_form_score: number;
  rep_durations_json?: string;
  angles_log_json?: string;
  created_at: string;
}

export interface FormCheckAIResult {
  overall_score: number;
  what_looks_good: string[];
  fix_these: string[];
  safety_note: string;
  suggested_cue: string;
}

export type FormCheckAnalysis = FormCheckAIResult;

export interface FormCheck {
  id: string;
  client_id: string;
  exercise: string;
  video_path: string;
  thumbnail_path?: string;
  ai_score: number;
  ai_good_json: string;
  ai_fixes_json: string;
  ai_safety_note: string;
  ai_cue: string;
  trainer_comment?: string;
  trainer_commented_at?: string;
  created_at: string;
}

export interface ClientFlags {
  missed_workouts: boolean;
  nutrition_deficit: boolean;
  stale_weight: boolean;
  overdue_checkin: boolean;
}

export interface ClientOverview {
  user: User;
  profile: ClientProfile;
  is_flagged: boolean;
  flags: ClientFlags;
  flag_reasons: string[];
  last_workout_date?: string;
  last_weight_date?: string;
  last_checkin_date?: string;
  macro_adherence_7d: number;
  active_workout_plan?: WorkoutPlan;
  active_meal_plan?: MealPlan;
}
