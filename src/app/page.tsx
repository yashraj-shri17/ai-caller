"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "@/styles/Dashboard.module.css";
import { PhoneFrame } from "@/components/Smartphone/PhoneFrame";
import { LockScreen } from "@/components/Smartphone/LockScreen";
import { Dialer } from "@/components/Smartphone/Dialer";
import { ActiveCall } from "@/components/Smartphone/ActiveCall";
import { PostCall } from "@/components/Smartphone/PostCall";
import { PRESET_AGENTS, useWebSpeech, Message } from "@/hooks/useWebSpeech";
import { Download } from "lucide-react";

interface SavedCall {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  duration: number;
  date: string;
  sentiment: string;
}

const MOCK_INITIAL_HISTORY: SavedCall[] = [
  {
    id: "mock-1",
    agentId: "sarah",
    agentName: "Sarah",
    agentAvatar: "👩‍💼",
    duration: 134, // 2m 14s
    date: "May 17, 12:45",
    sentiment: "Confident"
  },
  {
    id: "mock-2",
    agentId: "preet",
    agentName: "Preet",
    agentAvatar: "👩‍💻",
    duration: 252, // 4m 12s
    date: "May 16, 16:30",
    sentiment: "Focused"
  }
];

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("sarah");
  const [callHistory, setCallHistory] = useState<SavedCall[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastCallData, setLastCallData] = useState<{ duration: number; transcript: Message[] } | null>(null);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Listen for PWA Install Prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome from automatically showing native install banner
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Core WebSpeech call hook
  const {
    isCalling,
    isRinging,
    isConnected,
    isMuted,
    isSpeakerOn,
    isAiSpeaking,
    transcript,
    callDuration,
    activeAgent,
    makeCall,
    hangUp,
    toggleMute,
    toggleSpeaker
  } = useWebSpeech(selectedAgentId);

  // Load history from localStorage on mount (with fallback to mock items)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auracall_history");
      if (stored) {
        try {
          setCallHistory(JSON.parse(stored));
        } catch (e) {
          setCallHistory(MOCK_INITIAL_HISTORY);
        }
      } else {
        setCallHistory(MOCK_INITIAL_HISTORY);
        localStorage.setItem("auracall_history", JSON.stringify(MOCK_INITIAL_HISTORY));
      }
    }
  }, []);

  // Play a soft dynamic chime when the phone unlocks
  const playUnlockChime = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5 note
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5 note
      
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const handleUnlock = () => {
    playUnlockChime();
    setIsUnlocked(true);
  };

  // Watch for active call ending to save metadata and slide open receipt card
  const handleHangUp = useCallback(() => {
    if (isCalling) {
      setLastCallData({
        duration: callDuration,
        transcript: [...transcript]
      });

      const sentiments = ["Positive", "Focused", "Confident", "Constructive"];
      const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      
      const newCall: SavedCall = {
        id: `call-${Date.now()}`,
        agentId: activeAgent.id,
        agentName: activeAgent.name,
        agentAvatar: activeAgent.avatar,
        duration: callDuration,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        sentiment: randomSentiment
      };

      setCallHistory(prev => {
        const next = [newCall, ...prev];
        localStorage.setItem("auracall_history", JSON.stringify(next));
        return next;
      });

      hangUp();
      setShowReceipt(true);
    }
  }, [isCalling, callDuration, transcript, activeAgent, hangUp]);

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastCallData(null);
  };

  return (
    <div className={styles.container}>
      {/* 3D background fluid dynamic glow blobs */}
      <div className={styles.glowBlob1}></div>
      <div className={styles.glowBlob2}></div>

      {/* Main Centered Smartphone Viewport */}
      <div className={styles.phonePanelCentered}>
        <PhoneFrame>
          {!isUnlocked ? (
            <LockScreen onUnlock={handleUnlock} />
          ) : isCalling ? (
            <ActiveCall
              agent={activeAgent}
              isRinging={isRinging}
              isConnected={isConnected}
              isMuted={isMuted}
              isSpeakerOn={isSpeakerOn}
              isAiSpeaking={isAiSpeaking}
              callDuration={callDuration}
              onHangUp={handleHangUp}
              onToggleMute={toggleMute}
              onToggleSpeaker={toggleSpeaker}
            />
          ) : showReceipt && lastCallData ? (
            <PostCall
              agent={activeAgent}
              duration={lastCallData.duration}
              transcript={lastCallData.transcript}
              onClose={handleCloseReceipt}
            />
          ) : (
            <Dialer
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
              onStartCall={makeCall}
            />
          )}
        </PhoneFrame>

        {/* Dynamic Premium PWA Install utility badge */}
        {isInstallable ? (
          <div className={styles.pwaInstallBadge}>
            <div className={styles.pwaInstallContent}>
              <span className={styles.pwaAppIcon}>📞</span>
              <div className={styles.pwaTextColumn}>
                <span className={styles.pwaAppTitle}>AuraCall AI</span>
                <span className={styles.pwaAppSub}>Add to home screen for immersive call experience</span>
              </div>
            </div>
            <button className={styles.pwaInstallBtn} onClick={handleInstallClick}>
              <Download size={14} style={{ marginRight: '6px' }} />
              <span>Install App</span>
            </button>
          </div>
        ) : (
          <div className={styles.pwaStandaloneIndicator}>
            <span>⚡ Running in premium high-fidelity calling mode</span>
          </div>
        )}
      </div>
    </div>
  );
}
