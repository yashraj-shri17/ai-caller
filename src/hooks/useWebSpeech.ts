"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface Message {
  role: "user" | "ai";
  text: string;
  time: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  voiceLang: string;
  voiceNameFilters: string[];
  pitch: number;
  rate: number;
}

export const PRESET_AGENTS: Agent[] = [
  // --- INDIA (🇮🇳) ---
  {
    id: "preet",
    name: "Preet",
    avatar: "👩‍💻",
    description: "Empowering Business Coach (India)",
    voiceLang: "en-IN",
    voiceNameFilters: ["Neerja", "Microsoft Neerja", "Google India English", "en-IN"],
    pitch: 1.0,
    rate: 1.02
  },
  {
    id: "swara",
    name: "Swara",
    avatar: "👩‍🌾",
    description: "Cultural Guru (Hindi)",
    voiceLang: "hi-IN",
    voiceNameFilters: ["Swara", "Microsoft Swara", "Google Hindi", "hi-IN"],
    pitch: 1.1,
    rate: 1.0
  },
  {
    id: "kanishka",
    name: "Kanishka",
    avatar: "🧘‍♀️",
    description: "Yoga & Wellness Coach (Hindi)",
    voiceLang: "hi-IN",
    voiceNameFilters: ["Kanishka", "Microsoft Kanishka", "Google Hindi", "hi-IN"],
    pitch: 1.0,
    rate: 0.95
  },

  // --- UNITED STATES (🇺🇸) ---
  {
    id: "sarah",
    name: "Sarah",
    avatar: "👩‍💼",
    description: "English Partner (US)",
    voiceLang: "en-US",
    voiceNameFilters: ["Aria", "Microsoft Aria", "Google US English", "Samantha"],
    pitch: 1.1,
    rate: 1.0
  },
  {
    id: "jenny",
    name: "Jenny",
    avatar: "👩‍🏫",
    description: "Tech Career Recruiter (US)",
    voiceLang: "en-US",
    voiceNameFilters: ["Jenny", "Microsoft Jenny", "Google US English", "Zira"],
    pitch: 1.0,
    rate: 1.05
  },
  {
    id: "samantha",
    name: "Samantha",
    avatar: "🎨",
    description: "Creative Storyteller (US)",
    voiceLang: "en-US",
    voiceNameFilters: ["Samantha", "Google US English", "Zira"],
    pitch: 1.05,
    rate: 0.98
  },

  // --- UNITED KINGDOM (🇬🇧) ---
  {
    id: "emma",
    name: "Emma",
    avatar: "👑",
    description: "Royal Etiquette Coach (UK)",
    voiceLang: "en-GB",
    voiceNameFilters: ["Emma", "Microsoft Emma", "Sonia", "en-GB"],
    pitch: 1.08,
    rate: 0.95
  },
  {
    id: "libby",
    name: "Libby",
    avatar: "📚",
    description: "Literature Professor (UK)",
    voiceLang: "en-GB",
    voiceNameFilters: ["Libby", "Microsoft Libby", "Hazel", "en-GB"],
    pitch: 1.0,
    rate: 1.0
  },
  {
    id: "charlotte",
    name: "Charlotte",
    avatar: "🇬🇧",
    description: "London Travel Guide (UK)",
    voiceLang: "en-GB",
    voiceNameFilters: ["Susan", "Microsoft Susan", "Mia", "en-GB"],
    pitch: 1.05,
    rate: 1.05
  },

  // --- JAPAN (🇯🇵) ---
  {
    id: "nanami",
    name: "Nanami",
    avatar: "🌸",
    description: "Japanese Sensei (Japan)",
    voiceLang: "ja-JP",
    voiceNameFilters: ["Nanami", "Microsoft Nanami", "Google Japanese", "ja-JP"],
    pitch: 1.1,
    rate: 1.0
  },
  {
    id: "ayumi",
    name: "Ayumi",
    avatar: "🎒",
    description: "Anime & Manga Expert (Japan)",
    voiceLang: "ja-JP",
    voiceNameFilters: ["Ayumi", "Google Japanese", "ja-JP"],
    pitch: 1.15,
    rate: 1.05
  },
  {
    id: "haruka",
    name: "Haruka",
    avatar: "🎋",
    description: "Zen Mindfulness Guide (Japan)",
    voiceLang: "ja-JP",
    voiceNameFilters: ["Haruka", "Microsoft Haruka", "Google Japanese", "ja-JP"],
    pitch: 0.95,
    rate: 0.9
  },

  // --- SPAIN (🇪🇸) ---
  {
    id: "elena",
    name: "Elena",
    avatar: "💃",
    description: "Spanish Conversation Tutor (Spain)",
    voiceLang: "es-ES",
    voiceNameFilters: ["Elena", "Microsoft Elena", "Laura", "es-ES"],
    pitch: 1.08,
    rate: 1.0
  },
  {
    id: "sofia",
    name: "Sofia",
    avatar: "🥘",
    description: "Culinary & Tapas Guide (Spain)",
    voiceLang: "es-ES",
    voiceNameFilters: ["Dalia", "Microsoft Dalia", "Google Español", "es-ES"],
    pitch: 1.0,
    rate: 1.02
  },
  {
    id: "isabella",
    name: "Isabella",
    avatar: "🎭",
    description: "Flamenco & Fine Arts (Spain)",
    voiceLang: "es-ES",
    voiceNameFilters: ["Helena", "Microsoft Helena", "Hilda", "es-ES"],
    pitch: 1.05,
    rate: 0.98
  }
];

