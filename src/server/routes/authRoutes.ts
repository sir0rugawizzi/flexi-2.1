import { Router, Request, Response } from 'express';
import { getDbAdapter } from '../db';
import { hashPassword, verifyPassword, generateToken, authMiddleware, AuthenticatedRequest } from '../services/authService';

const router = Router();

// Register new trainer or client
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, name, phone } = req.body;
    if (!email || !password || !role || !name || !phone) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const db = await getDbAdapter();
    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = hashPassword(password);
    const user = await db.createUser({
      email,
      password_hash,
      role: role as 'trainer' | 'client',
      name,
      phone,
    });

    const token = generateToken(user);
    const profile = user.role === 'trainer' ? await db.getTrainerProfile(user.id) : await db.getClientProfile(user.id);

    res.status(201).json({ user, profile, token });
  } catch (err: unknown) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// Standard Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const db = await getDbAdapter();
    const userWithPw = await db.findUserByEmail(email);
    if (!userWithPw) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = verifyPassword(password, userWithPw.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { password_hash, ...user } = userWithPw;
    const token = generateToken(user);
    const profile = user.role === 'trainer' ? await db.getTrainerProfile(user.id) : await db.getClientProfile(user.id);

    res.json({ user, profile, token });
  } catch (err: unknown) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Demo Login (Instant sign in as Coach Brian or any client)
router.post('/demo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, email } = req.body;
    const db = await getDbAdapter();

    let targetEmail = email;
    if (!targetEmail) {
      if (role === 'trainer') {
        targetEmail = 'brian@flexifit.ug';
      } else {
        targetEmail = 'sarah@flexifit.ug'; // Default demo client
      }
    }

    const userWithPw = await db.findUserByEmail(targetEmail);
    if (!userWithPw) {
      res.status(404).json({ error: `Demo account for ${targetEmail} not found` });
      return;
    }

    const { password_hash, ...user } = userWithPw;
    const token = generateToken(user);
    const profile = user.role === 'trainer' ? await db.getTrainerProfile(user.id) : await db.getClientProfile(user.id);

    res.json({ user, profile, token });
  } catch (err: unknown) {
    console.error('[Auth] Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Current User Session
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbAdapter();
    const user = await db.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const profile = user.role === 'trainer' ? await db.getTrainerProfile(user.id) : await db.getClientProfile(user.id);
    res.json({ user, profile });
  } catch (err: unknown) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user session' });
  }
});

export default router;
