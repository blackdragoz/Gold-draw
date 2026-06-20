/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Sparkles, Clock, AlertCircle, Volume2, VolumeX, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  playTickSound, 
  playLockSound, 
  playSuccessSound, 
  playClickSound,
  getMutedState, 
  toggleMutedState 
} from '../utils/audio';

interface LiveDrawDisplayProps {
  winningNumber: string;
  isRolling: boolean;
  lastDrawnAt: string | null;
}

export default function LiveDrawDisplay({ winningNumber, isRolling, lastDrawnAt }: LiveDrawDisplayProps) {
  // Local state to manage the step-by-step staggered roll reveal of 3 digits
  const [localDigits, setLocalDigits] = useState<string[]>(['?', '?', '?']);
  const [localSpinning, setLocalSpinning] = useState<boolean[]>([false, false, false]);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(getMutedState());
  const [countdown, setCountdown] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(19, 0, 0, 0); // 7:00 PM (19:00)

      // If we are already past 7:00 PM, target is tomorrow at 7:00 PM
      if (now.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleMuteToggle = () => {
    const isNowMuted = toggleMutedState();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      playClickSound();
    }
  };

  const fireConfettiExplosion = () => {
    // Left launcher
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.75 },
      colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
    });
    // Right launcher
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.75 },
      colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
    });

    // Delayed center burst
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#a855f7', '#f43f5e', '#ffffff', '#eab308']
      });
    }, 150);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let tickInterval: NodeJS.Timeout | null = null;
    
    if (isRolling) {
      setSecondsElapsed(0);
      setLocalSpinning([true, true, true]);
      setLocalDigits(['?', '?', '?']);

      // 1. Play background shuffle ticker sounds periodically
      tickInterval = setInterval(() => {
        playTickSound();
      }, 150);

      // Live 1-second interval tracker for accurate UI countdowns & progress bars
      interval = setInterval(() => {
        setSecondsElapsed(prev => {
          const next = prev + 1;
          if (next >= 30) {
            if (interval) clearInterval(interval);
            return 30;
          }
          return next;
        });
      }, 1000);

      // Digit 0 locks in after exactly 10 seconds (10s)
      const timer0 = setTimeout(() => {
        setLocalSpinning(prev => [false, prev[1], prev[2]]);
        setLocalDigits(prev => [winningNumber[0] || '?', prev[1], prev[2]]);
        playLockSound(0);
      }, 10000);

      // Digit 1 locks in after exactly 20 seconds (20s)
      const timer1 = setTimeout(() => {
        setLocalSpinning(prev => [false, false, prev[2]]);
        setLocalDigits(prev => [winningNumber[0] || '?', winningNumber[1] || '?', prev[2]]);
        playLockSound(1);
      }, 20000);

      // Digit 2 locks in after exactly 30 seconds (30s)
      const timer2 = setTimeout(() => {
        setLocalSpinning([false, false, false]);
        setLocalDigits((winningNumber || '???').split(''));
        if (tickInterval) clearInterval(tickInterval);
        playLockSound(2);
        // Play success celebrations & confetti!
        setTimeout(() => {
          playSuccessSound();
          fireConfettiExplosion();
        }, 120);
      }, 30000);

      return () => {
        if (interval) clearInterval(interval);
        if (tickInterval) clearInterval(tickInterval);
        clearTimeout(timer0);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setSecondsElapsed(0);
      setLocalSpinning([false, false, false]);
      setLocalDigits((winningNumber || '???').split(''));
    }
  }, [isRolling, winningNumber]);

  // Determine current focus and active countdown message
  const getProgressDetails = () => {
    if (!isRolling) {
      return {
        message: "Awaiting next round drawing...",
        percent: 0,
        subtext: "Submit tickets above before the next call begins"
      };
    }

    if (secondsElapsed < 10) {
      const remaining0 = 10 - secondsElapsed;
      return {
        message: `Drawing Digit 1: locks in ${remaining0}s...`,
        percent: (secondsElapsed / 30) * 100,
        subtext: `Target: [ ${winningNumber[0] || '?'} ] · ·`
      };
    } else if (secondsElapsed < 20) {
      const remaining1 = 20 - secondsElapsed;
      return {
        message: `Digit 1 Locked [ ${winningNumber[0] || '?'} ] · Drawing Digit 2: locks in ${remaining1}s...`,
        percent: (secondsElapsed / 30) * 100,
        subtext: `Target: ${winningNumber[0] || '?'} [ ${winningNumber[1] || '?'} ] ·`
      };
    } else if (secondsElapsed < 30) {
      const remaining2 = 30 - secondsElapsed;
      return {
        message: `Digit 1 & 2 Locked! Finalizing Digit 3 in ${remaining2}s...`,
        percent: (secondsElapsed / 30) * 100,
        subtext: `Target: ${winningNumber[0] || '?'}${winningNumber[1] || '?'} [ ${winningNumber[2] || '?'} ]`
      };
    } else {
      return {
        message: "Calculated Winner Reveal Complete!",
        percent: 100,
        subtext: `Official final drawn ticket: ${winningNumber}`
      };
    }
  };

  const currentProgress = getProgressDetails();

  return (
    <div id="live-draw-board" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black via-zinc-950 to-black border border-purple-950/40 p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.06)]">
      
      {/* Absolute background accent shadows */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-red-600/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative flex flex-col gap-6 md:flex-row items-center justify-between">
        
        {/* Left column: Header stats & status badge */}
        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-semibold text-zinc-400 border border-purple-950/50">
              <span className={`h-1.5 w-1.5 rounded-full ${isRolling ? 'bg-amber-500 animate-ping' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]'}`} />
              <span>
                {isRolling ? `Drawn Process: 30s Kinetic Cycle` : `Latest Drawn Results`}
              </span>
            </div>

            <button 
              onClick={handleMuteToggle}
              title={muted ? "Unmute Sound Effects" : "Mute Sound Effects"}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all duration-200 active:scale-95 cursor-pointer select-none ${
                muted 
                  ? 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800' 
                  : 'bg-purple-950/20 border-purple-500/20 text-purple-400 hover:border-purple-500/40'
              }`}
            >
              {muted ? (
                <div className="flex items-center gap-1">
                  <VolumeX className="h-3 w-3" />
                  <span>Silent</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  <span>Audio On</span>
                </div>
              )}
            </button>
          </div>
          
          <h1 id="live-board-title" className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Live Lucky Draw Results
          </h1>
          
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed col-span-2">
            Admin triggers daily on-chain drawings. Watch each digit locks sequentially every 10 seconds.
          </p>

          {/* Daily 7:00 PM Countdown Section */}
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] max-w-sm flex items-center justify-between gap-5 shadow-[0_8px_30px_rgb(245,158,11,0.03)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Clock className="h-5 w-5 animate-pulse text-amber-500" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-500 font-sans">
                  Golden Draw Countdown
                </h4>
                <p className="text-[10px] text-zinc-500 font-medium truncate">Draws daily at 7:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 px-2.5 py-2 rounded-xl border border-zinc-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="relative h-6 w-[24px] sm:w-[28px] overflow-hidden flex items-center justify-center bg-zinc-950/40 rounded-md">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countdown.hours}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="font-mono text-base sm:text-lg font-black text-amber-400 absolute tracking-tight drop-shadow-[0_0_6px_rgba(245,158,-11,0.4)]"
                    >
                      {countdown.hours}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="text-[8px] text-zinc-500 uppercase font-black mt-1 tracking-widest leading-none">H</span>
              </div>

              <span className="text-amber-500/50 font-mono text-xs font-black select-none line-clamp-1 pb-3 self-center animate-pulse">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="relative h-6 w-[24px] sm:w-[28px] overflow-hidden flex items-center justify-center bg-zinc-950/40 rounded-md">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countdown.minutes}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="font-mono text-base sm:text-lg font-black text-amber-400 absolute tracking-tight drop-shadow-[0_0_6px_rgba(245,158,-11,0.4)]"
                    >
                      {countdown.minutes}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="text-[8px] text-zinc-500 uppercase font-black mt-1 tracking-widest leading-none">M</span>
              </div>

              <span className="text-amber-500/50 font-mono text-xs font-black select-none line-clamp-1 pb-3 self-center animate-pulse">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="relative h-6 w-[24px] sm:w-[28px] overflow-hidden flex items-center justify-center bg-zinc-950/40 rounded-md">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countdown.seconds}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      className="font-mono text-base sm:text-lg font-black text-amber-400 absolute tracking-tight drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                    >
                      {countdown.seconds}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="text-[8px] text-zinc-500 uppercase font-black mt-1 tracking-widest leading-none">S</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-[11px] text-zinc-500 md:justify-start">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-900" />
              <span>Interval style: <strong className="text-zinc-300 font-mono">10s Staggered</strong></span>
            </div>
            {lastDrawnAt && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-red-950" />
                <span>Last call: <strong className="font-mono text-zinc-350 font-medium">{lastDrawnAt}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: 3 Digit slots with sequential spin effect */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="flex gap-3">
            {localDigits.map((digit, index) => {
              const isSlotSpinning = localSpinning[index];
              return (
                <div
                  key={index}
                  className={`relative flex h-16 w-12 sm:h-20 sm:w-16 items-center justify-center rounded-xl bg-black border overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-300 ${
                    isSlotSpinning 
                      ? 'border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.25)]' 
                      : digit !== '?' 
                        ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'border-purple-950/60'
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {isSlotSpinning ? (
                      <motion.div
                        key="spinning-reels"
                        initial={{ y: -240 }}
                        animate={{ y: 0 }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.15 + (index * 0.05), 
                          ease: "linear" 
                        }}
                        className="absolute flex flex-col items-center justify-start pointer-events-none"
                      >
                        {/* Rich blurred speed dial elements */}
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="h-16 sm:h-20 flex items-center justify-center font-mono text-xl font-bold text-purple-500/70 sm:text-3xl select-none"
                          >
                            {(i * 7 + index) % 10}
                          </div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.span
                        key={digit}
                        initial={{ y: -35, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 35, opacity: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 15 
                        }}
                        className={`font-display text-2xl font-black sm:text-4xl ${
                          digit === '?' 
                            ? 'text-zinc-800 animate-pulse' 
                            : 'bg-gradient-to-b from-purple-400 via-fuchsia-400 to-red-500 bg-clip-text text-transparent font-extrabold filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.35)]'
                        }`}
                      >
                        {digit}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Split segment line card overlay */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-purple-950/20" />
                </div>
              );
            })}
          </div>

          {!isRolling && winningNumber !== '???' && (
            <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-emerald-400 font-mono bg-emerald-500/5 px-2.5 py-0.5 rounded-full border border-emerald-500/15 animate-pulse">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              Draw concluded
            </div>
          )}
        </div>

      </div>

      {/* Full-width Spectacular Victory Celebration Strip */}
      {!isRolling && winningNumber !== '???' && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="mt-6 border-t border-purple-500/20 pt-5 space-y-3"
        >
          <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-purple-900/10 to-pink-950/30 p-4 shadow-[0_0_25px_rgba(168,85,247,0.1)]">
            {/* Pulsing neon shimmer behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/2 via-pink-500/2 to-transparent animate-pulse pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce" style={{ animationDuration: '3s' }}>
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="font-display text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 tracking-wider">
                    Official Victory Announcement
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans mt-0.5 font-medium leading-none">
                    Drawn code matches verified entrants in this lottery pool
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-[10px] text-zinc-400 font-mono uppercase font-semibold">Winning Code:</div>
                <div className="flex h-9 items-center justify-center rounded-lg bg-black px-4.5 font-mono text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-red-500 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)] select-all tracking-wider">
                  {winningNumber}
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-purple-300 font-sans font-semibold text-center flex items-center justify-center gap-1.5 border-t border-purple-500/10 pt-2 bg-purple-950/5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span>Congratulations to all winners! Match your tickets below to claim prizes instantly.</span>
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
