import {
  User,
  TrainerProfile,
  ClientProfile,
  Food,
  Exercise,
  WorkoutPlan,
  MealPlan,
  PlanAssignment,
  WorkoutLog,
  MealLog,
  WeightLog,
  CheckIn,
  Message,
  CallRequest,
  Subscription,
  PoseSession,
  FormCheck,
  ClientOverview,
} from '../../types';

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface IDataAdapter {
  init(): Promise<void>;

  // User & Auth
  findUserByEmail(email: string): Promise<UserWithPassword | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(userData: {
    email: string;
    password_hash: string;
    role: 'trainer' | 'client' | 'admin';
    name: string;
    phone: string;
    avatar_url?: string;
    is_verified?: boolean;
  }): Promise<User>;
  updateUser(userId: string, data: Partial<User>): Promise<void>;
  saveCoachVerification(data: {
    userId: string;
    verificationStatus: string;
    accreditationId: string;
    issuingAuthority: string;
    licenceNumber?: string;
    verificationScore: number;
    otpCode: string;
    otpExpiresAt: string;
    documentsEncryptedJson: string;
  }): Promise<void>;
  verifyCoachOtp(userId: string, otpCode: string): Promise<boolean>;

  // Profiles
  getTrainerProfile(userId: string): Promise<TrainerProfile | null>;
  updateTrainerProfile(profile: Partial<TrainerProfile> & { user_id: string }): Promise<void>;
  getClientProfile(userId: string): Promise<ClientProfile | null>;
  updateClientProfile(profile: Partial<ClientProfile> & { user_id: string }): Promise<void>;

  // Client Management & Triage
  getClientsForTrainer(trainerId: string): Promise<ClientOverview[]>;
  getClientOverview(clientId: string): Promise<ClientOverview | null>;

  // Foods
  getFoods(search?: string, category?: string): Promise<Food[]>;
  getFoodById(id: string): Promise<Food | null>;
  createFood(food: Omit<Food, 'id'>): Promise<Food>;

  // Exercises
  getExercises(muscle?: string, equipment?: string): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | null>;

  // Workout Plans
  getWorkoutPlans(trainerId: string): Promise<WorkoutPlan[]>;
  getWorkoutPlanById(id: string): Promise<WorkoutPlan | null>;
  createWorkoutPlan(plan: {
    trainer_id: string;
    title: string;
    description: string;
    goal_tag: string;
    days_per_week: number;
    schedule_json: string;
  }): Promise<WorkoutPlan>;

  // Meal Plans
  getMealPlans(trainerId: string): Promise<MealPlan[]>;
  getMealPlanById(id: string): Promise<MealPlan | null>;
  createMealPlan(plan: {
    trainer_id: string;
    title: string;
    description: string;
    days_json: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
  }): Promise<MealPlan>;

  // Plan Assignment
  assignPlans(assignment: {
    client_id: string;
    workout_plan_id?: string;
    meal_plan_id?: string;
    assigned_by: string;
  }): Promise<PlanAssignment>;
  getActiveAssignments(clientId: string): Promise<PlanAssignment | null>;

  // Daily Logging
  logWorkout(log: {
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
    logged_at?: string;
  }): Promise<WorkoutLog>;
  getWorkoutLogs(clientId: string, limit?: number): Promise<WorkoutLog[]>;

  logMeal(log: {
    client_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_id?: string;
    food_name: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    logged_at?: string;
  }): Promise<MealLog>;
  getMealLogs(clientId: string, dateStr?: string): Promise<MealLog[]>;

  logWeight(log: {
    client_id: string;
    weight_kg: number;
    notes?: string;
    logged_at?: string;
  }): Promise<WeightLog>;
  getWeightLogs(clientId: string, limit?: number): Promise<WeightLog[]>;

  // Weekly Check-in
  submitCheckIn(checkIn: {
    client_id: string;
    week_start_date: string;
    energy_score: number;
    sleep_hours: number;
    diet_adherence_score: number;
    workout_adherence_score: number;
    notes?: string;
  }): Promise<CheckIn>;
  getCheckIns(clientId: string): Promise<CheckIn[]>;
  updateCheckInFeedback(checkInId: string, feedback: string): Promise<void>;

  // Messaging & Calls
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  sendMessage(msg: {
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_url?: string;
  }): Promise<Message>;

  createCallRequest(req: {
    client_id: string;
    trainer_id: string;
    preferred_slot: string;
    topic: string;
    channel: 'meet' | 'zoom' | 'whatsapp';
  }): Promise<CallRequest>;
  getCallRequests(trainerId: string): Promise<CallRequest[]>;

  // Subscriptions (MTN / Airtel Mobile Money)
  createSubscription(sub: {
    client_id: string;
    plan_type: 'monthly' | 'quarterly';
    network: 'MTN' | 'AIRTEL';
    phone_number: string;
    amount_ugx: number;
    reference_id: string;
  }): Promise<Subscription>;
  getSubscription(clientId: string): Promise<Subscription | null>;

  // Pose & Vision Telemetry
  savePoseSession(session: {
    client_id: string;
    exercise: 'squat' | 'push_up' | 'plank';
    reps_completed: number;
    duration_seconds: number;
    avg_form_score: number;
    rep_durations_json?: string;
    angles_log_json?: string;
  }): Promise<PoseSession>;
  getPoseSessions(clientId: string): Promise<PoseSession[]>;

  // Form Checks (Gemini AI Vision Analysis)
  saveFormCheck(formCheck: {
    client_id: string;
    exercise: string;
    video_path: string;
    thumbnail_path?: string;
    ai_score: number;
    ai_good_json: string;
    ai_fixes_json: string;
    ai_safety_note: string;
    ai_cue: string;
  }): Promise<FormCheck>;
  getFormChecks(clientId: string): Promise<FormCheck[]>;
  getAllFormChecksForTrainer(trainerId: string): Promise<FormCheck[]>;
  updateFormCheckComment(id: string, comment: string): Promise<void>;
}
