/**
 * Focus Mode Generative Soundscape Engine
 * Real-time Web Audio API synthesized soundscapes and Ugandan polyrhythms.
 * 100% offline, zero network latency, zero external asset dependencies.
 */

export type SoundscapeId = 'uganda_baximba' | 'lofi_kampala' | 'nile_ambient';

export interface SoundscapeTrack {
  id: SoundscapeId;
  title: string;
  subtitle: string;
  bpm: number;
  genre: string;
  icon: string;
  description: string;
}

export const SOUNDSCAPE_TRACKS: Record<SoundscapeId, SoundscapeTrack> = {
  uganda_baximba: {
    id: 'uganda_baximba',
    title: 'Baximba & Kadodi Groove',
    subtitle: 'Upbeat Ugandan Polyrhythms',
    bpm: 128,
    genre: 'Traditional Tribal Fusion',
    icon: '🥁',
    description: 'Energetic syncopated Engalabi drums, Embuutu claps & Amadinda pentatonic riffs.',
  },
  lofi_kampala: {
    id: 'lofi_kampala',
    title: 'Kampala Rain & Lo-Fi Chill',
    subtitle: 'Atmospheric Rainy Afternoon',
    bpm: 82,
    genre: 'Lo-Fi Chillhop',
    icon: '🌧️',
    description: 'Warm tropical rain ambience, vintage jazz Rhodes chords & relaxed boom-bap rhythm.',
  },
  nile_ambient: {
    id: 'nile_ambient',
    title: 'Nile Sunrise Ambient',
    subtitle: 'Deep Harmonic Flow',
    bpm: 60,
    genre: 'Atmospheric Binaural',
    icon: '🌅',
    description: '432Hz deep meditative drone, crystal singing bowls & peaceful dawn wind chimes.',
  },
};

export interface FocusAudioState {
  isPlaying: boolean;
  activeTrackId: SoundscapeId;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
}

class FocusAudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentTrackId: SoundscapeId = 'uganda_baximba';
  private volume = 0.65;
  private isMuted = false;
  private timerId: number | null = null;
  private rainNode: AudioNode | null = null;
  private beatCallbacks: Array<(beatIndex: number, bpm: number) => void> = [];
  private currentBeat = 0;

  // Notes for Amadinda xylophone (Pentatonic Eb, F, G, Bb, C)
  private amadindaFreqs = [311.13, 349.23, 392.0, 466.16, 523.25, 622.25];

  // Chords for Kampala Lo-Fi (frequencies for Ebm9, Ab13, Dbmaj7, Bb7)
  private lofiChords = [
    [155.56, 311.13, 370.0, 466.16, 554.37], // Ebm9
    [207.65, 329.63, 415.3, 523.25, 659.25], // Ab13
    [138.59, 277.18, 349.23, 415.3, 523.25], // Dbmaj7
    [233.08, 293.66, 349.23, 466.16, 587.33], // Bb7
  ];

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
  }

  public async resumeIfNeeded(): Promise<void> {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {
        // Resume failed or not allowed yet
      }
    }
  }

  public getTrack(trackId: SoundscapeId): SoundscapeTrack {
    return SOUNDSCAPE_TRACKS[trackId] || SOUNDSCAPE_TRACKS.uganda_baximba;
  }

  public getState(): FocusAudioState {
    return {
      isPlaying: this.isPlaying,
      activeTrackId: this.currentTrackId,
      volume: this.volume,
      isMuted: this.isMuted,
    };
  }

  public onBeat(cb: (beatIndex: number, bpm: number) => void): () => void {
    this.beatCallbacks.push(cb);
    return () => {
      this.beatCallbacks = this.beatCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyBeat(beatIndex: number, bpm: number) {
    this.beatCallbacks.forEach((cb) => {
      try {
        cb(beatIndex, bpm);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  public async start(trackId: SoundscapeId = this.currentTrackId): Promise<void> {
    await this.resumeIfNeeded();
    if (!this.audioCtx || !this.masterGain) return;

    if (this.isPlaying) {
      this.stop();
    }

    this.currentTrackId = trackId;
    this.isPlaying = true;
    this.currentBeat = 0;

    const track = SOUNDSCAPE_TRACKS[trackId];
    const beatIntervalMs = (60 / track.bpm) * 1000;

    // Start background atmospheric layers
    if (trackId === 'lofi_kampala') {
      this.startRainAtmosphere();
    } else if (trackId === 'nile_ambient') {
      this.startDroneAtmosphere();
    }

    // Schedule rhythmic patterns
    const step = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const beat = this.currentBeat;
      this.currentBeat = (this.currentBeat + 1) % 16;
      this.notifyBeat(beat, track.bpm);

      try {
        if (this.currentTrackId === 'uganda_baximba') {
          this.playBaximbaStep(beat);
        } else if (this.currentTrackId === 'lofi_kampala') {
          this.playLofiStep(beat);
        } else if (this.currentTrackId === 'nile_ambient') {
          this.playNileStep(beat);
        }
      } catch {
        // Frame audio pass
      }

      this.timerId = window.setTimeout(step, beatIntervalMs / 4); // 16th note subdivision
    };

    step();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rainNode) {
      try {
        this.rainNode.disconnect();
      } catch {
        // Pass
      }
      this.rainNode = null;
    }
  }

  public setTrack(trackId: SoundscapeId): void {
    this.currentTrackId = trackId;
    if (this.isPlaying) {
      this.stop();
      this.start(trackId);
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.audioCtx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- SOUND SYNTHESIS HELPERS ---

  /** Synthesize Engalabi deep long drum */
  private playEngalabi(accent = false) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    const startFreq = accent ? 78 : 65;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);

    const level = (accent ? 0.45 : 0.3) * this.volume;
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /** Synthesize Embuutu medium high tom */
  private playEmbuutu(freq = 150) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.22 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Synthesize Akacence shaker noise */
  private playShaker(decay = 0.05) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * decay;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, now);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /** Synthesize Amadinda pentatonic log xylophone note */
  private playAmadindaNote(freq: number) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const overtone = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.76, now); // Inharmonic log overtone

    const level = 0.18 * this.volume;
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.28);
    overtone.stop(now + 0.28);
  }

  /** Baximba Step Generator: 16-step African polyrhythmic pattern */
  private playBaximbaStep(step: number) {
    // Shaker on all 16ths
    this.playShaker(step % 4 === 2 ? 0.08 : 0.04);

    // Engalabi syncopated bass drum (beats 0, 6, 8, 12, 14)
    if (step === 0 || step === 8) {
      this.playEngalabi(true);
    } else if (step === 6 || step === 12 || step === 14) {
      this.playEngalabi(false);
    }

    // Embuutu slap
    if (step === 4 || step === 10) {
      this.playEmbuutu(180);
    } else if (step === 2 || step === 15) {
      this.playEmbuutu(240);
    }

    // Amadinda xylophone melodic motif on select steps
    const melodyMap: Record<number, number> = {
      0: 0, // Eb
      3: 1, // F
      6: 2, // G
      8: 4, // C
      11: 3, // Bb
      14: 2, // G
    };
    if (melodyMap[step] !== undefined) {
      const idx = melodyMap[step];
      this.playAmadindaNote(this.amadindaFreqs[idx]);
    }
  }

  /** Start ambient rain background for Kampala Lo-Fi */
  private startRainAtmosphere() {
    if (!this.audioCtx || !this.masterGain) return;
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.06; // Pink rain noise
    }

    const rain = this.audioCtx.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.audioCtx.currentTime);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.08 * this.volume, this.audioCtx.currentTime);

    rain.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    rain.start();
    this.rainNode = rain;
  }

  /** Play Lo-Fi step */
  private playLofiStep(step: number) {
    // Relaxed boom-bap kick
    if (step === 0 || step === 10) {
      this.playEngalabi(false);
    }

    // Soft rimshot on 4 & 12
    if (step === 4 || step === 12) {
      this.playShaker(0.12);
    }

    // Warm Rhodes electric piano chord every 8 steps
    if (step === 0 || step === 8) {
      const chordIndex = Math.floor(step / 8) % this.lofiChords.length;
      const freqs = this.lofiChords[chordIndex];
      this.playRhodesChord(freqs);
    }
  }

  private playRhodesChord(freqs: number[]) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;

    freqs.forEach((f, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.02);

      const level = 0.06 * this.volume;
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.02);
      osc.stop(now + 1.7);
    });
  }

  /** Nile Ambient drone layer */
  private startDroneAtmosphere() {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;

    const rootOsc = this.audioCtx.createOscillator();
    const fifthOsc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    rootOsc.type = 'sine';
    rootOsc.frequency.setValueAtTime(108, now); // A2 / 432 harmonic

    fifthOsc.type = 'sine';
    fifthOsc.frequency.setValueAtTime(162, now); // E3

    gain.gain.setValueAtTime(0.08 * this.volume, now);

    rootOsc.connect(gain);
    fifthOsc.connect(gain);
    gain.connect(this.masterGain);

    rootOsc.start(now);
    fifthOsc.start(now);

    this.rainNode = {
      disconnect: () => {
        try {
          rootOsc.stop();
          fifthOsc.stop();
          rootOsc.disconnect();
          fifthOsc.disconnect();
        } catch {
          // Pass
        }
      },
    } as any;
  }

  private playNileStep(step: number) {
    // Intermittent singing bowl ring on step 0
    if (step === 0) {
      if (!this.audioCtx || !this.masterGain) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, now);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.6);
    }
  }
}

// Global Singleton Instance
export const focusAudio = new FocusAudioEngine();