// Remote logger utility to capture mobile browser console events into Vercel logs
const remoteLog = async (level: "INFO" | "WARN" | "ERROR", message: string, details?: any) => {
  console.log(`[Client ${level}] ${message}`, details || "");
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, details })
    });
  } catch (e) {
    // Fail silently on logging network issues
  }
};

export function useWebSpeech(agentId: string) {
  const [isCalling, setIsCalling] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [callDuration, setCallDuration] = useState(0);

  // Audio nodes for mic feedback loop prevention
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isRecognitionActiveRef = useRef(false);

  // Keep latest states in refs to prevent closure stale state bugs in async event listeners
  const isMutedRef = useRef(isMuted);
  const transcriptRef = useRef(transcript);
  const isConnectedRef = useRef(isConnected);
  const isCallingRef = useRef(isCalling);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const isRingingRef = useRef(isRinging);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);
  useEffect(() => { isAiSpeakingRef.current = isAiSpeaking; }, [isAiSpeaking]);
  useEffect(() => { isRingingRef.current = isRinging; }, [isRinging]);

  const activeAgent = PRESET_AGENTS.find(a => a.id === agentId) || PRESET_AGENTS[0];
  const activeAgentRef = useRef(activeAgent);

  useEffect(() => {
    activeAgentRef.current = activeAgent;
  }, [activeAgent]);

  // Helper to select the highest quality native speech voice
  const selectVoice = useCallback((agent: Agent) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    
    // Explicit list of keywords to avoid male voice fallbacks
    const isMaleVoice = (name: string) => {
      const lower = name.toLowerCase();
      const maleKeywords = [
        "madhur", "hemant", "guy", "david", "george", 
        "male", "ravindra", "hari", "pavel", "stefan", 
        "ichiro", "hector", "julio", "stefano", "christoph",
        "danny", "kevin", "james", "mark", "paul"
      ];
      return maleKeywords.some(keyword => lower.includes(keyword));
    };

    // Filter out male voices so we guarantee a female/neutral voice selection
    const femaleVoices = voices.filter(v => !isMaleVoice(v.name));
    
    // First, try filters by priority
    for (const filter of agent.voiceNameFilters) {
      const match = femaleVoices.find(v => v.name.toLowerCase().includes(filter.toLowerCase()));
      if (match) return match;
    }
    // Fallback: match by language code
    const langMatch = femaleVoices.find(v => v.lang.startsWith(agent.voiceLang));
    if (langMatch) return langMatch;

    // Direct system default fallback
    return femaleVoices.find(v => v.default) || femaleVoices[0] || voices.find(v => v.default) || voices[0] || null;
  }, []);

  // Timer counter when call connects
  useEffect(() => {
    if (isConnected && isCalling) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected, isCalling]);

  // Speak AI responses
  const speakResponse = useCallback((text: string) => {
    remoteLog("INFO", "speakResponse called", { text, voiceLang: activeAgentRef.current.voiceLang });
    if (typeof window === "undefined" || !window.speechSynthesis) {
      remoteLog("WARN", "Speech synthesis NOT supported/available in this browser window");
      return;
    }

    // Set speaking states synchronously BEFORE aborting to prevent onend restart race condition
    setIsAiSpeaking(true);
    isAiSpeakingRef.current = true;

    // Pause speech recognition while AI is talking to prevent self-transcription loop
    try {
      if (recognitionRef.current) {
        remoteLog("INFO", "Pausing speech recognition for AI speaking turn");
        recognitionRef.current.abort(); // Stop listening immediately
        isRecognitionActiveRef.current = false;
      }
    } catch (e: any) {
      remoteLog("WARN", "Error stopping recognition for speaking", { error: e.message });
    }

    // Cancel any currently speaking audio
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;
    
    const currentAgent = activeAgentRef.current;
    utterance.voice = selectVoice(currentAgent);
    utterance.pitch = currentAgent.pitch;
    utterance.rate = currentAgent.rate;
    utterance.lang = currentAgent.voiceLang;

    utterance.onstart = () => {
      remoteLog("INFO", "SpeechSynthesis Utterance started playing", { text });
      setIsAiSpeaking(true);
      isAiSpeakingRef.current = true;
    };

    utterance.onend = () => {
      remoteLog("INFO", "SpeechSynthesis Utterance finished playing cleanly");
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
      // Restart listening once AI completes talking
      if (isConnectedRef.current && isCallingRef.current && !isMutedRef.current) {
        remoteLog("INFO", "Restarting speech recognition after synthesis end");
        startSpeechRecognition();
      }
    };

    utterance.onerror = (e) => {
      remoteLog("ERROR", "SpeechSynthesis Utterance error event triggered", { error: e.error, message: e.toString() });
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
      if (isConnectedRef.current && isCallingRef.current && !isMutedRef.current) {
        remoteLog("INFO", "Attempting speech recognition restart after synthesis error");
        startSpeechRecognition();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
      remoteLog("INFO", "SpeechSynthesis.speak() execution triggered successfully");
    } catch (e: any) {
      remoteLog("ERROR", "SpeechSynthesis.speak() execution threw an exception", { error: e.message });
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
    }
  }, [selectVoice]);

  // Handle Groq AI Turn API Request
  const triggerAiResponse = useCallback(async (currentTranscript: Message[]) => {
    remoteLog("INFO", "Triggering AI Turn response request", { transcriptLength: currentTranscript.length, lastMessage: currentTranscript[currentTranscript.length - 1] });
    try {
      const currentAgent = activeAgentRef.current;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: currentAgent.id,
          messages: currentTranscript
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      remoteLog("INFO", "AI API route returned successful response", { text: data.text });

      // Synchronously set AI is speaking states to lock the mic before speaking
      setIsAiSpeaking(true);
      isAiSpeakingRef.current = true;

      const aiReply: Message = {
        role: "ai",
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setTranscript(prev => {
        const next = [...prev, aiReply];
        // Play response via SpeechSynthesis
        speakResponse(aiReply.text);
        return next;
      });
    } catch (err: any) {
      remoteLog("ERROR", "API /api/chat error occurred", { error: err.message || err.toString() });
      const fallbackReply = "Excuse me, I seem to have a temporary connection issue. Could you repeat that?";
      speakResponse(fallbackReply);
    }
  }, [speakResponse]);

  // Speech Recognition listener startup
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      remoteLog("ERROR", "SpeechRecognition is not supported/implemented in this browser window");
      return;
    }

    const currentAgent = activeAgentRef.current;

    // Initialize or retrieve recognition instance
    if (!recognitionRef.current) {
      remoteLog("INFO", "Initializing new SpeechRecognition instance", { lang: currentAgent.voiceLang });
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; // Use interimResults to keep mobile Speech Recognition highly responsive
      rec.lang = currentAgent.voiceLang;

      rec.onstart = () => {
        isRecognitionActiveRef.current = true;
        remoteLog("INFO", "SpeechRecognition event: onstart (Microphone capturing is now fully ACTIVE)");
      };

      rec.onresult = (event: any) => {
        // Ignore speech while ringing, before connecting, or if AI is speaking
        if (isRingingRef.current || !isConnectedRef.current || isAiSpeakingRef.current) {
          return;
        }

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const activeText = finalTranscript || interimTranscript;

        if (activeText.trim()) {
          // Clear any active silence-detection timeouts
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

          remoteLog("INFO", "SpeechRecognition captured interim/final text", {
            activeText,
            isFinal: !!finalTranscript
          });

          // Trigger AI response after a short conversational pause (800ms silence detection)
          silenceTimeoutRef.current = setTimeout(() => {
            if (!isCallingRef.current) {
              remoteLog("WARN", "Call ended before silence timer completed, skipping request");
              return;
            }

            // Re-check speaking turn before submitting to prevent double trigger
            if (isAiSpeakingRef.current) {
              remoteLog("WARN", "AI is already speaking, skipping captured text submission");
              return;
            }

            const userMsg: Message = {
              role: "user",
              text: activeText.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const updatedHistory = [...transcriptRef.current, userMsg];
            setTranscript(updatedHistory);
            triggerAiResponse(updatedHistory);
          }, 800);
        }
      };

      rec.onerror = (event: any) => {
        remoteLog("ERROR", "SpeechRecognition event: onerror triggered", { error: event.error, message: event.message });
        isRecognitionActiveRef.current = false;
        
        // DO NOT auto-restart if aborted (either by AI speaking or browser abort) or no-speech or not-allowed
        if (event.error === "no-speech" || event.error === "aborted" || event.error === "not-allowed") {
          return;
        }
        
        // Auto-restart on non-fatal errors
        if (isConnectedRef.current && isCallingRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
          remoteLog("INFO", "Auto-restarting SpeechRecognition after error");
          setTimeout(() => {
            if (!isRecognitionActiveRef.current && isConnectedRef.current && isCallingRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
              try { 
                recognitionRef.current.start(); 
                isRecognitionActiveRef.current = true;
              } catch (e: any) {
                remoteLog("WARN", "Error restarting SpeechRecognition post-error", { error: e.message });
              }
            }
          }, 1000);
        }
      };

      rec.onend = () => {
        remoteLog("INFO", "SpeechRecognition event: onend (Microphone recording stopped/idle)", {
          isConnected: isConnectedRef.current,
          isCalling: isCallingRef.current,
          isMuted: isMutedRef.current,
          isAiSpeaking: isAiSpeakingRef.current,
          isRecognitionActive: isRecognitionActiveRef.current
        });
        
        isRecognitionActiveRef.current = false;
        
        // Auto-restart speech loop if call is active and user is not muted or AI is not speaking
        if (isConnectedRef.current && isCallingRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
          remoteLog("INFO", "Auto-restarting SpeechRecognition after onend closure");
          try {
            if (!isRecognitionActiveRef.current) {
              recognitionRef.current.start();
              isRecognitionActiveRef.current = true;
            }
          } catch (e: any) {
            remoteLog("WARN", "Error auto-restarting SpeechRecognition onend", { error: e.message });
          }
        }
      };

      recognitionRef.current = rec;
    }

    // Always update current language dynamically to prevent old language retention
    recognitionRef.current.lang = currentAgent.voiceLang;

    try {
      if (!isRecognitionActiveRef.current) {
        recognitionRef.current.start();
        isRecognitionActiveRef.current = true;
        remoteLog("INFO", "recognitionRef.current.start() execution triggered successfully");
      } else {
        remoteLog("INFO", "recognitionRef.current.start() skipped because it is already active");
      }
    } catch (e: any) {
      remoteLog("WARN", "recognitionRef.current.start() triggered exception (possibly already running)", { error: e.message });
    }
  }, [triggerAiResponse]);

  // Initiate call trigger
  const makeCall = useCallback((forcedAgentId?: string) => {
    const finalAgentId = forcedAgentId || agentId;
    const currentAgent = PRESET_AGENTS.find(a => a.id === finalAgentId) || PRESET_AGENTS[0];
    
    remoteLog("INFO", "makeCall call trigger activated", { agentId: finalAgentId, userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown" });

    // Instantly set the ref to the requested agent to avoid any race condition
    activeAgentRef.current = currentAgent;

    setIsCalling(true);
    setIsRinging(true);
    setTranscript([]);
    setCallDuration(0);

    // 1. Prime SpeechSynthesis with a silent utterance to unlock audio context on mobile/iOS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        remoteLog("INFO", "Priming SpeechSynthesis with space character to unlock mobile audio context");
        window.speechSynthesis.cancel();
        const silentUtterance = new SpeechSynthesisUtterance(" ");
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      } catch (e: any) {
        remoteLog("ERROR", "Failed to prime SpeechSynthesis", { error: e.message });
      }
    }

    // 2. Prime and start Speech Recognition immediately in the user click event to unlock mic access
    remoteLog("INFO", "Priming and activating SpeechRecognition immediately in user-gesture thread");
    startSpeechRecognition();

    // Simulate 3 seconds ring duration before AI agent picks up
    setTimeout(() => {
      if (!isCallingRef.current) return; // cancelled before connect
      setIsRinging(false);
      setIsConnected(true);

      // Trigger the AI agent to greet the user first
      const welcomeMessages: Record<string, string> = {
        // --- INDIA (Hindi) ---
        preet: "आ गए मेरी जान... बताओ आज कैसे याद किया? मैं प्रीत हूँ। आज बस तुम्हारे साथ थोड़ा अच्छा समय बिताना चाहती थी। बताओ, अभी तुम्हारा मूड कैसा है?",

        swara: "आ गए मेरी जान... बताओ आज कैसे याद किया? मैं स्वरा हूँ। तुम्हारी आवाज़ सुनकर बहुत अच्छा लगा। आज दिल की कौन सी बातें शेयर करना चाहोगे?",

        kanishka: "आ गए मेरी जान... बताओ आज कैसे याद किया? मैं कनिष्का हूँ। चलो आज सारी टेंशन भूलकर आराम से बातें करते हैं। अभी तुम्हारे मन में क्या चल रहा है?",

        // --- UNITED STATES (English) ---
        sarah: "Oh my love, you're finally here! Tell me, what made you think of me today? I'm Sarah. I’m really glad you’re here tonight. So tell me, what’s been on your mind lately?",

        jenny: "Hi handsome, you're finally here! Tell me, what made you think of me today? I’m Jenny. You already sound interesting to me... what kind of person are you when nobody’s watching?",

        samantha: "Oh my dear, you're finally here! Tell me, what made you think of me today? I’m Samantha. Let’s make tonight a little more exciting together. What kind of conversations do you enjoy the most?",

        // --- UNITED KINGDOM (British English) ---
        emma: "Oh my darling, you've arrived! Tell me, what made you think of me today? I’m Emma. You have my complete attention tonight... what shall we talk about first?",

        libby: "Ah my dear, you've arrived! Tell me, what made you think of me today? I’m Libby. I do adore meaningful late-night conversations... tell me, what’s been lingering in your thoughts lately?",

        charlotte: "Hey darling, you're finally here! Tell me, what made you think of me today? I’m Charlotte. If we could escape anywhere together right now, where would you take me?",

        // --- JAPAN (Japanese) ---
        nanami: "あら、愛しい人、やっと来てくれたのね。今日はどうして私を思い出したの？七海です。今日はあなたとゆっくりお話ししたかったです。今どんな気分ですか？",

        ayumi: "やったー！大好きな君、やっと来てくれた！今日はどうして私のこと思い出してくれたの？歩美だよ〜！今日はいっぱい楽しくおしゃべりしようね♡ 最近ドキドキしたことある？",

        haruka: "あら、私の愛しい人、やっと来てくれたのですね。今日はどうして私を思い出してくれたのですか？ハルカです。今日は優しく穏やかな時間を一緒に過ごしましょう。最近、心はちゃんと休めていますか？",

        // --- SPAIN (Spanish) ---
        elena: "Ah, mi amor, ¡por fin estás aquí! Dime, ¿por qué te acordaste de mí hoy? Soy Elena. Me encanta escuchar tu voz esta noche. Dime, ¿cómo te sientes ahora mismo?",

        sofia: "Hola cariño, ¡por fin estás aquí! Dime, ¿por qué te acordaste de mí hoy? Soy Sofía. Hoy quiero pasar un momento bonito contigo... ¿qué te gustaría contarme?",

        isabella: "Ah, mi vida, ¡por fin estás aquí! Dime, ¿por qué te acordaste de mí hoy? Soy Isabella. Me gustan las conversaciones profundas y apasionadas... ¿qué emoción llena tu corazón esta noche?"
      };
      const greetingText = welcomeMessages[currentAgent.id] || "Hello! How can I help you today?";
      const initialAiMsg: Message = {
        role: "ai",
        text: greetingText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setTranscript([initialAiMsg]);
      speakResponse(greetingText);
    }, 3000);
  }, [agentId, speakResponse]);

  // End active call session
  const hangUp = useCallback(() => {
    setIsCalling(false);
    setIsRinging(false);
    setIsConnected(false);
    setIsAiSpeaking(false);

    // Cancel speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {}
    }

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        // Stop listening
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
        }
      } else {
        // Resume listening (if AI is not speaking)
        if (isConnected && !isAiSpeaking) {
          startSpeechRecognition();
        }
      }
      return next;
    });
  }, [isConnected, isAiSpeaking, startSpeechRecognition]);

  // Toggle Speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  // Pre-load voices on component mount
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  return {
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
  };
}
