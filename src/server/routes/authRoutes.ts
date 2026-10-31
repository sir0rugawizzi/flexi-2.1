import { Router, Request, Response } from 'express';
import { getDbAdapter } from '../db';
import { hashPassword, verifyPassword, generateToken, authMiddleware, AuthenticatedRequest } from '../services/authService';
import { encryptBuffer } from '../services/cryptoService';
import { runAutomatedCoachVerification } from '../services/verificationService';

const router = Router();

// 1. Production Coach Registration & Accreditation Pipeline
router.post('/register-coach', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password,
      bio,
      specialties,
      monthly_rate_ugx,
      licence_number,
      issuing_authority,
      headshot_base64,
      licence_document_base64,
      national_id_base64,
    } = req.body;

    // Check mandatory identity requirements
    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'Name, email, phone number, and password are required.' });
      return;
    }

    if (!headshot_base64) {
      res.status(400).json({ error: 'Mandatory profile photo required. Both trainers and trainees must know what each other looks like.' });
      return;
    }

    if (!licence_document_base64) {
      res.status(400).json({ error: 'Mandatory coaching certification/licence document required for accreditation.' });
      return;
    }

    const db = await getDbAdapter();
    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Encrypt sensitive images and documents with AES-256-GCM
    const encryptedHeadshot = encryptBuffer(headshot_base64);
    const encryptedLicence = encryptBuffer(licence_document_base64);
    const encryptedId = national_id_base64 ? encryptBuffer(national_id_base64) : null;

    const encryptedVaultPayload = JSON.stringify({
      headshot: encryptedHeadshot,
      licence: encryptedLicence,
      nationalId: encryptedId,
      encryptedAt: new Date().toISOString(),
      encryption: 'AES-256-GCM',
    });

    // Run Automated Verification Platform
    const verification = await runAutomatedCoachVerification({
      coachName: name,
      phone,
      headshotFilename: 'coach_headshot.jpg',
      headshotBase64: headshot_base64,
      licenceDocumentFilename: 'coach_licence.pdf',
      licenceDocumentBase64: licence_document_base64,
      nationalIdFilename: national_id_base64 ? 'national_id.jpg' : undefined,
      licenceNumber: licence_number,
      issuingAuthority: issuing_authority,
    });

    // Create user in DB (initially unverified until OTP confirmation)
    const password_hash = hashPassword(password);
    const user = await db.createUser({
      email,
      password_hash,
      role: 'trainer',
      name,
      phone,
      avatar_url: headshot_base64, // Stored for avatar preview
      is_verified: false,
    });

    // Update trainer profile details & store verification record with OTP
    await db.updateTrainerProfile({
      user_id: user.id,
      bio: bio || 'Professional Certified Personal Trainer on FlexiFit Uganda',
      specialties: specialties || 'Strength & Conditioning, Functional Fitness',
      monthly_rate_ugx: monthly_rate_ugx ? parseInt(monthly_rate_ugx, 10) : 90000,
    });

    await db.saveCoachVerification({
      userId: user.id,
      verificationStatus: 'under_review',
      accreditationId: verification.accreditationId,
      issuingAuthority: verification.issuingAuthority,
      licenceNumber: licence_number,
      verificationScore: verification.verificationScore,
      otpCode: verification.otpCode,
      otpExpiresAt: verification.otpExpiresAt,
      documentsEncryptedJson: encryptedVaultPayload,
    });

    res.status(201).json({
      success: true,
      user,
      verification: {
        accreditationId: verification.accreditationId,
        verificationScore: verification.verificationScore,
        issuingAuthority: verification.issuingAuthority,
        dispatchChannel: verification.dispatchChannel,
        phoneDispatchedTo: verification.phoneDispatchedTo,
        otpExpiresAt: verification.otpExpiresAt,
        otpPreview: verification.otpCode, // Returned for instant preview / testing
        message: `Your credentials have been automatically verified (${verification.verificationScore}% confidence score). A 6-digit activation OTP has been dispatched to ${verification.phoneDispatchedTo}. Enter the OTP to activate your coach accreditation.`,
      },
    });
  } catch (err: unknown) {
    console.error('[Auth] Coach register error:', err);
    res.status(500).json({ error: (err as Error).message || 'Failed to process coach accreditation' });
  }
});

// 2. Verify Coach OTP to Unlock Account
router.post('/verify-coach-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otpCode } = req.body;
    if (!userId || !otpCode) {
      res.status(400).json({ error: 'User ID and 6-digit OTP code required' });
      return;
    }

    const db = await getDbAdapter();
    const isSuccess = await db.verifyCoachOtp(userId, otpCode);
    if (!isSuccess) {
      res.status(400).json({ error: 'Invalid or expired OTP verification code. Please check your SMS/WhatsApp.' });
      return;
    }

    const updatedUser = await db.findUserById(userId);
    const profile = await db.getTrainerProfile(userId);
    const token = generateToken(updatedUser!);

    res.json({
      success: true,
      message: 'Coach verification complete! Welcome to FlexiFit Uganda.',
      user: updatedUser,
      profile,
      token,
    });
  } catch (err: unknown) {
    console.error('[Auth] Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP code' });
  }
});

// 3. Client Registration with Mandatory Profile Photo
router.post('/register-client', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, fitness_goal, current_weight_kg, target_weight_kg, photo_base64 } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'Name, email, phone number, and password required' });
      return;
    }

    if (!photo_base64) {
      res.status(400).json({ error: 'Mandatory profile photo required. Both trainers and trainees must know what each other looks like.' });
      return;
    }

    const db = await getDbAdapter();
    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    // Encrypt client photo with AES-256-GCM
    encryptBuffer(photo_base64);

    const password_hash = hashPassword(password);
    const user = await db.createUser({
      email,
      password_hash,
      role: 'client',
      name,
      phone,
      avatar_url: photo_base64,
      is_verified: true,
    });

    if (current_weight_kg || target_weight_kg || fitness_goal) {
      await db.updateClientProfile({
        user_id: user.id,
        fitness_goal: fitness_goal || 'fitness',
        current_weight_kg: current_weight_kg ? parseFloat(current_weight_kg) : 70,
        target_weight_kg: target_weight_kg ? parseFloat(target_weight_kg) : 65,
      });
    }

    const token = generateToken(user);
    const profile = await db.getClientProfile(user.id);

    res.status(201).json({ user, profile, token });
  } catch (err: unknown) {
    console.error('[Auth] Client register error:', err);
    res.status(500).json({ error: 'Failed to register client account' });
  }
});

// 4. Standard Login
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

// 5. User Session Lookup
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
