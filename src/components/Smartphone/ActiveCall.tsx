"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "@/styles/Smartphone.module.css";
import { MicOff, Volume2, Grid, PhoneOff } from "lucide-react";
import { WaveVisualizer } from "./WaveVisualizer";
import { Agent } from "@/hooks/useWebSpeech";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";

interface ActiveCallProps {
  agent: Agent;
  isRinging: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isAiSpeaking: boolean;
  callDuration: number;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export function ActiveCall({
  agent,
  isRinging,
  isConnected,
  isMuted,
  isSpeakerOn,
  isAiSpeaking,
  callDuration,
  onHangUp,
  onToggleMute,
  onToggleSpeaker
}: ActiveCallProps) {
  // Live mic analysis volume
  const userVolume = useAudioAnalyser(isConnected, isMuted);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play a realistic dual-frequency (440Hz + 480Hz) phone ringback tone
  const playRingbackTone = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.value = 440;
      
      osc2.type = "sine";
      osc2.frequency.value = 480;

      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      // Ring for 1.6 seconds, then fade out
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime + 1.4);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(ctx.currentTime + 1.6);
      osc2.stop(ctx.currentTime + 1.6);
    } catch (e) {
      console.warn("Ringback audio play failed", e);
    }
  }, []);

  // Ring tone trigger cycle while isRinging is true
  useEffect(() => {
    if (isRinging) {
      playRingbackTone();
      ringIntervalRef.current = setInterval(playRingbackTone, 3000); // Ring every 3 seconds
    } else {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    }

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [isRinging, playRingbackTone]);

  // Format call timer (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.activeCallScreen}>
      {/* Agent details */}
      <div className={styles.callPartyInfo}>
        <div className={`${styles.callAvatarLarge} ${isAiSpeaking ? styles.callAvatarLargeSpeaking : ""}`}>
          <span className={isAiSpeaking ? "animate-pulse-avatar" : ""}>{agent.avatar}</span>
        </div>
        <div className={styles.callName}>{agent.name}</div>
        <div className={styles.callStatusText}>
          {isRinging ? "Ringing..." : isConnected ? formatTimer(callDuration) : "Connecting..."}
        </div>
      </div>

      {/* Interactive Glowing Canvas Audio Waves */}
      <div className={styles.visualizerWrapper}>
        <WaveVisualizer 
          isAiSpeaking={isAiSpeaking} 
          userVolume={userVolume} 
          isConnected={isConnected} 
          isRinging={isRinging} 
        />
      </div>

      {/* Call controls panel */}
      <div className={styles.callControlPanel}>
        <div className={styles.controlButtonsGrid}>
          {/* Mute Button */}
          <button className={styles.controlButton} onClick={onToggleMute}>
            <div className={`${styles.controlButtonIcon} ${isMuted ? styles.controlButtonIconActive : ""}`}>
              <MicOff size={18} />
            </div>
            <span className={styles.controlButtonText}>{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Keypad Utility Toggler */}
          <button className={styles.controlButton}>
            <div className={styles.controlButtonIcon}>
              <Grid size={18} />
            </div>
            <span className={styles.controlButtonText}>Keypad</span>
          </button>

          {/* Speaker Button */}
          <button className={styles.controlButton} onClick={onToggleSpeaker}>
            <div className={`${styles.controlButtonIcon} ${!isSpeakerOn ? styles.controlButtonIconActive : ""}`}>
              <Volume2 size={18} />
            </div>
            <span className={styles.controlButtonText}>{isSpeakerOn ? "Speaker" : "Handset"}</span>
          </button>
        </div>

        {/* Big Red Hang Up Button */}
        <button className={styles.hangUpRedBtn} onClick={onHangUp}>
          <PhoneOff size={24} color="#fff" />
        </button>
      </div>
    </div>
  );
}
