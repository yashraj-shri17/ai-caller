"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/Smartphone.module.css";
import { Signal, Wifi, Battery } from "lucide-react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [time, setTime] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(98);

  // Live Updating Time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Soft battery decrease to feel active and organic
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel((prev) => (prev > 10 ? prev - 1 : 98));
    }, 300000); // Decrease 1% every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.phoneFrame}>
      {/* Physical Hardware Elements */}
      <div className={styles.notch}>
        <div className={styles.speakerGrille} />
        <div className={styles.cameraLens} />
      </div>

      <div className={styles.screen}>
        {/* Software Top Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusBarTime}>{time || "19:40"}</div>
          <div className={styles.statusBarIcons}>
            <div className={styles.icon}>
              <Signal size={13} strokeWidth={2.5} />
            </div>
            <div className={styles.icon}>
              <Wifi size={13} strokeWidth={2.5} />
            </div>
            <div className={styles.icon} style={{ display: "flex", gap: "2px", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: "600" }}>{batteryLevel}%</span>
              <Battery size={15} strokeWidth={2} style={{ transform: "rotate(90deg) translateY(-1px)", transformOrigin: "center" }} />
            </div>
          </div>
        </div>

        {/* Dynamic Display Screens */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
