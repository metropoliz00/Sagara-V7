import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X, Play, MessageSquare, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextToSpeechAccessibilityProps {
  pathname?: string;
}

export const TextToSpeechAccessibility: React.FC<TextToSpeechAccessibilityProps> = ({ pathname }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sagara_tts_enabled') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sagara_tts_rate');
      return saved ? parseFloat(saved) : 1.0;
    } catch (e) {
      return 1.0;
    }
  });
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sagara_tts_volume');
      return saved ? parseFloat(saved) : 1.0;
    } catch (e) {
      return 1.0;
    }
  });
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hoveredText, setHoveredText] = useState<string>('');

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Prioritize Indonesian, then English
        const idVoice = availableVoices.find(v => v.lang.startsWith('id') || v.lang.includes('indonesian'));
        if (idVoice) {
          setSelectedVoiceName(prev => prev || idVoice.name);
        } else {
          const enVoice = availableVoices.find(v => v.lang.startsWith('en'));
          if (enVoice) {
            setSelectedVoiceName(prev => prev || enVoice.name);
          } else if (availableVoices.length > 0) {
            setSelectedVoiceName(prev => prev || availableVoices[0].name);
          }
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('sagara_tts_enabled', String(isEnabled));
    } catch (e) {}
  }, [isEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('sagara_tts_rate', String(rate));
    } catch (e) {}
  }, [rate]);

  useEffect(() => {
    try {
      localStorage.setItem('sagara_tts_volume', String(volume));
    } catch (e) {}
  }, [volume]);

  // Handle global hover logic
  useEffect(() => {
    if (!isEnabled) {
      // Clear highlight if disabled
      if (highlightedElementRef.current) {
        highlightedElementRef.current.style.outline = '';
        highlightedElementRef.current.style.outlineOffset = '';
        highlightedElementRef.current.style.boxShadow = '';
        highlightedElementRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const isTextElement = (el: HTMLElement) => {
      const tags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'BUTTON', 'A', 'LABEL', 'LI', 'TD', 'TH', 'B', 'STRONG', 'EM', 'I'];
      if (tags.includes(el.tagName)) return true;
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).placeholder) return true;
      
      // If it's a small block with direct text and no child elements (or very simple structure)
      if (el.tagName === 'DIV' && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        return true;
      }
      return false;
    };

    const getElementText = (el: HTMLElement): string => {
      if (el.tagName === 'INPUT') {
        return (el as HTMLInputElement).placeholder || '';
      }
      return (el.innerText || el.textContent || '').trim();
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find nearest parent text element if we hovered on a nested leaf
      let textEl: HTMLElement | null = null;
      if (isTextElement(target)) {
        textEl = target;
      } else {
        textEl = target.closest('button, a, p, h1, h2, h3, h4, h5, h6, li, td, th, label');
      }

      if (!textEl) {
        // If mouse moved away, stop speaking and clear highlight after a tiny delay
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        if (highlightedElementRef.current) {
          highlightedElementRef.current.style.outline = '';
          highlightedElementRef.current.style.outlineOffset = '';
          highlightedElementRef.current.style.boxShadow = '';
          highlightedElementRef.current = null;
        }
        return;
      }

      const textToSpeak = getElementText(textEl);
      if (!textToSpeak || textToSpeak.length < 1) return;

      // Skip repeating the same element
      if (highlightedElementRef.current === textEl) return;

      // Clear previous highlight
      if (highlightedElementRef.current && highlightedElementRef.current !== textEl) {
        highlightedElementRef.current.style.outline = '';
        highlightedElementRef.current.style.outlineOffset = '';
        highlightedElementRef.current.style.boxShadow = '';
      }

      // Set new highlighted element
      highlightedElementRef.current = textEl;
      
      // Apply visual highlight matching ocean-blue brand color
      textEl.style.outline = '2px solid #5AB2FF';
      textEl.style.outlineOffset = '2px';
      textEl.style.boxShadow = '0 0 10px rgba(90, 178, 255, 0.45)';
      textEl.style.transition = 'all 0.15s ease-in-out';

      setHoveredText(textToSpeak);

      // Debounce speaking so dragging mouse over screen doesn't cause chaotic sounds
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      
      hoverTimerRef.current = setTimeout(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = rate;
          utterance.volume = volume;

          // Assign selected voice
          if (selectedVoiceName) {
            const voice = voices.find(v => v.name === selectedVoiceName);
            if (voice) utterance.voice = voice;
          } else {
            const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('indonesian'));
            if (idVoice) utterance.voice = idVoice;
          }

          window.speechSynthesis.speak(utterance);
        }
      }, 250); // 250ms debounce hover delay
    };

    const handleMouseOut = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!relatedTarget || (highlightedElementRef.current && !highlightedElementRef.current.contains(relatedTarget))) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        if (highlightedElementRef.current) {
          highlightedElementRef.current.style.outline = '';
          highlightedElementRef.current.style.outlineOffset = '';
          highlightedElementRef.current.style.boxShadow = '';
          highlightedElementRef.current = null;
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (highlightedElementRef.current) {
        highlightedElementRef.current.style.outline = '';
        highlightedElementRef.current.style.outlineOffset = '';
        highlightedElementRef.current.style.boxShadow = '';
      }
    };
  }, [isEnabled, rate, volume, selectedVoiceName, voices]);

  // Clean up speaking on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const testSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testUtterance = new SpeechSynthesisUtterance("Fitur pembaca teks aktif. Dekatkan kursor Anda pada tulisan di layar untuk mendengar suara.");
      testUtterance.rate = rate;
      testUtterance.volume = volume;
      testUtterance.lang = 'id-ID';

      if (selectedVoiceName) {
        const voice = voices.find(v => v.name === selectedVoiceName);
        if (voice) testUtterance.voice = voice;
      } else {
        const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('indonesian'));
        if (idVoice) testUtterance.voice = idVoice;
      }

      window.speechSynthesis.speak(testUtterance);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const filteredVoices = voices.filter(v => 
    v.lang.startsWith('id') || v.lang.startsWith('en') || v.lang.includes('indonesian')
  );

  const positionClasses = "bottom-[96px] md:bottom-[40px] left-6";

  return (
    <div id="tts-accessibility-root" className={`fixed ${positionClasses} w-14 h-14 z-[100] no-print`}>
      <div className="relative w-full h-full">
        
        {/* Expanded Settings Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="absolute bottom-16 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-[#CAF4FF] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 size={18} className="animate-pulse" />
                  <span className="font-bold text-sm tracking-wide">Aksesibilitas Suara (TTS)</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/15 p-1 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                
                {/* On / Off Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-[#CAF4FF]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Fitur Hover Suara</span>
                    <span className="text-[10px] text-slate-400">Dekatkan mouse ke teks</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isEnabled;
                      setIsEnabled(next);
                      if (!next) handleStop();
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-[#5AB2FF]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Hover text preview */}
                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                      <div className="text-[10px] font-bold text-[#5AB2FF] uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <MessageSquare size={10} />
                        <span>Teks Terdeteksi:</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        {hoveredText || "Gerakkan mouse di atas tulisan untuk membaca..."}
                      </p>
                    </div>

                    {/* Speed Controls */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Kecepatan Suara</span>
                        <span className="text-[#5AB2FF]">{rate.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#5AB2FF]"
                      />
                    </div>

                    {/* Volume Controls */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Volume</span>
                        <span className="text-[#5AB2FF]">{Math.round(volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#5AB2FF]"
                      />
                    </div>

                    {/* Voice selector */}
                    {filteredVoices.length > 0 && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pilih Pengisi Suara</label>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => setSelectedVoiceName(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#5AB2FF] text-slate-700 font-medium"
                        >
                          {filteredVoices.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Test Speech Button */}
                    <div className="flex space-x-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={testSpeech}
                        className="flex-1 py-2 bg-blue-50 text-[#5AB2FF] hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                      >
                        <Play size={14} />
                        <span>Coba Suara</span>
                      </button>
                      <button
                        onClick={handleStop}
                        className="py-2 px-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
                        title="Hentikan suara"
                      >
                        Stop
                      </button>
                    </div>

                  </motion.div>
                )}

                {/* Information Notice when WebSpeech is not supported */}
                {typeof window !== 'undefined' && !('speechSynthesis' in window) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-amber-800">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <span className="text-[10px] leading-relaxed">Browser Anda tidak mendukung Web Speech API. Silakan gunakan Google Chrome atau Microsoft Edge terbaru.</span>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute inset-0 flex items-center justify-center rounded-full shadow-lg border border-white hover:scale-105 active:scale-95 transition-all text-white h-14 w-14 ${
            isEnabled 
              ? 'bg-gradient-to-r from-[#5AB2FF] to-[#A0DEFF] shadow-[#5AB2FF]/30' 
              : 'bg-slate-500 shadow-slate-500/20'
          }`}
          title="Aksesibilitas Pembaca Teks (TTS)"
        >
          {isEnabled ? (
            <Volume2 size={24} className="animate-bounce" />
          ) : (
            <VolumeX size={24} />
          )}
        </button>

      </div>
    </div>
  );
};
