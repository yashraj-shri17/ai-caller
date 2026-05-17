"use client";

import { useEffect, useState, useRef } from "react";
import styles from "@/styles/Smartphone.module.css";
import { X, RefreshCw, Award, Clock, Smile } from "lucide-react";
import { Message, Agent } from "@/hooks/useWebSpeech";

interface PostCallProps {
  agent: Agent;
  duration: number;
  transcript: Message[];
  onClose: () => void;
}

interface SummaryData {
  summary: string;
  actionItems: string[];
  sentiment: string;
}

export function PostCall({ agent, duration, transcript, onClose }: PostCallProps) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Play a premium light chime sound when the call receipt slides up
  const playReceiptChime = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
      
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  useEffect(() => {
    playReceiptChime();
    
    // Fetch summary and analytics from /api/summary
    async function fetchSummary() {
      if (transcript.length === 0) {
        setLoading(false);
        setSummaryData({
          summary: "No conversation occurred during this call session.",
          actionItems: ["Make sure your microphone is enabled next time!"],
          sentiment: "Neutral"
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            agentName: agent.name
          })
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setSummaryData({
          summary: data.summary,
          actionItems: data.actionItems,
          sentiment: data.sentiment
        });
      } catch (err: any) {
        console.error("Summary fetch failed:", err);
        setError("Failed to generate AI receipt. Using local fallback.");
        setSummaryData({
          summary: `Call completed with ${agent.name}. Practice session covered speaking, dialogue fluency, and coaching concepts.`,
          actionItems: ["Review the transcript bubbles below to see your practice dialogue.", "Practice answering similar conversational cues next time."],
          sentiment: "Positive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [transcript, agent]);

  // Auto scroll conversation timeline to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Format call duration (MM:SS)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`${styles.postCallScreen} animate-slide-up`}>
      {/* Receipt Title */}
      <div className={styles.receiptHeader}>
        <div className={styles.receiptIcon}>🧾</div>
        <div className={styles.receiptTitle}>Call Completed</div>
        <div className={styles.receiptSubtitle}>Practice Session Receipt</div>
      </div>

      {/* Primary Analytics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={12} className="text-muted" color="var(--primary)" />
            <span className={styles.metricLabel}>CALL DURATION</span>
          </div>
          <div className={styles.metricValue}>{formatDuration(duration)}</div>
        </div>

        <div className={styles.metricCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Smile size={12} className="text-muted" color="var(--success)" />
            <span className={styles.metricLabel}>AI SENTIMENT</span>
          </div>
          <div className={styles.metricValue}>
            {loading ? (
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Analyzing...</span>
            ) : (
              summaryData?.sentiment || "Positive"
            )}
          </div>
        </div>
      </div>

      {/* Generative Summary Box */}
      <div className={styles.receiptDetailsBox}>
        <div className={styles.detailsTitle}>Generative Session Summary</div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px 0" }}>
            <div style={{ height: "14px", width: "100%", borderRadius: "4px", background: "rgba(255,255,255,0.05)", animation: "pulseText 1.5s infinite" }} />
            <div style={{ height: "14px", width: "80%", borderRadius: "4px", background: "rgba(255,255,255,0.05)", animation: "pulseText 1.5s infinite" }} />
            <div style={{ height: "14px", width: "60%", borderRadius: "4px", background: "rgba(255,255,255,0.05)", animation: "pulseText 1.5s infinite" }} />
          </div>
        ) : (
          <>
            <p className={styles.summaryText}>{summaryData?.summary}</p>
            {summaryData?.actionItems && summaryData.actionItems.length > 0 && (
              <>
                <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "0.5px" }}>Action Items</div>
                <ul className={styles.actionItemsList}>
                  {summaryData.actionItems.map((item, index) => (
                    <li key={index} className={styles.actionItem}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {/* Transcript bubbles timeline */}
      <div className={styles.timelineBox}>
        <div className={styles.timelineTitle}>Conversation Timeline</div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {transcript.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
              No chat logs recorded.
            </div>
          ) : (
            <div className={styles.timelineMessages}>
              {transcript.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div 
                    key={index}
                    className={`${styles.chatBubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}
                  >
                    <div>{msg.text}</div>
                    <div className={styles.bubbleMeta}>{msg.time}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Close button */}
      <button className={styles.closeReceiptBtn} onClick={onClose}>
        <X size={16} strokeWidth={2.5} />
        <span>Return to Contacts</span>
      </button>
    </div>
  );
}
