"use client";

import { useEffect, useState, useRef } from "react";
import styles from "@/styles/Smartphone.module.css";
import { MessageSquare, ArrowRight } from "lucide-react";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);

  // Digital Clock updating live
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
      );
      
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        month: "long",
        day: "numeric"
      };
      setDate(now.toLocaleDateString("en-US", options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Slider Gestures (Drag-to-Unlock)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startXRef.current;
      
      // Calculate max boundary width of slider track
      const maxDrag = sliderRef.current.clientWidth - 56; // handle width
      const clampedX = Math.max(0, Math.min(deltaX, maxDrag));
      
      setDragX(clampedX);

      // Trigger unlock if user slides more than 85% of track width
      if (clampedX >= maxDrag * 0.85) {
        setIsDragging(false);
        setDragX(0);
        onUnlock();
      }
    };

    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        // Snap back to starting position if not fully slid
        setDragX(0);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, onUnlock]);

  return (
    <div className={styles.lockScreen}>
      {/* Time & Date Display */}
      <div className={styles.lockScreenHeader}>
        <div className={styles.lockScreenTime}>{time || "19:40"}</div>
        <div className={styles.lockScreenDate}>{date || "Sunday, May 17"}</div>
      </div>

      {/* Notifications from Pre-configured Agents */}
      <div className={styles.notificationsList}>
        <div className={styles.notificationCard}>
          <div className={styles.notificationIcon}>👩‍💼</div>
          <div className={styles.notificationContent}>
            <div className={styles.notificationTitle}>Sarah (English Speaking Partner)</div>
            <div className={styles.notificationText}>Hey! Let's practice some English dialogue today! Call me anytime. 💬</div>
          </div>
        </div>

        <div className={styles.notificationCard} style={{ animationDelay: "0.1s" }}>
          <div className={styles.notificationIcon}>👩‍💻</div>
          <div className={styles.notificationContent}>
            <div className={styles.notificationTitle}>Preet (Business Coach)</div>
            <div className={styles.notificationText}>Let's scale your venture. Ready to tackle your bottlenecks? 🚀</div>
          </div>
        </div>
      </div>

      {/* Swipe to Unlock Slider */}
      <div className={styles.lockScreenFooter}>
        <div 
          ref={sliderRef}
          className={styles.sliderTrack}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div 
            className={styles.sliderHandle}
            style={{ 
              transform: `translateX(${dragX}px)`,
              transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            }}
          >
            <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span className={styles.sliderText}>swipe to unlock</span>
        </div>
      </div>
    </div>
  );
}
