import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDbAdapter } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../services/authService';
import { analyzeFormWithGemini } from '../services/geminiService';

const router = Router();
router.use(authMiddleware);

// Setup multer storage in ./uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const unique = `video-${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB max for short clips
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video uploads are allowed'));
    }
  },
});

// 1. Save Live Pose Session (MediaPipe on-device tracking summary)
router.post('/pose-session', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { exercise, reps_completed, duration_seconds, avg_form_score, rep_durations_json, angles_log_json } = req.body;

    const db = await getDbAdapter();
    const session = await db.savePoseSession({
      client_id: clientId,
      exercise: exercise || 'squat',
      reps_completed: Number(reps_completed) || 0,
      duration_seconds: Number(duration_seconds) || 0,
      avg_form_score: Number(avg_form_score) || 85,
      rep_durations_json: typeof rep_durations_json === 'string' ? rep_durations_json : JSON.stringify(rep_durations_json),
      angles_log_json: typeof angles_log_json === 'string' ? angles_log_json : JSON.stringify(angles_log_json),
    });

    // Also auto-log as a workout log entry so daily counts reflect it!
    await db.logWorkout({
      client_id: clientId,
      exercise_name: `Live Pose Session: ${exercise === 'squat' ? 'Bodyweight Squats' : exercise === 'push_up' ? 'Push-Ups' : 'Plank Hold'}`,
      sets_completed: 1,
      reps_completed: Number(reps_completed) || 0,
      weight_kg: 0,
      duration_minutes: Math.max(1, Math.round((Number(duration_seconds) || 60) / 60)),
      notes: `Live camera form score: ${avg_form_score}/100`,
    });

    res.status(201).json(session);
  } catch (err: unknown) {
    console.error('[Vision] Save pose session error:', err);
    res.status(500).json({ error: 'Failed to record pose session' });
  }
});

router.get('/pose-sessions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const sessions = await db.getPoseSessions(req.user!.userId);
    res.json(sessions);
  } catch (err: unknown) {
    console.error('[Vision] Get pose sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch pose sessions' });
  }
});

// 2. Video Form-Check Frame Analysis via Gemini 3.8 Flash
router.post('/form-check/analyze', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { exercise, frames, notes } = req.body;

    if (!exercise || !frames || !Array.isArray(frames) || frames.length === 0) {
      res.status(400).json({ error: 'Exercise name and 4-6 video frame snapshots required' });
      return;
    }

    const aiResult = await analyzeFormWithGemini(exercise, frames, notes);
    res.json(aiResult);
  } catch (err: unknown) {
    console.error('[Vision] Gemini analysis error:', err);
    res.status(500).json({ error: 'Form check analysis failed' });
  }
});

// 3. Upload video file and extract metadata
router.post('/form-check/upload-video', upload.single('video'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Video file missing' });
      return;
    }

    const relativePath = `/uploads/${req.file.filename}`;
    res.json({
      videoPath: relativePath,
      filename: req.file.filename,
      sizeBytes: req.file.size,
    });
  } catch (err: unknown) {
    console.error('[Vision] Video upload error:', err);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// 4. Save completed form check with AI evaluation
router.post('/form-check/submit', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user!.userId;
    const { exercise, video_path, thumbnail_path, ai_score, ai_good, ai_fixes, ai_safety_note, ai_cue } = req.body;

    if (!exercise || !video_path || !ai_score) {
      res.status(400).json({ error: 'Exercise, video path, and evaluation required' });
      return;
    }

    const db = await getDbAdapter();
    const formCheck = await db.saveFormCheck({
      client_id: clientId,
      exercise,
      video_path,
      thumbnail_path,
      ai_score: Number(ai_score),
      ai_good_json: typeof ai_good === 'string' ? ai_good : JSON.stringify(ai_good || []),
      ai_fixes_json: typeof ai_fixes === 'string' ? ai_fixes : JSON.stringify(ai_fixes || []),
      ai_safety_note: ai_safety_note || 'Maintain active muscle tension.',
      ai_cue: ai_cue || 'Keep spine neutral.',
    });

    res.status(201).json(formCheck);
  } catch (err: unknown) {
    console.error('[Vision] Save form check error:', err);
    res.status(500).json({ error: 'Failed to save form check submission' });
  }
});

// 5. Get list of form checks for client or trainer
router.get('/form-check/list', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const userRole = req.user!.role;
    if (userRole === 'trainer') {
      const all = await db.getAllFormChecksForTrainer(req.user!.userId);
      res.json(all);
    } else {
      const own = await db.getFormChecks(req.user!.userId);
      res.json(own);
    }
  } catch (err: unknown) {
    console.error('[Vision] List form checks error:', err);
    res.status(500).json({ error: 'Failed to fetch form checks' });
  }
});

// 6. Trainer comments on form check
router.put('/form-check/:id/comment', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { comment } = req.body;
    if (!comment) {
      res.status(400).json({ error: 'Comment required' });
      return;
    }

    const db = await getDbAdapter();
    await db.updateFormCheckComment(req.params.id, comment);
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('[Vision] Comment form check error:', err);
    res.status(500).json({ error: 'Failed to update trainer comment' });
  }
});

export default router;
