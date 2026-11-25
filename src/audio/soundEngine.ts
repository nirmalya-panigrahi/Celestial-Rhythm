import * as Tone from 'tone';
import type {BreathPhaseLabel} from '../types/astral';

class AstralSoundEngine {
  private initialized = false;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.55;
  private currentFreq = 432;
  private activeDroneNotes: number[] = [];

  private droneSynth: Tone.PolySynth | null = null;
  private chimeSynth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private masterGain: Tone.Gain | null = null;

  private canUseAudio(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('AudioContext' in window || 'webkitAudioContext' in window)
    );
  }

  private async ensureGraph(): Promise<boolean> {
    if (!this.canUseAudio()) return false;

    try {
      const isSupported = await Tone.supported();
      if (!isSupported) return false;
      await Tone.start();
    } catch {
      return false;
    }

    if (this.initialized) return true;

    this.masterGain = new Tone.Gain(this.isMuted ? 0 : this.volume * 0.32).toDestination();
    this.reverb = new Tone.Reverb({decay: 4.5, wet: 0.45, preDelay: 0.04}).connect(this.masterGain);
    this.filter = new Tone.Filter({type: 'lowpass', frequency: 1450, rolloff: -12}).connect(
      this.reverb,
    );

    this.droneSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 1.8,
        decay: 0.8,
        sustain: 0.85,
        release: 2.8,
      },
    }).connect(this.filter);
    this.droneSynth.volume.value = -10;

    this.chimeSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.04,
        decay: 1.2,
        sustain: 0.05,
        release: 2.2,
      },
    }).connect(this.reverb);
    this.chimeSynth.volume.value = -12;

    this.initialized = true;
    return true;
  }

  private getBowlChord(fundamentalHz: number): number[] {
    // Keep fundamental in comfortable warm singing-bowl register (110..330 Hz for sub/drone)
    let base = fundamentalHz;
    while (base > 340) base /= 2;
    while (base < 110) base *= 2;
    return [
      Number(base.toFixed(2)),
      Number((base * 1.498).toFixed(2)), // Pure fifth
      Number((base * 2).toFixed(2)), // Octave
    ];
  }

  public async startDrone(fundamentalHz: number): Promise<void> {
    this.currentFreq = fundamentalHz;
    const ready = await this.ensureGraph();
    if (!ready || !this.droneSynth) return;

    if (this.isPlaying && this.activeDroneNotes.length > 0) {
      this.droneSynth.releaseAll();
    }

    const chord = this.getBowlChord(fundamentalHz);
    this.activeDroneNotes = chord;
    this.droneSynth.triggerAttack(chord, Tone.now(), 0.55);
    this.isPlaying = true;
  }

  public async setFrequency(fundamentalHz: number): Promise<void> {
    if (Math.abs(this.currentFreq - fundamentalHz) < 0.5) return;
    this.currentFreq = fundamentalHz;
    if (this.isPlaying) {
      await this.startDrone(fundamentalHz);
    }
  }

  public async triggerPhaseChime(phase: BreathPhaseLabel, fundamentalHz?: number): Promise<void> {
    const ready = await this.ensureGraph();
    if (!ready || !this.chimeSynth) return;

    const base = fundamentalHz ?? this.currentFreq;
    let chimeBase = base;
    while (chimeBase < 260) chimeBase *= 2;
    while (chimeBase > 660) chimeBase /= 2;

    const now = Tone.now();
    if (phase === 'Inhale') {
      this.chimeSynth.triggerAttackRelease([chimeBase, chimeBase * 1.5], '2n', now, 0.42);
    } else if (phase === 'Hold') {
      this.chimeSynth.triggerAttackRelease([chimeBase * 2], '4n', now, 0.3);
    } else if (phase === 'Exhale') {
      this.chimeSynth.triggerAttackRelease([chimeBase * 1.25, chimeBase], '2n', now, 0.34);
    } else {
      this.chimeSynth.triggerAttackRelease([chimeBase * 0.75], '4n', now, 0.22);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.canUseAudio()) {
      this.masterGain.gain.rampTo(muted ? 0 : this.volume * 0.32, 0.15);
    }
  }

  public setVolume(linearVolume: number): void {
    this.volume = Math.max(0, Math.min(1, linearVolume));
    if (this.masterGain && !this.isMuted && this.canUseAudio()) {
      this.masterGain.gain.rampTo(this.volume * 0.32, 0.12);
    }
  }

  public stopDrone(): void {
    if (this.droneSynth && this.isPlaying) {
      try {
        this.droneSynth.releaseAll();
      } catch {
        // Ignore teardown errors when audio context is closed
      }
    }
    this.activeDroneNotes = [];
    this.isPlaying = false;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public dispose(): void {
    this.stopDrone();
    try {
      this.droneSynth?.dispose();
      this.chimeSynth?.dispose();
      this.filter?.dispose();
      this.reverb?.dispose();
      this.masterGain?.dispose();
    } catch {
      // Safe no-op
    }
    this.droneSynth = null;
    this.chimeSynth = null;
    this.filter = null;
    this.reverb = null;
    this.masterGain = null;
    this.initialized = false;
  }
}

export const soundEngine = new AstralSoundEngine();
