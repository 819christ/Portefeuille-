// src/components/AIAgent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { playSfx } from '../utils/sfx';
import { fetchAIResponse } from '../services/ai';
import db from '../services/db';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const AIAgent = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [input, setInput] = useState('');
  const [voiceBtnState, setVoiceBtnState] = useState({});
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('agentLocalChat') || '[]'); }
    catch { return []; }
  });
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const scrollRef = useRef(null);

  // Persistence
  useEffect(() => {
    sessionStorage.setItem('agentLocalChat', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // STT Init for Web
  const initSTT = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return null;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setIsSpeaking(false);
      setIsThinking(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      if (e.results[0].isFinal) {
        handleSendMessage(transcript);
      }
    };

    recognition.onerror = (e) => {
      console.warn("Minichat STT Error:", e.error);
      setIsListening(false);
      isListeningRef.current = false;
      
      const el = document.createElement('div');
      el.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full text-xs font-bold z-[700] shadow-2xl';
      if (e.error === 'not-allowed') el.innerText = "🎙️ Micro refusé (Utilisez HTTPS).";
      else if (e.error === 'network') el.innerText = "🎙️ Erreur réseau (Le STT nécessite HTTPS sur mobile).";
      else if (e.error !== 'no-speech') el.innerText = `🎙️ Erreur: ${e.error}`;
      else return; // Ignore no-speech

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    };

    return recognition;
  };

  const toggleListening = async () => {
    playSfx('click');

    if (Capacitor.isNativePlatform()) {
      if (isListening) {
        SpeechRecognition.removeAllListeners();
        SpeechRecognition.stop().catch(() => {});
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      try {
        const { permission } = await SpeechRecognition.hasPermission();
        if (!permission) {
          const req = await SpeechRecognition.requestPermission();
          if (!req.permission) {
            const el = document.createElement('div');
            el.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full text-xs font-bold z-[700] shadow-2xl';
            el.innerText = "🎙️ Micro natif refusé.";
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3000);
            return;
          }
        }

        setIsListening(true);
        isListeningRef.current = true;
        setIsSpeaking(false);
        setIsThinking(false);

        SpeechRecognition.removeAllListeners();
        SpeechRecognition.addListener("partialResults", (data) => {
          if (data.matches && data.matches.length > 0) {
            const t = data.matches[0].trim();
            if (t) {
               handleSendMessage(t);
               SpeechRecognition.stop();
               setIsListening(false);
               isListeningRef.current = false;
            }
          }
        });

        await SpeechRecognition.start({
          language: "fr-FR",
          maxResults: 1,
          prompt: "Parlez...",
          partialResults: true,
          popup: false,
        });
      } catch (e) {
        console.warn("Native STT Error:", e);
        setIsListening(false);
        isListeningRef.current = false;
      }
      return;
    }

    // Web logic
    if (!recognitionRef.current) {
      recognitionRef.current = initSTT();
    }
    
    if (!recognitionRef.current) {
      const el = document.createElement('div');
      el.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full text-xs font-bold z-[700] shadow-2xl';
      el.innerText = "🎙️ Non supporté par le navigateur.";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      isListeningRef.current = false;
    } else {
      try {
        window.speechSynthesis.cancel();
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (e) {
        console.warn(e);
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  const handleSendMessage = async (text = input) => {
    const messageText = text.trim();
    if (!messageText || isThinking) return;

    playSfx('send');
    const userMsg = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetchAIResponse([...messages, userMsg].map(m => ({
        role: m.role,
        content: m.text
      })));
      
      const aiMsg = { role: 'assistant', text: response, id: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      speakText(response, aiMsg.id);
      db.saveChat({ ...userMsg, date: Date.now() });
      db.saveChat({ role: 'assistant', text: response, date: Date.now() });

    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Désolé, j'ai rencontré une erreur." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const speakText = (text, msgId) => {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceBtnState(prev => ({ ...prev, [msgId]: 'idle' }));
      return;
    }
    setVoiceBtnState(prev => ({ ...prev, [msgId]: 'loading' }));
    const utterance = new SpeechSynthesisUtterance(text.replace(/\[.+?\]/g, ''));
    utterance.lang = 'fr-FR'; utterance.rate = 1.05;
    const selectedVoiceURI = localStorage.getItem('selected_voice_uri');
    if (selectedVoiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }
    utterance.onstart = () => { setIsSpeaking(true); setVoiceBtnState(prev => ({ ...prev, [msgId]: 'playing' })); };
    utterance.onend = () => { setIsSpeaking(false); setVoiceBtnState(prev => ({ ...prev, [msgId]: 'idle' })); };
    utterance.onerror = () => { setIsSpeaking(false); setVoiceBtnState(prev => ({ ...prev, [msgId]: 'idle' })); };
    setTimeout(() => setVoiceBtnState(prev => prev[msgId] === 'loading' ? { ...prev, [msgId]: 'playing' } : prev), 1000);
    window.speechSynthesis.speak(utterance);
  };

  const handleFabClick = () => {
    toggleListening();
  };

  const handleFabLongPress = () => {
    playSfx('pop');
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onTap={handleFabClick}
            onContextMenu={(e) => {
              e.preventDefault();
              handleFabLongPress();
            }}
            style={{
              position: 'absolute',
              bottom: 'calc(88px + env(safe-area-inset-bottom))',
              left: '20px',
              zIndex: 50,
            }}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-4 border-white
              ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-600'}
              ${isThinking ? 'bg-indigo-500' : ''}
              ${isSpeaking ? 'bg-emerald-500 ring-4 ring-emerald-200' : ''}
              transition-colors duration-300
            `}
          >
            <i className={`fa-solid ${isThinking ? 'fa-rotate animate-spin' : isListening ? 'fa-wave-square' : 'fa-robot'} text-white text-2xl`}></i>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[599]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[70vh] bg-white rounded-t-[40px] shadow-2xl z-[600] flex flex-col overflow-hidden border-t border-gray-100"
            >
              {/* Header */}
              <div className="p-4 bg-emerald-50/50 border-b border-gray-100 flex flex-col items-center gap-2">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-2"></div>
                <div 
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all
                    ${isListening ? 'bg-red-500 ring-8 ring-red-100' : 'bg-emerald-600 ring-8 ring-emerald-50'}
                  `}
                >
                  <i className={`fa-solid ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} text-white text-3xl`}></i>
                </div>
                <h2 className="text-xl font-black text-gray-800">Portefeuille</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm">Assistant Intelligent</span>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide bg-gray-50/30"
              >
                {messages.length === 0 && (
                  <div className="text-center py-10 opacity-50">
                    <i className="fa-solid fa-comments text-4xl mb-3 block"></i>
                    <p className="text-sm font-medium">Posez-moi une question sur vos finances !</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} mb-3`}>
                    {m.role === 'assistant' ? (
                      <div className="assistant-container">
                        <div className="assistant-body chat-bubble relative text-sm">
                          <button
                            onClick={() => speakText(m.text, m.id)}
                            className={`voice-toggle absolute -left-2 -top-2 w-7 h-7 rounded-full text-white flex items-center justify-center transition shadow-md border-2 border-white z-10 cursor-pointer active:scale-90 ${
                              voiceBtnState[m.id] === 'playing' ? 'bg-red-500' :
                              voiceBtnState[m.id] === 'loading' ? 'bg-gray-400' : 'bg-emerald-500'
                            }`}
                          >
                            {voiceBtnState[m.id] === 'playing' ?
                              <i className="fa-solid fa-stop text-[9px]"></i> :
                              voiceBtnState[m.id] === 'loading' ?
                              <i className="fa-solid fa-circle-notch fa-spin text-[9px]"></i> :
                              <i className="fa-solid fa-volume-high text-[9px]"></i>
                            }
                          </button>
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="user-bubble chat-bubble text-sm">
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                {isThinking && (
                  <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl self-start rounded-bl-none animate-pulse text-xs font-bold">
                    En train de réfléchir...
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100 flex gap-3 items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Tapez un message..."
                  className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  rows="1"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isThinking}
                  className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition disabled:opacity-50"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAgent;
