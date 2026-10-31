import { IDataAdapter, UserWithPassword } from './adapter';
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

/**
 * Oracle APEX / ORDS REST Adapter
 * Interacts with Oracle REST Data Services (ORDS) modules deployed on apex.oracle.com
 */
export class OracleAdapter implements IDataAdapter {
  private baseUrl: string;

  constructor(ordsBaseUrl: string) {
    this.baseUrl = ordsBaseUrl.replace(/\/+$/, '');
  }

  public async init(): Promise<void> {
    // Ping ORDS health/metadata endpoint
    try {
      const res = await fetch(`${this.baseUrl}/metadata-catalog/`, { method: 'GET' });
      if (!res.ok) {
        console.warn(`[OracleAdapter] ORDS responded with status ${res.status}. Falling back or retrying.`);
      } else {
        console.log(`[OracleAdapter] Connected successfully to Oracle ORDS at ${this.baseUrl}`);
      }
    } catch (err) {
      console.warn(`[OracleAdapter] Connection to ORDS failed:`, err);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ORDS request failed (${res.status} ${res.statusText}): ${errorText}`);
    }
    return res.json() as Promise<T>;
  }

  public async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    try {
      const data = await this.request<{ items: UserWithPassword[] }>(`/users/by-email?email=${encodeURIComponent(email)}`);
      return data.items?.[0] || null;
    } catch {
      return null;
    }
  }

  public async findUserById(id: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  public async createUser(userData: {
    email: string;
    password_hash: string;
    role: 'trainer' | 'client' | 'admin';
    name: string;
    phone: string;
    avatar_url?: string;
  }): Promise<User> {
    return this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async getTrainerProfile(userId: string): Promise<TrainerProfile | null> {
    try {
      return await this.request<TrainerProfile>(`/trainer-profiles/${encodeURIComponent(userId)}`);
    } catch {
      return null;
    }
  }

  public async updateTrainerProfile(profile: Partial<TrainerProfile> & { user_id: string }): Promise<void> {
    await this.request(`/trainer-profiles/${encodeURIComponent(profile.user_id)}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  public async getClientProfile(userId: string): Promise<ClientProfile | null> {
    try {
      return await this.request<ClientProfile>(`/client-profiles/${encodeURIComponent(userId)}`);
    } catch {
      return null;
    }
  }

  public async updateClientProfile(profile: Partial<ClientProfile> & { user_id: string }): Promise<void> {
    await this.request(`/client-profiles/${encodeURIComponent(profile.user_id)}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  public async getClientsForTrainer(trainerId: string): Promise<ClientOverview[]> {
    const data = await this.request<{ items: ClientOverview[] }>(`/trainer/${encodeURIComponent(trainerId)}/clients`);
    return data.items || [];
  }

  public async getClientOverview(clientId: string): Promise<ClientOverview | null> {
    try {
      return await this.request<ClientOverview>(`/clients/${encodeURIComponent(clientId)}/overview`);
    } catch {
      return null;
    }
  }

  public async getFoods(search?: string, category?: string): Promise<Food[]> {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (category) params.append('cat', category);
    const data = await this.request<{ items: Food[] }>(`/foods/?${params.toString()}`);
    return data.items || [];
  }

  public async getFoodById(id: string): Promise<Food | null> {
    try {
      return await this.request<Food>(`/foods/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  public async createFood(food: Omit<Food, 'id'>): Promise<Food> {
    return this.request<Food>('/foods/', {
      method: 'POST',
      body: JSON.stringify(food),
    });
  }

  public async getExercises(muscle?: string, equipment?: string): Promise<Exercise[]> {
    const params = new URLSearchParams();
    if (muscle) params.append('muscle', muscle);
    if (equipment) params.append('eq', equipment);
    const data = await this.request<{ items: Exercise[] }>(`/exercises/?${params.toString()}`);
    return data.items || [];
  }

  public async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      return await this.request<Exercise>(`/exercises/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  public async getWorkoutPlans(trainerId: string): Promise<WorkoutPlan[]> {
    const data = await this.request<{ items: WorkoutPlan[] }>(`/workout-plans/?trainer_id=${encodeURIComponent(trainerId)}`);
    return data.items || [];
  }

  public async getWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
    try {
      return await this.request<WorkoutPlan>(`/workout-plans/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  public async createWorkoutPlan(plan: {
    trainer_id: string;
    title: string;
    description: string;
    goal_tag: string;
    days_per_week: number;
    schedule_json: string;
  }): Promise<WorkoutPlan> {
    return this.request<WorkoutPlan>('/workout-plans/', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  public async getMealPlans(trainerId: string): Promise<MealPlan[]> {
    const data = await this.request<{ items: MealPlan[] }>(`/meal-plans/?trainer_id=${encodeURIComponent(trainerId)}`);
    return data.items || [];
  }

  public async getMealPlanById(id: string): Promise<MealPlan | null> {
    try {
      return await this.request<MealPlan>(`/meal-plans/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  public async createMealPlan(plan: {
    trainer_id: string;
    title: string;
    description: string;
    days_json: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
  }): Promise<MealPlan> {
    return this.request<MealPlan>('/meal-plans/', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  public async assignPlans(assignment: {
    client_id: string;
    workout_plan_id?: string;
    meal_plan_id?: string;
    assigned_by: string;
  }): Promise<PlanAssignment> {
    return this.request<PlanAssignment>('/plan-assignments/', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  public async getActiveAssignments(clientId: string): Promise<PlanAssignment | null> {
    try {
      const data = await this.request<{ items: PlanAssignment[] }>(`/plan-assignments/active?client_id=${encodeURIComponent(clientId)}`);
      return data.items?.[0] || null;
    } catch {
      return null;
    }
  }

  public async logWorkout(log: {
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
  }): Promise<WorkoutLog> {
    return this.request<WorkoutLog>('/workout-logs/', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  public async getWorkoutLogs(clientId: string, limit = 50): Promise<WorkoutLog[]> {
    const data = await this.request<{ items: WorkoutLog[] }>(`/workout-logs/?client_id=${encodeURIComponent(clientId)}&limit=${limit}`);
    return data.items || [];
  }

  public async logMeal(log: {
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
  }): Promise<MealLog> {
    return this.request<MealLog>('/meal-logs/', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  public async getMealLogs(clientId: string, dateStr?: string): Promise<MealLog[]> {
    const params = new URLSearchParams({ client_id: clientId });
    if (dateStr) params.append('date', dateStr);
    const data = await this.request<{ items: MealLog[] }>(`/meal-logs/?${params.toString()}`);
    return data.items || [];
  }

  public async logWeight(log: {
    client_id: string;
    weight_kg: number;
    notes?: string;
    logged_at?: string;
  }): Promise<WeightLog> {
    return this.request<WeightLog>('/weight-logs/', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  public async getWeightLogs(clientId: string, limit = 30): Promise<WeightLog[]> {
    const data = await this.request<{ items: WeightLog[] }>(`/weight-logs/?client_id=${encodeURIComponent(clientId)}&limit=${limit}`);
    return data.items || [];
  }

  public async submitCheckIn(checkIn: {
    client_id: string;
    week_start_date: string;
    energy_score: number;
    sleep_hours: number;
    diet_adherence_score: number;
    workout_adherence_score: number;
    notes?: string;
  }): Promise<CheckIn> {
    return this.request<CheckIn>('/check-ins/', {
      method: 'POST',
      body: JSON.stringify(checkIn),
    });
  }

  public async getCheckIns(clientId: string): Promise<CheckIn[]> {
    const data = await this.request<{ items: CheckIn[] }>(`/check-ins/?client_id=${encodeURIComponent(clientId)}`);
    return data.items || [];
  }

  public async updateCheckInFeedback(checkInId: string, feedback: string): Promise<void> {
    await this.request(`/check-ins/${encodeURIComponent(checkInId)}/feedback`, {
      method: 'PUT',
      body: JSON.stringify({ trainer_feedback: feedback }),
    });
  }

  public async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const data = await this.request<{ items: Message[] }>(`/messages/?u1=${encodeURIComponent(userId1)}&u2=${encodeURIComponent(userId2)}`);
    return data.items || [];
  }

  public async sendMessage(msg: {
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_url?: string;
  }): Promise<Message> {
    return this.request<Message>('/messages/', {
      method: 'POST',
      body: JSON.stringify(msg),
    });
  }

  public async createCallRequest(req: {
    client_id: string;
    trainer_id: string;
    preferred_slot: string;
    topic: string;
    channel: 'meet' | 'zoom' | 'whatsapp';
  }): Promise<CallRequest> {
    return this.request<CallRequest>('/call-requests/', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  public async getCallRequests(trainerId: string): Promise<CallRequest[]> {
    const data = await this.request<{ items: CallRequest[] }>(`/call-requests/?trainer_id=${encodeURIComponent(trainerId)}`);
    return data.items || [];
  }

  public async createSubscription(sub: {
    client_id: string;
    plan_type: 'monthly' | 'quarterly';
    network: 'MTN' | 'AIRTEL';
    phone_number: string;
    amount_ugx: number;
    reference_id: string;
  }): Promise<Subscription> {
    return this.request<Subscription>('/subscriptions/', {
      method: 'POST',
      body: JSON.stringify(sub),
    });
  }

  public async getSubscription(clientId: string): Promise<Subscription | null> {
    try {
      const data = await this.request<{ items: Subscription[] }>(`/subscriptions/active?client_id=${encodeURIComponent(clientId)}`);
      return data.items?.[0] || null;
    } catch {
      return null;
    }
  }

  public async savePoseSession(session: {
    client_id: string;
    exercise: 'squat' | 'push_up' | 'plank';
    reps_completed: number;
    duration_seconds: number;
    avg_form_score: number;
    rep_durations_json?: string;
    angles_log_json?: string;
  }): Promise<PoseSession> {
    return this.request<PoseSession>('/pose-sessions/', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  public async getPoseSessions(clientId: string): Promise<PoseSession[]> {
    const data = await this.request<{ items: PoseSession[] }>(`/pose-sessions/?client_id=${encodeURIComponent(clientId)}`);
    return data.items || [];
  }

  public async saveFormCheck(formCheck: {
    client_id: string;
    exercise: string;
    video_path: string;
    thumbnail_path?: string;
    ai_score: number;
    ai_good_json: string;
    ai_fixes_json: string;
    ai_safety_note: string;
    ai_cue: string;
  }): Promise<FormCheck> {
    return this.request<FormCheck>('/form-checks/', {
      method: 'POST',
      body: JSON.stringify(formCheck),
    });
  }

  public async getFormChecks(clientId: string): Promise<FormCheck[]> {
    const data = await this.request<{ items: FormCheck[] }>(`/form-checks/?client_id=${encodeURIComponent(clientId)}`);
    return data.items || [];
  }

  public async getAllFormChecksForTrainer(trainerId: string): Promise<FormCheck[]> {
    const data = await this.request<{ items: FormCheck[] }>(`/form-checks/for-trainer?trainer_id=${encodeURIComponent(trainerId)}`);
    return data.items || [];
  }

  public async updateFormCheckComment(id: string, comment: string): Promise<void> {
    await this.request(`/form-checks/${encodeURIComponent(id)}/comment`, {
      method: 'PUT',
      body: JSON.stringify({ trainer_comment: comment }),
    });
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await this.request(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async saveCoachVerification(data: {
    userId: string;
    verificationStatus: string;
    accreditationId: string;
    issuingAuthority: string;
    licenceNumber?: string;
    verificationScore: number;
    otpCode: string;
    otpExpiresAt: string;
    documentsEncryptedJson: string;
  }): Promise<void> {
    await this.request(`/trainers/${encodeURIComponent(data.userId)}/verification`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async verifyCoachOtp(userId: string, otpCode: string): Promise<boolean> {
    try {
      const res = await this.request<{ verified: boolean }>(`/trainers/${encodeURIComponent(userId)}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otpCode }),
      });
      return res.verified;
    } catch {
      return false;
    }
  }
}
