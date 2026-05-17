"use client";

import { useState, useCallback, useEffect } from "react";
import styles from "@/styles/Smartphone.module.css";
import { Phone, Delete, UserCheck, Globe } from "lucide-react";
import { PRESET_AGENTS, Agent } from "@/hooks/useWebSpeech";

interface DialerProps {
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  onStartCall: (forcedAgentId?: string) => void;
}

const COUNTRIES = [
  { code: "IN", label: "India", flag: "🇮🇳" },
  { code: "US", label: "USA", flag: "🇺🇸" },
  { code: "UK", label: "UK", flag: "🇬🇧" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "ES", label: "Spain", flag: "🇪🇸" }
];

export function Dialer({ selectedAgentId, onSelectAgent, onStartCall }: DialerProps) {
  const [typedNumber, setTypedNumber] = useState("");
  
  // Helper to map agent ID to country code
  const getAgentCountry = useCallback((id: string) => {
    if (["preet", "swara", "kanishka"].includes(id)) return "IN";
    if (["sarah", "jenny", "samantha"].includes(id)) return "US";
    if (["emma", "libby", "charlotte"].includes(id)) return "UK";
    if (["nanami", "ayumi", "haruka"].includes(id)) return "JP";
    if (["elena", "sofia", "isabella"].includes(id)) return "ES";
    return "US";
  }, []);

  const [activeCountry, setActiveCountry] = useState(() => getAgentCountry(selectedAgentId));

  // Sync active country tab when selectedAgentId changes externally
  useEffect(() => {
    setActiveCountry(getAgentCountry(selectedAgentId));
  }, [selectedAgentId, getAgentCountry]);

  // Filter agents by the active country tab
  const filteredAgents = PRESET_AGENTS.filter(agent => getAgentCountry(agent.id) === activeCountry);

  // Synthesize telephone DTMF beeps dynamically using native Web Audio API
  const playDialBeep = useCallback((frequency: number) => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime); // keep it soft and pleasing
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context beep failed", e);
    }
  }, []);

  const handleKeyPress = (num: string, beepFreq: number) => {
    playDialBeep(beepFreq);
    setTypedNumber(prev => (prev.length < 15 ? prev + num : prev));
  };

  const handleDelete = () => {
    playDialBeep(350);
    setTypedNumber(prev => prev.slice(0, -1));
  };

  const handleSelectCountry = (code: string) => {
    setActiveCountry(code);
    
    // Auto-select the first agent in the newly selected country
    const firstAgentOfCountry = PRESET_AGENTS.find(agent => getAgentCountry(agent.id) === code);
    if (firstAgentOfCountry) {
      onSelectAgent(firstAgentOfCountry.id);
    }
  };

  const keypadItems = [
    { num: "1", alpha: " ", freq: 697 },
    { num: "2", alpha: "A B C", freq: 770 },
    { num: "3", alpha: "D E F", freq: 852 },
    { num: "4", alpha: "G H I", freq: 941 },
    { num: "5", alpha: "J K L", freq: 1209 },
    { num: "6", alpha: "M N O", freq: 1336 },
    { num: "7", alpha: "P Q R S", freq: 1477 },
    { num: "8", alpha: "T U V", freq: 1633 },
    { num: "9", alpha: "W X Y Z", freq: 941 },
    { num: "*", alpha: " ", freq: 770 },
    { num: "0", alpha: "+", freq: 852 },
    { num: "#", alpha: " ", freq: 697 }
  ];

  return (
    <div className={styles.dialerContainer}>
      {/* Title */}
      <div className={styles.dialerTitle}>
        <Globe size={16} color="var(--primary)" />
        <span>Global Voices</span>
      </div>

      {/* Flag Country Tabs selector */}
      <div className={styles.flagTabsRow}>
        {COUNTRIES.map((country) => {
          const isActive = country.code === activeCountry;
          return (
            <button
              key={country.code}
              className={`${styles.flagTabButton} ${isActive ? styles.flagTabActive : ""}`}
              onClick={() => handleSelectCountry(country.code)}
              title={country.label}
            >
              <span className={styles.flagEmoji}>{country.flag}</span>
              <span className={styles.flagCodeLabel}>{country.code}</span>
            </button>
          );
        })}
      </div>

      {/* Filtered AI Agent list */}
      <div className={styles.agentsSection}>
        <div className={styles.agentsGrid}>
          {filteredAgents.map((agent) => {
            const isActive = agent.id === selectedAgentId;
            return (
              <div 
                key={agent.id}
                className={`${styles.agentCard} ${isActive ? styles.agentCardActive : ""}`}
                onClick={() => onSelectAgent(agent.id)}
              >
                <div className={styles.agentCardLeft}>
                  <div className={styles.agentAvatar}>{agent.avatar}</div>
                  <div className={styles.agentInfo}>
                    <div className={styles.agentName}>{agent.name}</div>
                    <div className={styles.agentSub}>{agent.description}</div>
                  </div>
                </div>
                {isActive ? (
                  <div style={{ color: "var(--primary)", display: "flex", alignItems: "center" }}>
                    <UserCheck size={18} strokeWidth={2.5} />
                  </div>
                ) : (
                  <button 
                    className={styles.quickCallBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAgent(agent.id);
                      onStartCall(agent.id);
                    }}
                  >
                    <Phone size={14} fill="#fff" color="#fff" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialed Number Display */}
      <div style={{ 
        height: "44px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: "22px", 
        fontWeight: "600", 
        color: "#fff",
        marginBottom: "8px",
        position: "relative",
        letterSpacing: "1px"
      }}>
        {typedNumber || <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>Dial a number...</span>}
        {typedNumber && (
          <button 
            onClick={handleDelete}
            style={{ 
              position: "absolute", 
              right: "10px", 
              background: "none", 
              border: "none", 
              color: "rgba(255,255,255,0.5)", 
              cursor: "pointer" 
            }}
          >
            <Delete size={18} />
          </button>
        )}
      </div>

      {/* Keypad Grid */}
      <div className={styles.keypadGrid}>
        {keypadItems.map((item) => (
          <button 
            key={item.num}
            className={styles.keypadButton}
            onClick={() => handleKeyPress(item.num, item.freq)}
          >
            <span className={styles.keypadNum}>{item.num}</span>
            <span className={styles.keypadAlpha}>{item.alpha}</span>
          </button>
        ))}

        {/* Dial Button */}
        <div className={styles.keypadDialRow}>
          <button 
            className={styles.dialGreenBtn}
            onClick={() => onStartCall()}
          >
            <Phone size={24} fill="#fff" color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
