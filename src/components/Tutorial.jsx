import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const tutorialData = {
  '/': [
    { element: 'h1', text: "Bienvenue dans votre gestionnaire de portefeuille ! Ce guide rapide va vous montrer l'essentiel." },
    { element: '.total-balance-display', text: "Ici s'affiche votre solde total cumulé de tous vos comptes." },
    { element: '.eye-toggle-btn', text: "Appuyez sur cet œil pour masquer vos chiffres en public." },
    { element: '.notif-nav-btn', text: "Consultez vos alertes et rappels de paiements ici." },
    { element: '.download-nav-btn', text: "Installez l'application sur votre écran d'accueil pour un accès rapide et hors-ligne." },
    { element: '.wallets-list-container', text: "Vos portefeuilles s'affichent ici sous forme de cartes. Glissez vers la gauche pour tout voir." },
    { element: '.new-wallet-btn', text: "Commencez par ici ! Créez votre premier portefeuille (ex: Cash, Mobile Money, Banque)." },
    { element: '.fab-action-btn', text: "Le bouton magique ! Enregistrez un dépôt, un retrait ou une planification en 2 clics." },
    { element: '.plans-list-container', text: "Vos tâches du jour. L'app vous rappelle automatiquement ce que vous devez payer ou recevoir." },
    { element: '.assistant-nav-btn', text: "Besoin d'aide ? Votre assistant IA peut tout faire pour vous par simple commande vocale." }
  ],
  '/wallet-detail': [
    { element: '.wallet-header', text: "Détails de ce portefeuille. Vous pouvez modifier son nom par un appui long sur le titre." },
    { element: '.action-deposit-btn', text: "Ajoutez manuellement une opération sur ce portefeuille précis." },
    { element: '.plan-sync-btn', text: "Un retard de paiement ? Ce bouton synchronise vos planifications passées en un éclair." }
  ],
  '/assistant': [
    { element: '.assistant-header-icon', text: "Votre assistant IA. Il apprend vos habitudes pour mieux vous conseiller." },
    { element: '.chat-messages-container', text: "Historique de vos échanges. Vos discussions sont sauvegardées localement." },
    { element: '.mic-action-btn', text: "Maintenez ou appuyez pour parler. Dites par exemple : 'J'ai dépensé 5000 pour le carburant'." },
    { element: '.settings-nav-btn', text: "Configurez vos clés API et choisissez entre Groq, Google ou Cerebras." }
  ],
  '/history': [
    { element: 'h1', text: "Historique complet. Filtrez vos opérations par type ou par date." },
    { element: '.total-net-display', text: "Votre flux de trésorerie net sur la période affichée." },
    { element: '.history-group-header', text: "Vos opérations sont groupées par jour pour une meilleure visibilité." }
  ]
};

const Tutorial = () => {
  const location = useLocation();
  const [currentSteps, setCurrentSteps] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeRect, setActiveRect] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, placement: 'bottom' });
  const rafRef = useRef(null);

  useEffect(() => {
    let basePath = location.pathname;
    if (basePath.startsWith('/wallet-detail')) basePath = '/wallet-detail';

    const steps = tutorialData[basePath];
    const hasSeen = localStorage.getItem(`tutorial_${basePath}`);

    if (steps && !hasSeen) {
      const timer = setTimeout(() => {
        setCurrentSteps(steps);
        setCurrentIndex(0);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setCurrentSteps(null);
    }
  }, [location.pathname]);

  const updatePosition = () => {
    if (currentSteps && currentSteps[currentIndex]) {
      const step = currentSteps[currentIndex];
      const el = document.querySelector(step.element);

      if (el) {
        const rect = el.getBoundingClientRect();
        const newRect = {
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        };

        // Only update if changed to avoid unnecessary re-renders
        if (!activeRect || 
            Math.abs(activeRect.top - newRect.top) > 0.5 || 
            Math.abs(activeRect.left - newRect.left) > 0.5 ||
            activeRect.width !== newRect.width ||
            activeRect.height !== newRect.height) {
          setActiveRect(newRect);
        }

        const margin = 20;
        const screenHeight = window.innerHeight;
        const screenWidth = window.innerWidth;
        const popupWidth = 280;
        const popupHeight = 180; // approximate
        
        let top = rect.bottom + margin;
        let left = Math.max(margin, Math.min(screenWidth - popupWidth - margin, rect.left + rect.width/2 - popupWidth/2));
        let placement = 'bottom';

        // Collision detection
        if (top + popupHeight > screenHeight) {
          top = rect.top - popupHeight - margin;
          placement = 'top';
          // Ensure it's not off top
          if (top < margin) {
            top = margin;
            // Shift left/right if it covers the element?
          }
        }

        setPopupPos({ top, left, placement });
      } else {
        setActiveRect(null);
      }
    }
    rafRef.current = requestAnimationFrame(updatePosition);
  };

  useEffect(() => {
    if (currentSteps) {
      rafRef.current = requestAnimationFrame(updatePosition);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentSteps, currentIndex]);

  const nextStep = () => {
    if (currentIndex < currentSteps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    let basePath = location.pathname;
    if (basePath.startsWith('/wallet-detail')) basePath = '/wallet-detail';
    localStorage.setItem(`tutorial_${basePath}`, 'true');
    setCurrentSteps(null);
  };

  if (!currentSteps) return null;

  const currentStep = currentSteps[currentIndex];

  return (
    <AnimatePresence>
      {activeRect && (
        <>
          {/* MASK / OVERLAY */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-black/60"
          ></motion.div>
          
          {/* HIGHLIGHT RING */}
          <motion.div 
            className="fixed z-[10000] border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4),0_0_25px_rgba(52,211,153,0.8)] pointer-events-none"
            animate={{
              top: activeRect.top,
              left: activeRect.left,
              width: activeRect.width,
              height: activeRect.height
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          ></motion.div>

          {/* TOOLTIP POPUP */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              top: popupPos.top, 
              left: popupPos.left 
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed z-[10001] bg-white p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-[280px] w-full pointer-events-auto"
          >
            {/* Arrow indicator */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 ${popupPos.placement === 'bottom' ? '-top-2' : '-bottom-2'}`}></div>

            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Guide Assistant</span>
            </div>
            
            <p className="text-gray-700 text-sm font-bold leading-relaxed mb-6 relative z-10">
              {currentStep.text}
            </p>

            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                  Étape {currentIndex + 1}/{currentSteps.length}
                </span>
                <div className="flex gap-1 mt-1">
                  {currentSteps.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-emerald-500' : 'w-1 bg-gray-100'}`}></div>
                  ))}
                </div>
              </div>
              <button 
                onClick={nextStep}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] active:scale-95 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2"
              >
                {currentIndex === currentSteps.length - 1 ? 'Terminer' : 'Suivant'}
                <i className={`fa-solid ${currentIndex === currentSteps.length - 1 ? 'fa-check' : 'fa-arrow-right'}`}></i>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Tutorial;
