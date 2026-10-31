import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Play,
  Square,
  Award,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowLeft,
  Flame,
  CheckCircle2,
  SwitchCamera,
  UserCheck,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  calculateJointAngle,
  analyzeSquatForm,
  analyzePushUpForm,
  analyzePlankForm,
  Point2D,
} from '../../utils/angleMath';
import {
  calculateRepTempo,
  getFormTier,
  generateVoiceCue,
  TempoAnalysis,
} from '../../utils/motionPacing';

interface LivePoseTrackerProps {
  onBack: () => void;
  onSessionSaved: () => void;
}

export const LivePoseTracker: React.FC<LivePoseTrackerProps> = ({ onBack, onSessionSaved }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [exercise, setExercise] = useState<'squat' | 'push_up' | 'plank'>('squat');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Interactive Engagement Features
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [showGhostGuide, setShowGhostGuide] = useState(true);
  const [targetReps, setTargetReps] = useState(10);
  const [targetReached, setTargetReached] = useState(false);
  const [currentTempo, setCurrentTempo] = useState<TempoAnalysis | null>(null);

  // Exercise Session Stats
  const [repCount, setRepCount] = useState(0);
  const [plankTimer, setPlankTimer] = useState(0);
  const [currentFormCue, setCurrentFormCue] = useState('Position yourself 6-8 feet in camera view');
  const [formScore, setFormScore] = useState(100);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Rep tracking state machine refs
  const squatStateRef = useRef<'UP' | 'DOWN'>('UP');
  const pushUpStateRef = useRef<'UP' | 'DOWN'>('UP');
  const descentStartTimeRef = useRef<number | null>(null);
  const repScoresRef = useRef<number[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const landmarkerRef = useRef<any>(null);

  // Clean Audio Chime
  const playRepAudio = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio unsupported or blocked
    }
  }, []);

  // Voice Coach Speech Synthesis
  const speakCoachCue = useCallback((text: string) => {
    if (!isVoiceEnabled) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Speech synthesis unsupported or blocked
    }
  }, [isVoiceEnabled]);

  // Main Tracking Loop
  const startTrackingLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const processFrame = () => {
      if (!video || video.paused || video.ended) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarkerRef.current) {
        try {
          const startTimeMs = performance.now();
          const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
            evaluateKinematics(landmarks);
          }
        } catch {
          // Frame skip
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);
  }, []);

  // Start Camera immediately
  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    setIsCameraInitializing(true);
    setStreamError(null);
    try {
      // If previous stream running, stop it
      if (videoRef.current?.srcObject) {
        const prevStream = videoRef.current.srcObject as MediaStream;
        prevStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: mode,
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsCameraActive(true);
          setIsCameraInitializing(false);
          startTrackingLoop();
        };
      }
    } catch (err: unknown) {
      console.warn('Camera access error or permission denied:', err);
      setIsCameraInitializing(false);
      setIsCameraActive(false);
      setStreamError('Could not start webcam feed. Please verify camera permissions in your browser or use the manual rep simulator below.');
    }
  }, [facingMode, startTrackingLoop]);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Initialize MediaPipe PoseLandmarker
  const initPoseLandmarker = async () => {
    try {
      setModelLoading(true);
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      landmarkerRef.current = landmarker;
      setModelLoading(false);
    } catch (err: unknown) {
      console.warn('[MediaPipe] Cloud model loading fallback:', err);
      setModelLoading(false);
    }
  };

  // IMMEDIATE CAMERA ACTIVATION ON MOUNT
  useEffect(() => {
    initPoseLandmarker();
    startCamera(); // Camera activates immediately on mount!

    return () => {
      stopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Draw colored kinematic skeleton
  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF6A00';
    ctx.fillStyle = '#10B981';

    const connections = [
      [11, 12], // shoulders
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28], // right leg
    ];

    connections.forEach(([p1, p2]) => {
      if (landmarks[p1] && landmarks[p2]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[p1].x * width, landmarks[p1].y * height);
        ctx.lineTo(landmarks[p2].x * width, landmarks[p2].y * height);
        ctx.stroke();
      }
    });

    landmarks.forEach((lm) => {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Evaluate form angles, cadence, and reps
  const evaluateKinematics = (landmarks: any[]) => {
    const rightHip: Point2D = { x: landmarks[24].x * 100, y: landmarks[24].y * 100 };
    const rightKnee: Point2D = { x: landmarks[26].x * 100, y: landmarks[26].y * 100 };
    const rightAnkle: Point2D = { x: landmarks[28].x * 100, y: landmarks[28].y * 100 };
    const rightShoulder: Point2D = { x: landmarks[12].x * 100, y: landmarks[12].y * 100 };
    const rightElbow: Point2D = { x: landmarks[14].x * 100, y: landmarks[14].y * 100 };
    const rightWrist: Point2D = { x: landmarks[16].x * 100, y: landmarks[16].y * 100 };

    const now = performance.now();

    if (exercise === 'squat') {
      const analysis = analyzeSquatForm(rightHip, rightKnee, rightAnkle, rightShoulder);
      setCurrentFormCue(analysis.formCue);
      setFormScore(analysis.formScore);

      if (analysis.kneeAngle <= 100) {
        if (squatStateRef.current === 'UP') {
          squatStateRef.current = 'DOWN';
          descentStartTimeRef.current = now;
        }
      } else if (analysis.kneeAngle > 155) {
        if (squatStateRef.current === 'DOWN') {
          // Rep completed
          const eccentricMs = descentStartTimeRef.current ? Math.max(800, now - descentStartTimeRef.current) : 2000;
          const tempo = calculateRepTempo(eccentricMs, 1000);
          setCurrentTempo(tempo);

          setRepCount((prev) => {
            const nextCount = prev + 1;
            repScoresRef.current.push(analysis.formScore);
            playRepAudio();

            if (nextCount === targetReps) {
              setTargetReached(true);
              speakCoachCue(`Target of ${targetReps} squats crushed! Superb workout set!`);
            } else {
              const cue = generateVoiceCue(nextCount, 'squat', analysis.formScore, targetReps);
              speakCoachCue(cue);
            }
            return nextCount;
          });

          squatStateRef.current = 'UP';
          descentStartTimeRef.current = null;
        }
      }
    } else if (exercise === 'push_up') {
      const analysis = analyzePushUpForm(rightShoulder, rightElbow, rightWrist, rightHip, rightAnkle);
      setCurrentFormCue(analysis.formCue);
      setFormScore(analysis.formScore);

      if (analysis.elbowAngle <= 90) {
        if (pushUpStateRef.current === 'UP') {
          pushUpStateRef.current = 'DOWN';
          descentStartTimeRef.current = now;
        }
      } else if (analysis.elbowAngle > 155) {
        if (pushUpStateRef.current === 'DOWN') {
          const eccentricMs = descentStartTimeRef.current ? Math.max(800, now - descentStartTimeRef.current) : 1800;
          const tempo = calculateRepTempo(eccentricMs, 900);
          setCurrentTempo(tempo);

          setRepCount((prev) => {
            const nextCount = prev + 1;
            repScoresRef.current.push(analysis.formScore);
            playRepAudio();

            if (nextCount === targetReps) {
              setTargetReached(true);
              speakCoachCue(`Target of ${targetReps} push-ups completed! Chest to deck!`);
            } else {
              const cue = generateVoiceCue(nextCount, 'push_up', analysis.formScore, targetReps);
              speakCoachCue(cue);
            }
            return nextCount;
          });

          pushUpStateRef.current = 'UP';
          descentStartTimeRef.current = null;
        }
      }
    } else if (exercise === 'plank') {
      const analysis = analyzePlankForm(rightShoulder, rightHip, rightAnkle);
      setCurrentFormCue(analysis.formCue);
      setFormScore(analysis.formScore);
      if (analysis.isAligned) {
        setPlankTimer((prev) => {
          const next = prev + 1;
          if (next === targetReps) {
            setTargetReached(true);
            speakCoachCue(`${targetReps} second plank hold completed! Solid spinal alignment!`);
          } else if (next % 10 === 0) {
            speakCoachCue(`${next} seconds, keep breathing`);
          }
          return next;
        });
      }
    }
  };

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Save session to server
  const handleSaveSession = async () => {
    try {
      const token = localStorage.getItem('flexifit_token');
      const avgScore =
        repScoresRef.current.length > 0
          ? Math.round(repScoresRef.current.reduce((a, b) => a + b, 0) / repScoresRef.current.length)
          : formScore;

      const res = await fetch('/api/vision/pose-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise,
          reps_completed: exercise === 'plank' ? plankTimer : repCount,
          duration_seconds: sessionDuration || 60,
          avg_form_score: avgScore,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        speakCoachCue('Workout recorded and sent to Coach Brian!');
        setTimeout(() => {
          onSessionSaved();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save session');
    }
  };

  // Manual Rep Simulation (for testing without camera)
  const handleManualSimulateRep = () => {
    const nextCount = repCount + 1;
    setRepCount(nextCount);
    repScoresRef.current.push(94);
    setCurrentFormCue('Excellent depth! Driving up through heels');
    playRepAudio();
    setCurrentTempo({
      eccentricSeconds: 2.1,
      concentricSeconds: 1.1,
      totalDurationSeconds: 3.2,
      pacing: 'optimal',
      pacingFeedback: 'Controlled tempo (2s down, 1s up)',
    });

    if (nextCount === targetReps) {
      setTargetReached(true);
      speakCoachCue(`Target of ${targetReps} reps crushed! Outstanding set!`);
    } else {
      speakCoachCue(`Rep ${nextCount}. Good form!`);
    }
  };

  const currentScore =
    repScoresRef.current.length > 0
      ? Math.round(repScoresRef.current.reduce((a, b) => a + b, 0) / repScoresRef.current.length)
      : formScore;

  const formTier = getFormTier(currentScore);
  const currentUnits = exercise === 'plank' ? plankTimer : repCount;
  const progressPercent = Math.min(100, Math.round((currentUnits / targetReps) * 100));

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Today</span>
        </button>

        {/* Action Toggles: Mute/Unmute Voice, Flip Camera, Ghost Guide */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
              isVoiceEnabled
                ? 'bg-[#1C1C1C] border-[#333] text-emerald-400 hover:text-emerald-300'
                : 'bg-[#141414] border-[#222] text-slate-500 hover:text-slate-300'
            }`}
            title={isVoiceEnabled ? 'Voice Coach Active' : 'Voice Coach Muted'}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[10px] hidden sm:inline">{isVoiceEnabled ? 'Voice On' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setShowGhostGuide(!showGhostGuide)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
              showGhostGuide
                ? 'bg-[#1C1C1C] border-[#333] text-[#FF6A00]'
                : 'bg-[#141414] border-[#222] text-slate-500'
            }`}
            title="Toggle Body Frame Guide"
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[10px] hidden sm:inline">Guide</span>
          </button>

          <button
            onClick={toggleFacingMode}
            className="p-2 rounded-xl text-xs font-semibold bg-[#1C1C1C] border border-[#333] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Flip Front / Back Camera"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Title & Live Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Camera Auto-Tracker
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Real-Time Motion & Kinematics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero video leaves your phone. MediaPipe AI counts reps and checks depth on-device at 30 FPS.
          </p>
        </div>

        {/* Form Accolade Tier Badge */}
        <div
          className="px-3 py-1.5 rounded-2xl border text-xs font-black shrink-0 flex items-center gap-1.5 shadow-lg"
          style={{ borderColor: `${formTier.color}40`, backgroundColor: `${formTier.color}15`, color: formTier.color }}
        >
          <Award className="w-4 h-4" />
          <span>{formTier.badge}</span>
        </div>
      </div>

      {/* Target & Exercise Selectors */}
      <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#242424] space-y-3">
        {/* Exercise Switcher */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'squat', label: 'Squats' },
            { key: 'push_up', label: 'Push-Ups' },
            { key: 'plank', label: 'Plank Hold' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setExercise(item.key as any);
                setRepCount(0);
                setPlankTimer(0);
                setTargetReached(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                exercise === item.key
                  ? 'bg-[#FF6A00] text-white shadow-md shadow-[#FF6A00]/25'
                  : 'bg-[#1C1C1C] border border-[#2A2A2A] text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Target Milestone Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Target className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Target Goal:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {(exercise === 'plank' ? [30, 45, 60] : [8, 10, 12, 15]).map((val) => (
              <button
                key={val}
                onClick={() => {
                  setTargetReps(val);
                  setTargetReached(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                  targetReps === val
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#1C1C1C] text-slate-400 hover:text-slate-200 border border-[#2A2A2A]'
                }`}
              >
                {val} {exercise === 'plank' ? 's' : 'reps'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Camera Viewport & Silhouette Guide */}
      <div className="relative rounded-3xl bg-black border border-[#2B2B2B] overflow-hidden aspect-[4/3] flex items-center justify-center shadow-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Ghost Silhouette Alignment Guide */}
        {isCameraActive && showGhostGuide && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <svg viewBox="0 0 200 300" className="h-[80%] stroke-white/60 fill-none stroke-2 stroke-dashed">
              {/* Head Circle */}
              <circle cx="100" cy="40" r="24" />
              {/* Torso & Shoulders */}
              <path d="M70,80 L130,80 L120,180 L80,180 Z" />
              {/* Arms */}
              <path d="M70,80 L50,140 L40,190" />
              <path d="M130,80 L150,140 L160,190" />
              {/* Legs */}
              <path d="M85,180 L80,240 L75,290" />
              <path d="M115,180 L120,240 L125,290" />
            </svg>
          </div>
        )}

        {/* Live HUD Telemetry Header */}
        {isCameraActive && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>30 FPS KINEMATICS</span>
            </div>

            <div className="px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold text-[#FF6A00]">
              ACCURACY: {currentScore}%
            </div>
          </div>
        )}

        {/* Target Reached Celebratory Overlay */}
        {targetReached && (
          <div className="absolute inset-x-4 top-14 p-3 rounded-2xl bg-[#FF6A00]/90 backdrop-blur-md text-white text-center shadow-xl animate-bounce pointer-events-none flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 fill-white" />
            <span className="font-black text-sm">Target of {targetReps} {exercise === 'plank' ? 'seconds' : 'reps'} Achieved! 🏆</span>
          </div>
        )}

        {/* Live Cue Banner on Bottom of Viewport */}
        {isCameraActive && (
          <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 text-center pointer-events-none shadow-lg">
            <span className="text-xs font-black text-white">{currentFormCue}</span>
          </div>
        )}

        {/* Camera Initializing Spinner */}
        {isCameraInitializing && !streamError && (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#FF6A00] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-white">Booting Camera & MediaPipe Sensors...</p>
            <p className="text-[11px] text-slate-400">Position your phone propped against a water bottle or wall.</p>
          </div>
        )}

        {/* Camera Error or Standby Fallback */}
        {(!isCameraActive && !isCameraInitializing) && (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1C1C] border border-[#333] flex items-center justify-center text-[#FF6A00] mx-auto">
              <Camera className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-white">Camera Offline or Blocked</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {streamError || 'Please allow camera access in browser permissions.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => startCamera()}
                className="px-5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-xs shadow-lg shadow-[#FF6A00]/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Camera</span>
              </button>

              <button
                onClick={handleManualSimulateRep}
                className="px-4 py-2.5 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                + Tap to Simulate Rep
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Progress Bar & Cadence Bar */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Set Progress ({currentUnits} / {targetReps})</span>
          </span>
          <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
        </div>

        <div className="w-full h-2.5 bg-[#202020] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6A00] to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Real-time Cadence / Tempo Feedback */}
        {currentTempo && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Cadence: <strong>{currentTempo.totalDurationSeconds}s/rep</strong></span>
            </span>
            <span className={currentTempo.pacing === 'optimal' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {currentTempo.pacingFeedback}
            </span>
          </div>
        )}
      </div>

      {/* Counters & Cues Panel */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] text-center">
          <span className="text-xs text-slate-400 uppercase font-semibold block">
            {exercise === 'plank' ? 'Hold Time' : 'Reps Counted'}
          </span>
          <span className="text-4xl font-black text-white font-mono mt-1 block">
            {exercise === 'plank' ? `${plankTimer}s` : repCount}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium block mt-1">
            {exercise === 'plank' ? 'Spine aligned' : 'Inflection detected'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] text-center">
          <span className="text-xs text-slate-400 uppercase font-semibold block">Biomechanical Form</span>
          <span className="text-4xl font-black text-[#FF6A00] font-mono mt-1 block">
            {currentScore}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Tier: <strong style={{ color: formTier.color }}>{formTier.tier}</strong>
          </span>
        </div>
      </div>

      {/* Testing Quick-Add Simulation Trigger */}
      <div className="text-center">
        <button
          onClick={handleManualSimulateRep}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-[#181818] border border-[#262626] transition-colors cursor-pointer"
        >
          ⚡ Quick Test: Simulate 1 Completed Rep
        </button>
      </div>

      {/* Action Controls: Direct Log to Coach Brian */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveSession}
          disabled={repCount === 0 && plankTimer === 0}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm shadow-xl shadow-[#FF6A00]/25 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{savedSuccess ? 'Set Recorded to Coach Brian!' : 'Log & Dispatch Set to Coach Brian'}</span>
        </button>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#222] text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Privacy: MediaPipe computer vision executes strictly on your device. Video frames are never recorded or sent over the network.</span>
      </div>
    </div>
  );
};
