/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Video, Camera, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { FormCheckAnalysis } from '../../types/index.ts';

interface FormCheckUploadProps {
  clientId?: string;
  onAnalysisComplete?: (result: FormCheckAnalysis) => void;
}

export const FormCheckUpload: React.FC<FormCheckUploadProps> = ({
  clientId = 'client-1',
  onAnalysisComplete,
}) => {
  const [exercise, setExercise] = useState('Squat');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FormCheckAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [framesCount, setFramesCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please select a valid video file (MP4, WebM, MOV)');
        return;
      }
      setVideoFile(file);
      setErrorMsg(null);
      setAnalysisResult(null);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  // Extract 4-6 keyframes from the loaded video using HTML5 Canvas
  const extractFrames = async (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        return reject(new Error('Video or canvas element not available'));
      }

      const frames: string[] = [];
      const duration = video.duration || 5;
      const numFrames = 5;
      const timestamps = [
        0.15 * duration,
        0.35 * duration,
        0.5 * duration, // Rep apex/bottom
        0.7 * duration,
        0.9 * duration,
      ];

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context not available'));

      let currentIndex = 0;

      const seekNext = () => {
        if (currentIndex >= timestamps.length) {
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[currentIndex];
      };

      const handleSeeked = () => {
        // Draw frame onto canvas (target max 640x360 for speed & bandwidth)
        canvas.width = 640;
        canvas.height = (video.videoHeight / video.videoWidth) * 640 || 360;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        frames.push(dataUrl);
        currentIndex++;
        seekNext();
      };

      video.addEventListener('seeked', handleSeeked, { once: false });
      seekNext();
    });
  };

  const handleAnalyze = async () => {
    if (!videoPreviewUrl) {
      setErrorMsg('Please upload a workout video first.');
      return;
    }

    try {
      setIsExtracting(true);
      setErrorMsg(null);
      const frames = await extractFrames();
      setFramesCount(frames.length);
      setIsExtracting(false);

      setIsAnalyzing(true);
      const token = localStorage.getItem('flexifit_token');
      const response = await fetch('/api/form-check/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          exercise,
          frames,
          clientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze video. Check network or try again.');
    } finally {
      setIsExtracting(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-xl text-[#FF6A00]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Vision Form Check</h2>
            <p className="text-xs text-gray-400">
              Powered by Google Gemini 3.8 Flash Vision. Upload 5–15s of your rep for instant kinematic feedback.
            </p>
          </div>
        </div>

        {/* Exercise selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['Squat', 'Push-up', 'Barbell Deadlift', 'Overhead Press', 'Lunges'].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setExercise(ex)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                exercise === ex
                  ? 'bg-[#FF6A00] text-black shadow-lg shadow-[#FF6A00]/20'
                  : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#282828] border border-[#2a2a2a]'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Upload & Preview Section */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!videoPreviewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#2d2d2d] hover:border-[#FF6A00] rounded-2xl p-10 text-center cursor-pointer transition group bg-[#0e0e0e]"
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#1e1e1e] flex items-center justify-center text-gray-400 group-hover:text-[#FF6A00] group-hover:scale-105 transition">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-white text-sm mb-1">Click to upload workout video</p>
            <p className="text-xs text-gray-500">Supports MP4, WebM, MOV up to 50MB (side or 45-degree angle recommended)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-80 mx-auto border border-[#2a2a2a]">
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] rounded-lg transition"
              >
                <Video className="w-4 h-4" /> Change Video
              </button>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isExtracting || isAnalyzing}
                className="px-5 py-2.5 bg-[#FF6A00] hover:bg-[#ff7b1a] text-black font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF6A00]/25 transition disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting Keyframes...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Gemini Vision Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze {exercise} Form
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hidden Canvas used for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Analysis Scorecard Result */}
      {analysisResult && (
        <div className="bg-[#141414] border border-[#FF6A00]/40 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between border-b border-[#262626] pb-4">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#FF6A00] uppercase font-bold">
                Biomechanics Evaluation
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">{exercise} Form Scorecard</h3>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-black px-4 py-1.5 rounded-xl border ${
                  analysisResult.overall_score >= 80
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400'
                    : analysisResult.overall_score >= 60
                    ? 'bg-amber-950/50 border-amber-500/50 text-amber-400'
                    : 'bg-red-950/50 border-red-500/50 text-red-400'
                }`}
              >
                {analysisResult.overall_score}<span className="text-xs font-normal text-gray-400">/100</span>
              </div>
            </div>
          </div>

          {/* Cue Highlight */}
          {analysisResult.suggested_cue && (
            <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-[#FF6A00] font-semibold mb-1">
                Immediate Coach Cue:
              </p>
              <p className="text-white text-base font-bold italic">
                "{analysisResult.suggested_cue}"
              </p>
            </div>
          )}

          {/* Grid of Goods and Fixes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What Looks Good */}
            <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>What Looks Solid</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.what_looks_good?.map((item: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-200 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fix These */}
            <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                <span>Opportunities to Refine</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.fix_these?.map((item: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-200 flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Warning */}
          {analysisResult.safety_note && (
            <div className="p-3.5 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-300 block mb-0.5">Safety & Injury Prevention Note:</strong>
                <span>{analysisResult.safety_note}</span>
              </div>
            </div>
          )}

          {/* Medical Disclaimer & Nutritionist/Trainer Note */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-2 border-t border-[#262626]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              AI form checks are assistive biomechanical indicators and do not replace personalized in-person assessment by a certified trainer or sports physiotherapist.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
