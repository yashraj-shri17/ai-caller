"use client";

import { useEffect, useRef, useState } from "react";

export function useAudioAnalyser(isActive: boolean, isMuted: boolean) {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    // ANDROID FIX: SpeechRecognition already holds the mic on mobile.
    // Opening a second getUserMedia stream simultaneously causes Android Chrome to
    // silently destabilize/kill the SpeechRecognition session.
    // Skip audio analyser entirely on mobile — WaveVisualizer will animate from isAiSpeaking state.
    const isMobile = typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isMobile || !isActive || isMuted) {
      cleanup();
      setVolume(0);
      return;
    }

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // Smaller size for simple volume levels
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function updateVolume() {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate simple average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Normalize volume level between 0 and 1
          setVolume(average / 128);

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }

        updateVolume();
      } catch (err) {
        console.warn("Failed to initialize audio analyser (mic permission might be denied):", err);
        setVolume(0);
      }
    }

    initAudio();

    return () => {
      cleanup();
    };
  }, [isActive, isMuted]);

  function cleanup() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) {}
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        try { audioContextRef.current.close(); } catch (e) {}
      }
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }

    analyserRef.current = null;
  }

  return volume;
}
