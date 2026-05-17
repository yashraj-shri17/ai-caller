"use client";

import { useEffect, useRef } from "react";

interface WaveVisualizerProps {
  isAiSpeaking: boolean;
  userVolume: number;
  isConnected: boolean;
  isRinging: boolean;
}

export function WaveVisualizer({ isAiSpeaking, userVolume, isConnected, isRinging }: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 320);
    let height = (canvas.height = 100);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 100;
      }
    };

    window.addEventListener("resize", handleResize);

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      phaseRef.current += 0.05; // Base wave speed

      let targetAmplitude = 10;
      let targetFrequency = 0.02;
      let waveColor = "rgba(255, 85, 0, 0.4)"; // Default energetic neon orange
      let waveGlow = "rgba(255, 85, 0, 0.2)";

      if (isRinging) {
        // Ringing state: rhythmic slow pulse
        targetAmplitude = 20 + Math.sin(phaseRef.current * 1.5) * 8;
        targetFrequency = 0.015;
        waveColor = "rgba(255, 255, 255, 0.3)";
        waveGlow = "rgba(255, 255, 255, 0.05)";
      } else if (isConnected) {
        if (isAiSpeaking) {
          // AI speaking: fluent, rhythmic waves
          targetAmplitude = 25 + Math.sin(phaseRef.current * 0.8) * 10;
          targetFrequency = 0.025;
          waveColor = "rgba(255, 85, 0, 0.6)"; // Bright orange glow
          waveGlow = "rgba(255, 85, 0, 0.3)";
        } else if (userVolume > 0.02) {
          // User speaking: high frequency active microphone spikes
          targetAmplitude = 15 + userVolume * 70;
          targetFrequency = 0.04 + userVolume * 0.05;
          waveColor = "rgba(16, 185, 129, 0.7)"; // Emerald Green
          waveGlow = "rgba(16, 185, 129, 0.4)";
        } else {
          // Connected but silent: soft breathing waves
          targetAmplitude = 6 + Math.sin(phaseRef.current * 0.4) * 3;
          targetFrequency = 0.01;
          waveColor = "rgba(255, 255, 255, 0.15)";
          waveGlow = "rgba(255, 255, 255, 0.02)";
        }
      } else {
        // Idle/disconnected state: dead flat line
        targetAmplitude = 2;
        targetFrequency = 0.005;
        waveColor = "rgba(255, 255, 255, 0.08)";
        waveGlow = "rgba(255, 255, 255, 0)";
      }

      // Draw 3 layers of overlapping sine/bezier waves
      const wavesCount = 3;
      for (let i = 0; i < wavesCount; i++) {
        ctx.beginPath();
        const offset = i * (Math.PI / 2); // Shift phase between layers
        const amplitude = targetAmplitude * (1 - i * 0.25);
        const frequency = targetFrequency * (1 + i * 0.2);

        ctx.strokeStyle = waveColor;
        ctx.lineWidth = i === 0 ? 2 : 1.5;
        ctx.shadowBlur = i === 0 ? 12 : 0;
        ctx.shadowColor = waveGlow;

        for (let x = 0; x < width; x++) {
          // Custom wave equation with fading envelope at edges
          const envelope = Math.sin((x / width) * Math.PI); // Fades waves to 0 at screen borders
          const y =
            height / 2 +
            Math.sin(x * frequency + phaseRef.current + offset) *
              amplitude *
              envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAiSpeaking, userVolume, isConnected, isRinging]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
