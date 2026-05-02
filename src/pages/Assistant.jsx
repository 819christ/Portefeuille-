// src/pages/Assistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/db';
import { fetchAIResponse } from '../services/ai';
import { playSfx } from '../utils/sfx';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';


const Assistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem('selected_voice_uri'));
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editInputValue, setEditInputValue] = useState('');
  
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const typewriterIntervalRef = useRef(null);

  // Typewriter states
  const [typewriterText, setTypewriterText] = useState({});
  const [typingId, setTypingId] = useState(null);
  const [voiceBtnState, setVoiceBtnState] = useState({}); // idle | loading | playing per msgId
  const isListeningRef = useRef(false); // track conversational mode

  useEffect(() => {
    const load = async () => {
      const hist = await db.getChatHistory();
      setMessages(hist);
      
      initVoices();
      
      if (hist.length === 0) {
        const userName = localStorage.getItem('user_name') || '';
        const aiName = localStorage.getItem('ai_name') || 'Assistant IA';
        let intro = `Bonjour ${userName || ''} ! Je suis ${aiName}. Je suis là pour vous aider à gérer vos finances avec soin et précision.`;
        if (!userName) intro = "Bonjour ! Je suis votre assistant financier. Comment devrais-je vous appeler ?";
        handleAssistantReply(intro, false);
      } else {
        const initialText = {};
        hist.forEach(m => {
          if (m.role === 'assistant') initialText[m.id] = m.text;
        });
        setTypewriterText(initialText);
      }
      
      const plans = await db.getAllPlanifications();
      const today = new Date();
      today.setHours(0,0,0,0);
      const duePlans = plans.filter(p => p.status === 'pending' && new Date(p.nextDueDate).setHours(0,0,0,0) <= today.getTime());
      
      if (duePlans.length > 0 && hist.length > 0) {
        setTimeout(() => {
          const alertMsg = `Dites, j'ai remarqué que vous avez ${duePlans.length} planification(s) qui arrive(nt) à échéance aujourd'hui. Voulez-vous que nous y jetions un coup d'œil ?`;
          handleAssistantReply(alertMsg);
        }, 1500);
      }
    };
    load();

    window.speechSynthesis.onvoiceschanged = () => {
      initVoices();
    };
    
    sessionStorage.setItem('agentContext', JSON.stringify({
      page: 'assistant',
      label: 'Interface de chat'
    }));

    return () => {
      if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
      stopTTS();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, typewriterText]);

  const initVoices = () => {
    let all = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fr'));
    if (all.length === 0) return;
    const onlineVoices = all.filter(v => !v.localService);
    onlineVoices.sort((a, b) => {
        if (a.name.includes('Google') && !b.name.includes('Google')) return -1;
        if (!a.name.includes('Google') && b.name.includes('Google')) return 1;
        if (a.name.includes('Natural') && !b.name.includes('Natural')) return -1;
        if (!a.name.includes('Natural') && b.name.includes('Natural')) return 1;
        return 0;
    });
    const topOnline = onlineVoices.slice(0, 8);
    const offline = all.filter(v => v.localService).slice(0, 3);
    const v = [...topOnline, ...offline];
    setVoices(v);
    if (!selectedVoice && v.length > 0) {
      setSelectedVoice(v[0].voiceURI);
      localStorage.setItem('selected_voice_uri', v[0].voiceURI);
    }
  };

  const handleAssistantReply = async (text, doTypewriter = true) => {
    const aiMsg = { role: 'assistant', text, date: Date.now() };
    const id = await db.saveChat(aiMsg);
    aiMsg.id = id;
    setMessages(prev => [...prev, aiMsg]);
    
    if (doTypewriter) {
      setTypingId(id);
      setTypewriterText(prev => ({ ...prev, [id]: '' }));
      let i = 0;
      const words = text.split(' ');
      if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = setInterval(() => {
        if (i < words.length) {
          setTypewriterText(prev => ({ 
            ...prev, 
            [id]: prev[id] + (i === 0 ? '' : ' ') + words[i] 
          }));
          i++;
        } else {
          clearInterval(typewriterIntervalRef.current);
          setTypingId(null);
        }
      }, 60);
    } else {
      setTypewriterText(prev => ({ ...prev, [id]: text }));
    }

    const cleanText = text.replace(/\[.+?\]/g, "").trim();
    // Auto-play TTS immediately (forced play, not toggle)
    playVoice(cleanText, id);

    const actions = text.match(/\[(.+?)\]/g) || [];
    actions.forEach(act => {
      const full = act.replace('[', '').replace(']', '');
      const parts = full.split(':');
      const cmd = parts[0];
      if (cmd === 'SET_AI_NAME') {
        localStorage.setItem("ai_name", parts[1]);
      } else if (cmd === 'SET_USER_NAME') {
        localStorage.setItem("user_name", parts[1]);
      } else if (cmd === 'ACTION') {
        const actType = parts[1];
        if (actType === 'REDIRECT') {
          let target = '/';
          if (parts[2] === 'HISTORY') target = '/history' + (parts[3] ? `?filter=${parts[3]}` : '');
          else if (parts[2] === 'PLANIFICATIONS') target = '/';
          else if (parts[2] === 'WALLET') target = `/wallet-detail/${parts[3]}`;
          setTimeout(() => navigate(target), 2000);
        } else if (actType === 'CREATE_WALLET') {
          db.createWallet(parts[2], parts[3] || '').then(() => showToast('Portefeuille créé 📁'));
        } else if (actType === 'DELETE_WALLET') {
          db.deleteWallet(parseInt(parts[2])).then(() => showToast('Portefeuille supprimé 🗑️'));
        } else if (actType === 'DEPOSIT' || actType === 'WITHDRAW') {
          const wId = parseInt((parts[2] || '').replace('W', ''));
          const amt = parseInt(parts[3]);
          const type = actType === 'DEPOSIT' ? 'deposit' : 'withdrawal';
          db.addTransaction(wId, amt, type, parts[4] || 'IA').then(() => showToast(actType === 'DEPOSIT' ? 'Dépôt effectué 💰' : 'Retrait effectué 💸'));
        } else if (actType === 'CREATE_PLAN') {
          db.createPlan({ walletId: parseInt((parts[2]||'').replace('W','')), amount: parseFloat(parts[3]), type: parts[4], label: parts[5], description: parts[6] || '', frequency: parts[7] || 'none', dayValue: parseInt(parts[8]) || 0 }).then(() => showToast('Planification créée ✨'));
        } else if (actType === 'DELETE_PLAN') {
          db.deletePlanification(parseInt(parts[2])).then(() => showToast('Planification supprimée 🗑️'));
        }
      }
    });
  };

  const handleSend = async (textToSubmit = input, isResend = false) => {
    if (!textToSubmit.trim() || isThinking) return;

    const apiKey = localStorage.getItem('assistant_api_key');
    if (!apiKey) {
      navigate('/settings');
      showToast('⚙️ Configurez votre clé API dans les Réglages');
      return;
    }

    if (!window.speechSynthesis.speaking) {
      const unlock = new SpeechSynthesisUtterance('');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }

    if (isListeningRef.current) stopSTT();
    
    const userMsg = { role: 'user', text: textToSubmit.trim(), date: Date.now() };
    
    if (!isResend) {
      const id = await db.saveChat(userMsg);
      userMsg.id = id;
      setMessages(prev => [...prev, userMsg]);
      setInput('');
    }
    
    setIsThinking(true);
    playSfx('send');

    try {
      const currentMessages = isResend ? messages : [...messages, userMsg];
      const response = await fetchAIResponse(
        currentMessages.map(m => ({ role: m.role, content: m.text }))
      );
      handleAssistantReply(response);
    } catch (err) {
      handleAssistantReply("Désolé, j'ai eu un problème technique : " + err.message);
    } finally {
      setIsThinking(false);
    }
  };

  const playVoice = (text, msgId) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setVoiceBtnState({}); // clear all others
    
    setVoiceBtnState(prev => ({ ...prev, [msgId]: 'loading' }));
    window.currentUtterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.voiceURI === selectedVoice) || voices[0];
    if (voice) { window.currentUtterance.voice = voice; window.currentUtterance.lang = voice.lang; }
    window.currentUtterance.rate = 1.1;
    
    window.currentUtterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceBtnState(prev => ({ ...prev, [msgId]: 'playing' }));
    };
    window.currentUtterance.onend = () => {
      setIsSpeaking(false);
      setVoiceBtnState(prev => ({ ...prev, [msgId]: 'idle' }));
      if (isListeningRef.current) startSTT();
    };
    window.currentUtterance.onerror = (e) => {
      console.warn("TTS Error:", e);
      setIsSpeaking(false);
      setVoiceBtnState(prev => ({ ...prev, [msgId]: 'idle' }));
    };
    
    setTimeout(() => {
      setVoiceBtnState(prev => prev[msgId] === 'loading' ? { ...prev, [msgId]: 'playing' } : prev);
    }, 1000);
    window.speechSynthesis.speak(window.currentUtterance);
  };

  const toggleSpeak = (text, msgId) => {
    if (window.speechSynthesis.speaking && voiceBtnState[msgId] === 'playing') {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceBtnState(prev => ({ ...prev, [msgId]: 'idle' }));
      if (isListeningRef.current) startSTT();
      return;
    }
    playVoice(text, msgId);
  };

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceBtnState({});
  };

  const startSTT = async () => {
    if (!isListeningRef.current) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { permission } = await SpeechRecognition.hasPermission();
        if (!permission) {
          const req = await SpeechRecognition.requestPermission();
          if (!req.permission) {
            showToast("🎙️ Accès au micro refusé.");
            stopSTT();
            return;
          }
        }

        SpeechRecognition.removeAllListeners();
        SpeechRecognition.addListener("partialResults", (data) => {
          if (data.matches && data.matches.length > 0) {
            const t = data.matches[0].trim();
            if (t) {
               stopTTS();
               handleSend(t);
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

      } catch (err) {
        console.warn("Native STT Error:", err);
        showToast("🎙️ Erreur micro natif.");
        stopSTT();
      }
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast("🎙️ Reconnaissance vocale non supportée par votre navigateur.");
      stopSTT();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'fr-FR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript.trim();
      if (t) { stopTTS(); handleSend(t); }
    };
    rec.onerror = (e) => {
      console.warn("STT Error:", e.error);
      if (e.error === 'not-allowed') showToast("🎙️ Micro refusé (Utilisez HTTPS)");
      else if (e.error === 'network') showToast("🎙️ Erreur STT : HTTPS requis sur mobile");
      else if (e.error !== 'no-speech') showToast(`🎙️ Erreur : ${e.error}`);
      stopSTT();
    };
    rec.onend = () => {
      if (isListeningRef.current && !window.speechSynthesis.speaking) startSTT();
    };
    recognitionRef.current = rec;
    try { 
      rec.start(); 
    } catch(err) {
      console.warn("STT Start Error:", err);
      stopSTT();
    }
  };

  const stopSTT = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (Capacitor.isNativePlatform()) {
      SpeechRecognition.removeAllListeners();
      SpeechRecognition.stop().catch(() => {});
    }
    recognitionRef.current?.stop();
  };

  const testVoice = (uri) => {
    const u = new SpeechSynthesisUtterance("Test de la voix.");
    const v = voices.find(vo => vo.voiceURI === uri);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const showToast = (text) => {
    const el = document.createElement('div');
    el.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full text-xs font-bold z-[300] backdrop-blur-sm shadow-2xl';
    el.innerText = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const regenerateResponse = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAiMsg?.id) await db.deleteChatById(lastAiMsg.id);
    setMessages(prev => {
      const newMsgs = [...prev];
      const idx = newMsgs.findLastIndex(m => m.role === 'assistant');
      if (idx !== -1) newMsgs.splice(idx, 1);
      return newMsgs;
    });
    handleSend(lastUserMsg.text, true);
  };

  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditInputValue(msg.text);
  };

  const saveEdit = async (msg) => {
    const newText = editInputValue.trim();
    if (newText && newText !== msg.text) {
      const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAiMsg?.id) await db.deleteChatById(lastAiMsg.id);
      if (msg.id) await db.updateUserMessageText(msg.id, newText);

      setMessages(prev => {
        const newMsgs = [...prev];
        const aiIdx = newMsgs.findLastIndex(m => m.role === 'assistant');
        if (aiIdx !== -1) newMsgs.splice(aiIdx, 1);
        const userIdx = newMsgs.findIndex(m => m.id === msg.id);
        if (userIdx !== -1) newMsgs[userIdx] = { ...newMsgs[userIdx], text: newText };
        return newMsgs;
      });
      setEditingMsgId(null);
      handleSend(newText, true);
    } else {
      setEditingMsgId(null);
    }
  };

  const aiName = localStorage.getItem('ai_name') || 'Assistant IA';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden font-sans select-none">
        
        <div className="w-full bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-lg flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div onClick={stopTTS} className={`w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 backdrop-blur-sm transition-all duration-300 cursor-pointer ${isSpeaking ? 'speaking-pulse' : ''}`}>
              <i className="fa-solid fa-robot text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{aiName}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(110,231,183,0.8)]"></span>
                <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-widest leading-none">Agent Connecté</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/settings')} title="Clé API" className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition border border-white/10 backdrop-blur-sm">
              <i className="fa-solid fa-key text-lg"></i>
            </button>
            <button onClick={() => setShowVoiceConfig(true)} className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition border border-white/10 backdrop-blur-sm">
              <i className="fa-solid fa-microphone-lines text-lg"></i>
            </button>
          </div>
        </div>

        <div id="chatMessages" ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-32">
          {messages.map((m) => (
            <div key={m.id || m.date} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} mb-4 group animate-in fade-in slide-in-from-bottom-2`}>
              {m.role === 'assistant' ? (
                <div className="assistant-container max-w-[85%]">
                  <div className="assistant-body chat-bubble relative bg-white border border-slate-100 shadow-sm rounded-2xl p-4 text-slate-700 text-sm leading-relaxed glassmorphic-card">
                    <button
                      onClick={() => toggleSpeak(m.text.replace(/\[.+?\]/g, '').trim(), m.id)}
                      className={`voice-toggle absolute -left-3 -top-3 w-8 h-8 rounded-full text-white flex items-center justify-center transition shadow-md border-2 border-white z-10 cursor-pointer active:scale-90 ${
                        voiceBtnState[m.id] === 'playing' ? 'bg-red-500 pulse-soft' :
                        voiceBtnState[m.id] === 'loading' ? 'bg-slate-400' : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    >
                      {voiceBtnState[m.id] === 'playing' ?
                        <i className="fa-solid fa-stop text-[10px]"></i> :
                        voiceBtnState[m.id] === 'loading' ?
                        <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> :
                        <i className="fa-solid fa-volume-high text-[10px]"></i>
                      }
                    </button>
                    <span className="whitespace-pre-wrap">{typewriterText[m.id] || ''}</span>
                    {typingId === m.id && <span className="inline-block w-1 h-4 bg-emerald-500 ml-1 animate-pulse align-middle"></span>}
                  </div>
                  <div className="assistant-actions flex gap-4 mt-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => { copyToClipboard(m.text); showToast('Copié ! 📋'); }} className="text-slate-400 hover:text-emerald-600 transition flex items-center gap-1.5">
                      <i className="fa-solid fa-copy text-[10px]"></i> 
                      <span className="text-[9px] font-black uppercase tracking-widest">Copier</span>
                    </button>
                    <button onClick={regenerateResponse} className="regenerate-btn text-slate-400 hover:text-emerald-600 transition flex items-center gap-1.5">
                      <i className="fa-solid fa-arrows-rotate text-[10px]"></i> 
                      <span className="text-[9px] font-black uppercase tracking-widest">Relancer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="user-bubble-container max-w-[85%] relative">
                  <div className={`user-bubble chat-bubble relative bg-emerald-600 text-white rounded-2xl p-4 shadow-md text-sm font-medium ${editingMsgId === m.id ? 'ring-2 ring-emerald-300 ring-offset-2' : ''}`}>
                    {editingMsgId === m.id ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          autoFocus
                          value={editInputValue}
                          onChange={e => setEditInputValue(e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm outline-none w-full min-h-[60px] placeholder-white/50"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingMsgId(null)} className="px-3 py-1.5 rounded-lg bg-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition">Annuler</button>
                          <button onClick={() => saveEdit(m)} className="px-3 py-1.5 rounded-lg bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition">Valider</button>
                        </div>
                      </div>
                    ) : (
                      <span>{m.text}</span>
                    )}
                  </div>
                  {!editingMsgId && (
                    <div className="user-actions absolute -bottom-8 right-0 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => { copyToClipboard(m.text); showToast('Copié ! 📋'); }} className="text-slate-400 hover:text-emerald-600 transition flex items-center gap-1.5">
                        <i className="fa-solid fa-copy text-[10px]"></i> 
                        <span className="text-[9px] font-black uppercase tracking-widest">Copier</span>
                      </button>
                      <button onClick={() => startEdit(m)} className="edit-btn text-slate-400 hover:text-emerald-600 transition flex items-center gap-1.5">
                        <i className="fa-solid fa-pen text-[10px]"></i> 
                        <span className="text-[9px] font-black uppercase tracking-widest">Éditer</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {isThinking && (
          <div id="typingIndicator" className="px-6 py-4 absolute bottom-20">
            <div className="bg-gray-100 rounded-2xl px-5 py-3 inline-flex items-center gap-2">
              <span className="typing-dot w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="typing-dot w-2 h-2 bg-emerald-500 rounded-full" style={{animationDelay: '0.2s'}}></span>
              <span className="typing-dot w-2 h-2 bg-emerald-500 rounded-full" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}

        <div className="p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 absolute bottom-0 left-0 right-0 z-20">
          <div className="flex items-center gap-3 bg-gray-100 rounded-[30px] p-2 pr-3 border border-gray-200 shadow-inner">
            <button
              onClick={() => {
                if (isListeningRef.current) { stopSTT(); }
                else { isListeningRef.current = true; setIsListening(true); startSTT(); }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-sm border border-gray-100 ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-400 active:bg-emerald-50 active:text-emerald-500'
              }`}
            >
              <i className={`fa-solid ${isListening ? 'fa-square' : 'fa-microphone'} text-lg`}></i>
            </button>
            <input 
              type="text" 
              placeholder="Écrivez un message..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none outline-none px-2 font-bold text-gray-700 placeholder:text-gray-400"
            />
            <button onClick={() => handleSend()} className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white active:scale-95 transition shadow-lg shadow-emerald-600/30">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>

        <div id="voiceConfig" className={`fixed inset-0 z-[100] ${showVoiceConfig ? '' : 'hidden'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowVoiceConfig(false)}></div>
          <div className={`absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] p-8 config-sheet shadow-[0_-10px_40px_rgba(0,0,0,0.2)] h-[80vh] flex flex-col ${showVoiceConfig ? '' : 'sheet-hidden'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-900 text-xl flex items-center gap-3"><i className="fa-solid fa-volume-high text-emerald-600"></i> Voix Françaises</h3>
              <button onClick={initVoices} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition"><i className="fa-solid fa-arrows-rotate text-sm"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {voices.map(v => (
                <div key={v.voiceURI} onClick={() => { setSelectedVoice(v.voiceURI); localStorage.setItem('selected_voice_uri', v.voiceURI); }} className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer border-2 ${v.voiceURI === selectedVoice ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-gray-50'}`}>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{v.name.split(' - ')[0]}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{v.localService ? 'Offline' : 'Online'}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); testVoice(v.voiceURI); }} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600"><i className="fa-solid fa-play text-xs"></i></button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowVoiceConfig(false)} className="w-full bg-emerald-600 text-white p-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest mt-4">Terminer</button>
          </div>
        </div>
    </div>
  );
};

export default Assistant;
