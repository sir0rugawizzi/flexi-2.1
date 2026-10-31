import React, { useState, useRef } from 'react';
import { User } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  Camera,
  Upload,
  Lock,
  Mail,
  Phone,
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Dumbbell,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthPortalProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthSuccess }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'coach_register' | 'client_register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Coach accreditation multi-step state
  const [coachStep, setCoachStep] = useState<1 | 2 | 3 | 4>(1); // 1: Info, 2: Photos & Docs, 3: Verifying, 4: OTP
  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [coachPhone, setCoachPhone] = useState('+256 ');
  const [coachPassword, setCoachPassword] = useState('');
  const [coachBio, setCoachBio] = useState('');
  const [coachSpecialties, setCoachSpecialties] = useState('Strength & Conditioning, Functional Movement');
  const [coachRateUgx, setCoachRateUgx] = useState('90000');
  const [coachIssuingAuthority, setCoachIssuingAuthority] = useState('Uganda Olympic Committee & National Fitness Accreditation Board');
  const [coachLicenceNumber, setCoachLicenceNumber] = useState('UOC-FT-');

  // Photo & Doc uploads (Base64)
  const [headshotBase64, setHeadshotBase64] = useState<string | null>(null);
  const [licenceBase64, setLicenceBase64] = useState<string | null>(null);
  const [nationalIdBase64, setNationalIdBase64] = useState<string | null>(null);

  // Verification results & OTP state
  const [verificationData, setVerificationData] = useState<any>(null);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [createdCoachUserId, setCreatedCoachUserId] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Client registration state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('+256 ');
  const [clientPassword, setClientPassword] = useState('');
  const [clientGoal, setClientGoal] = useState<'weight_loss' | 'muscle_gain' | 'fitness' | 'rehab'>('fitness');
  const [clientWeight, setClientWeight] = useState('72');
  const [clientTargetWeight, setClientTargetWeight] = useState('68');
  const [clientPhotoBase64, setClientPhotoBase64] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Helper file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (b64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick fill helper for verified production accounts
  const handleQuickFill = (role: 'trainer' | 'client') => {
    if (role === 'trainer') {
      setLoginEmail('brian@flexifit.ug');
      setLoginPassword('password123');
    } else {
      setLoginEmail('sarah@flexifit.ug');
      setLoginPassword('password123');
    }
  };

  // 2. Submit Coach Accreditation Request
  const handleCoachAccreditationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headshotBase64) {
      setCoachError('Mandatory profile picture is required so clients can visually verify their coach.');
      return;
    }
    if (!licenceBase64) {
      setCoachError('Mandatory coaching licence or professional fitness certification document required.');
      return;
    }

    setCoachLoading(true);
    setCoachError(null);
    setCoachStep(3); // Show verification screen

    try {
      const res = await fetch('/api/auth/register-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: coachName,
          email: coachEmail,
          phone: coachPhone.trim(),
          password: coachPassword,
          bio: coachBio,
          specialties: coachSpecialties,
          monthly_rate_ugx: coachRateUgx,
          licence_number: coachLicenceNumber,
          issuing_authority: coachIssuingAuthority,
          headshot_base64: headshotBase64,
          licence_document_base64: licenceBase64,
          national_id_base64: nationalIdBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Accreditation submission failed');

      setVerificationData(data.verification);
      setCreatedCoachUserId(data.user.id);
      // Auto-advance to OTP screen after slight animation
      setTimeout(() => {
        setCoachStep(4);
      }, 1500);
    } catch (err: any) {
      setCoachError(err.message);
      setCoachStep(2); // Go back to documents
    } finally {
      setCoachLoading(false);
    }
  };

  // 3. Submit Coach OTP
  const handleCoachOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput || otpCodeInput.length !== 6) {
      setCoachError('Please enter the 6-digit OTP code sent to your phone.');
      return;
    }

    setCoachLoading(true);
    setCoachError(null);
    try {
      const res = await fetch('/api/auth/verify-coach-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: createdCoachUserId,
          otpCode: otpCodeInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setCoachError(err.message);
    } finally {
      setCoachLoading(false);
    }
  };

  // 4. Submit Client Registration
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPhotoBase64) {
      setClientError('Mandatory profile photo required. Trainers and clients must be able to visually identify each other.');
      return;
    }

    setClientLoading(true);
    setClientError(null);
    try {
      const res = await fetch('/api/auth/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          phone: clientPhone.trim(),
          password: clientPassword,
          fitness_goal: clientGoal,
          current_weight_kg: clientWeight,
          target_weight_kg: clientTargetWeight,
          photo_base64: clientPhotoBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setClientError(err.message);
    } finally {
      setClientLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#141414] border border-[#2B2B2B] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF6A00] text-black font-black text-2xl shadow-lg shadow-[#FF6A00]/25">
            F
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FlexiFit Uganda</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Kampala's premier hybrid personal training & indigenous nutrition platform. Enterprise encryption & accredited coach verification.
          </p>

          {/* Mode Tabs */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-[#1A1A1A] rounded-2xl border border-[#282828] max-w-md mx-auto mt-4">
            <button
              type="button"
              onClick={() => setActiveMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeMode === 'login'
                  ? 'bg-[#FF6A00] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('coach_register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeMode === 'coach_register'
                  ? 'bg-[#FF6A00] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Coach Accreditation
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('client_register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeMode === 'client_register'
                  ? 'bg-[#FF6A00] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Client Sign Up
            </button>
          </div>
        </div>

        {/* MODE 1: LOGIN */}
        {activeMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="coach.brian@flexifit.ug or client@flexifit.ug"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-xs shadow-lg shadow-[#FF6A00]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? 'Signing in...' : 'Sign In to FlexiFit Uganda'}
            </button>

            {/* Quick Fill for Fast Review / Access */}
            <div className="pt-3 border-t border-[#222222] text-center space-y-2">
              <span className="text-[11px] text-slate-400 block font-medium">Quick Credentials Access:</span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('trainer')}
                  className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] text-[11px] font-semibold text-slate-200 border border-[#333333] transition-colors cursor-pointer"
                >
                  Fill: Coach Brian (Verified Coach)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('client')}
                  className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] text-[11px] font-semibold text-slate-200 border border-[#333333] transition-colors cursor-pointer"
                >
                  Fill: Sarah (Active Trainee)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* MODE 2: COACH REGISTRATION & ACCREDITATION PIPELINE */}
        {activeMode === 'coach_register' && (
          <div className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center justify-between max-w-lg mx-auto pb-3 border-b border-[#222222] text-[11px] font-semibold">
              <span className={coachStep >= 1 ? 'text-[#FF6A00]' : 'text-slate-500'}>1. Credentials</span>
              <span className="text-slate-600">→</span>
              <span className={coachStep >= 2 ? 'text-[#FF6A00]' : 'text-slate-500'}>2. Photo & Licences</span>
              <span className="text-slate-600">→</span>
              <span className={coachStep >= 3 ? 'text-[#FF6A00]' : 'text-slate-500'}>3. Automated Review</span>
              <span className="text-slate-600">→</span>
              <span className={coachStep >= 4 ? 'text-[#FF6A00]' : 'text-slate-500'}>4. OTP Activation</span>
            </div>

            {coachError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{coachError}</span>
              </div>
            )}

            {/* Step 1: Personal & Coaching Info */}
            {coachStep === 1 && (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Coach Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dennis Kimbugwe"
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ugandan Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+256 701 234567"
                      value={coachPhone}
                      onChange={(e) => setCoachPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="coach@flexifit.ug"
                      value={coachEmail}
                      onChange={(e) => setCoachEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={coachPassword}
                      onChange={(e) => setCoachPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Coaching Bio & Track Record</label>
                  <textarea
                    rows={2}
                    placeholder="Certifications, years in sports conditioning, and client specialties..."
                    value={coachBio}
                    onChange={(e) => setCoachBio(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white placeholder-slate-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!coachName || !coachEmail || !coachPhone || !coachPassword) {
                      setCoachError('Please fill out all required fields before uploading credentials.');
                      return;
                    }
                    setCoachError(null);
                    setCoachStep(2);
                  }}
                  className="w-full py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Continue to Photo & Licence Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Mandatory Photo & Licences */}
            {coachStep === 2 && (
              <form onSubmit={handleCoachAccreditationSubmit} className="space-y-4 max-w-lg mx-auto">
                {/* Mandatory Coach Picture */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>Mandatory Profile Picture (Self-Portrait) *</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Enables trainees to visually recognize their coach during check-ins and video calls.
                      </p>
                    </div>
                    {headshotBase64 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {headshotBase64 ? (
                      <img
                        src={headshotBase64}
                        alt="Coach Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF6A00]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#222222] border border-dashed border-[#444] flex items-center justify-center text-slate-500">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <label className="flex-1 py-2.5 px-3 rounded-xl bg-[#242424] hover:bg-[#2E2E2E] text-center text-xs font-semibold text-white border border-[#333] cursor-pointer transition-colors">
                      <span>{headshotBase64 ? 'Change Photo' : 'Upload Headshot / Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setHeadshotBase64)}
                      />
                    </label>
                  </div>
                </div>

                {/* Mandatory Coaching Licence / Certification Document */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>Fitness Coaching Licence / Certificate *</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Uganda Olympic Committee, ISSA, ACE, IFBB, or Ministry of Sports diploma.
                      </p>
                    </div>
                    {licenceBase64 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Licence No (e.g. UOC-FT-8842)"
                      value={coachLicenceNumber}
                      onChange={(e) => setCoachLicenceNumber(e.target.value)}
                      className="px-3 py-2 bg-[#222222] border border-[#333] rounded-xl text-xs text-white font-mono"
                    />
                    <label className="py-2 px-3 rounded-xl bg-[#242424] hover:bg-[#2E2E2E] text-center text-xs font-semibold text-white border border-[#333] cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{licenceBase64 ? 'Replace Doc' : 'Upload Licence (PDF/Img)'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setLicenceBase64)}
                      />
                    </label>
                  </div>
                </div>

                {/* Optional National ID scan */}
                <div className="p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">National ID / NIN Scan (Optional)</h4>
                    <p className="text-[10px] text-slate-400">Boosts verification score to 99%</p>
                  </div>
                  <label className="py-1.5 px-3 rounded-xl bg-[#242424] hover:bg-[#2E2E2E] text-xs font-semibold text-slate-300 border border-[#333] cursor-pointer transition-colors">
                    <span>{nationalIdBase64 ? 'ID Attached' : 'Attach ID'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setNationalIdBase64)}
                    />
                  </label>
                </div>

                {/* Encryption Guarantee Notice */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-2.5 text-[10px] text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Enterprise AES-256-GCM Encryption:</strong> All pictures, government IDs, and certificates are encrypted at rest using authenticated cryptography before being forwarded to the automated verification platform.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCoachStep(1)}
                    className="w-1/3 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={coachLoading}
                    className="flex-1 py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-xs shadow-lg shadow-[#FF6A00]/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {coachLoading ? 'Encrypting & Transmitting...' : 'Submit to Automated Verification Platform'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Verification in Progress */}
            {coachStep === 3 && (
              <div className="py-8 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-[#FF6A00] border-t-transparent animate-spin mx-auto" />
                <h3 className="font-extrabold text-base text-white">Automated Verification Platform Running...</h3>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <p>• Authenticating AES-256-GCM encryption payload...</p>
                  <p>• Cross-matching biometric face portrait against coaching registry...</p>
                  <p>• Validating certificate authority against Uganda Olympic Committee...</p>
                  <p>• Generating 6-digit OTP code...</p>
                </div>
              </div>
            )}

            {/* Step 4: OTP Activation */}
            {coachStep === 4 && (
              <form onSubmit={handleCoachOtpSubmit} className="space-y-4 max-w-md mx-auto">
                {/* Verification Passed Callout */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Credentials Approved! Verification Score: {verificationData?.verificationScore}%</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    {verificationData?.message || 'Your documents have been verified. An OTP has been dispatched to your phone.'}
                  </p>
                  {verificationData?.otpPreview && (
                    <div className="p-2 rounded bg-black/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-300">
                      Dispatched OTP Code (Preview): <strong>{verificationData.otpPreview}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 6-Digit Verification OTP *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 581934"
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-center text-lg font-mono font-bold text-white tracking-widest placeholder-slate-600 focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={coachLoading || otpCodeInput.length !== 6}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {coachLoading ? 'Activating Coach Account...' : 'Confirm OTP & Activate Certified Coach Badge'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 3: CLIENT REGISTRATION */}
        {activeMode === 'client_register' && (
          <form onSubmit={handleClientRegister} className="space-y-4 max-w-lg mx-auto">
            {clientError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{clientError}</span>
              </div>
            )}

            {/* Mandatory Client Photo */}
            <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Mandatory Client Profile Picture *</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Required so Coach Brian and your trainer know what you look like for personalized accountability.
                  </p>
                </div>
                {clientPhotoBase64 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Photo Attached
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {clientPhotoBase64 ? (
                  <img
                    src={clientPhotoBase64}
                    alt="Client Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF6A00]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#222222] border border-dashed border-[#444] flex items-center justify-center text-slate-500">
                    <UserCheck className="w-6 h-6" />
                  </div>
                )}
                <label className="flex-1 py-2.5 px-3 rounded-xl bg-[#242424] hover:bg-[#2E2E2E] text-center text-xs font-semibold text-white border border-[#333] cursor-pointer transition-colors">
                  <span>{clientPhotoBase64 ? 'Change Photo' : 'Upload Your Photo (Mandatory)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setClientPhotoBase64)}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Namubiru"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ugandan Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+256 782 333444"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@flexifit.ug"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={clientPassword}
                  onChange={(e) => setClientPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Goal</label>
                <select
                  value={clientGoal}
                  onChange={(e) => setClientGoal(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white"
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="fitness">General Fitness</option>
                  <option value="rehab">Post-Injury Rehab</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Current Wt (kg)</label>
                <input
                  type="number"
                  value={clientWeight}
                  onChange={(e) => setClientWeight(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Wt (kg)</label>
                <input
                  type="number"
                  value={clientTargetWeight}
                  onChange={(e) => setClientTargetWeight(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Encryption Notice */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-2 text-[10px] text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guaranteed:</strong> Client photos and measurements are encrypted with AES-256-GCM and only shared directly with your assigned certified coach.
              </span>
            </div>

            <button
              type="submit"
              disabled={clientLoading}
              className="w-full py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-xs shadow-lg shadow-[#FF6A00]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {clientLoading ? 'Creating Account & Encrypting...' : 'Complete Client Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
