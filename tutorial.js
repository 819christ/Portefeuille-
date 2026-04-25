/**
 * Tutorial System for Portefeuille App
 * Handles guided tours with a "hole" highlight effect and intelligent popup positioning.
 */
const tutorial = {
  steps: {
    'index.html': [
      { element: 'h1', text: "Bienvenue dans votre gestionnaire de portefeuille ! Ce guide rapide va vous montrer l'essentiel." },
      { element: '#totalBalance', text: "Ici s'affiche votre solde total cumulé de tous vos comptes." },
      { element: '#eyeButton', text: "Appuyez sur cet œil pour masquer vos chiffres en public." },
      { element: "button[onclick*='notifications.html']", text: "Consulatez vos alertes et rappels de paiements ici." },
      { element: "button[onclick*='telechargement.html']", text: "Installez l'application sur votre écran d'accueil pour un accès rapide et hors-ligne." },
      { element: '#walletsList', text: "Vos portefeuilles s'affichent ici sous forme de cartes. Glissez vers la gauche pour tout voir." },
      { element: "button[onclick*='createNewWallet']", text: "Commencez par ici ! Créez votre premier portefeuille (ex: Cash, Mobile Money, Banque)." },
      { element: '#quickActionBtn', text: "Le bouton magique ! Enregistrez un dépôt, un retrait ou une planification en 2 clics." },
      { element: '#plansList', text: "Vos tâches du jour. L'app vous rappelle automatiquement ce que vous devez payer ou recevoir." },
      { element: "button[onclick*='assistant.html']", text: "Besoin d'aide ? Votre assistant IA peut tout faire pour vous par simple commande vocale." }
    ],
    'wallet-detail.html': [
      { element: '#walletHeader', text: "Détails de ce portefeuille. Vous pouvez modifier son nom par un appui long sur le titre." },
      { element: '#totalIn', text: "Le total de tout ce que vous avez ajouté sur ce compte." },
      { element: '#totalOut', text: "Le total de toutes vos dépenses ou retraits ici." },
      { element: '#syncBtn', text: "Un retard de paiement ? Ce bouton synchronise vos planifications passées en un éclair." },
      { element: '#addTxBtn', text: "Ajoutez manuellement une opération sur ce portefeuille précis." }
    ],
    'assistant.html': [
      { element: '#headerBotIcon', text: "Votre assistant IA. Il apprend vos habitudes pour mieux vous conseiller." },
      { element: '#chatMessages', text: "Historique de vos échanges. Vos discussions sont sauvegardées localement." },
      { element: '#micBtn', text: "Maintenez ou appuyez pour parler. Dites par exemple : 'J'ai dépensé 5000 pour le carburant'." },
      { element: "button[onclick*='toggleApiConfig']", text: "Configurez vos clés API et choisissez entre Groq, Google ou Cerebras." },
      { element: "button[onclick*='toggleVoiceConfig']", text: "Choisissez la voix qui vous plaît le plus pour votre assistant." }
    ],
    'history.html': [
      { element: 'h1', text: "Historique complet. Filtrez vos opérations par type ou par date." },
      { element: '#totalNet', text: "Votre flux de trésorerie net sur la période affichée." },
      { element: '.date-group-header', text: "Vos opérations sont groupées par jour pour une meilleure visibilité." }
    ]
  },

    init() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const hasSeen = localStorage.getItem(`tutorial_${page}`);
        
        if (!hasSeen && this.steps[page]) {
            setTimeout(() => this.startTour(page), 1500);
        }
    },

    startTour(page) {
        this.currentSteps = this.steps[page];
        this.currentIndex = 0;
        this.createOverlay();
        this.showStep();
    },

    createOverlay() {
        // Overlay for dimming everything BUT the highlight
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500 opacity-0';
        
        // Highlight element with a giant shadow to dim the rest
        this.highlight = document.createElement('div');
        this.highlight.id = 'tutorialHighlight';
        this.highlight.className = 'fixed z-[10000] border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7),0_0_20px_rgba(52,211,153,0.5)] transition-all duration-500 pointer-events-none';
        
        // Popup for text
        this.popup = document.createElement('div');
        this.popup.id = 'tutorialPopup';
        this.popup.className = 'fixed z-[10001] bg-white p-6 rounded-[32px] shadow-2xl max-w-[280px] w-full pointer-events-auto transition-all duration-500 transform scale-95 opacity-0';
        this.popup.innerHTML = `
            <div class="flex items-center gap-2 mb-3">
                <div class="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Guide App</span>
            </div>
            <p id="tutorialText" class="text-gray-700 text-sm font-bold leading-relaxed mb-6"></p>
            <div class="flex justify-between items-center">
                <span id="tutorialProgress" class="text-[9px] font-black text-gray-300 uppercase tracking-widest"></span>
                <button id="tutorialNext" class="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-100">Suivant</button>
            </div>
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.highlight);
        document.body.appendChild(this.popup);

        document.getElementById('tutorialNext').onclick = () => this.nextStep();
        
        requestAnimationFrame(() => {
            this.overlay.classList.remove('opacity-0');
            this.popup.classList.remove('opacity-0', 'scale-95');
        });
    },

    showStep() {
        const step = this.currentSteps[this.currentIndex];
        const el = document.querySelector(step.element);
        const text = document.getElementById('tutorialText');
        const progress = document.getElementById('tutorialProgress');

        if (!el) {
            this.nextStep();
            return;
        }

        // Highlight element position
        const rect = el.getBoundingClientRect();
        this.highlight.style.top = `${rect.top - 8}px`;
        this.highlight.style.left = `${rect.left - 8}px`;
        this.highlight.style.width = `${rect.width + 16}px`;
        this.highlight.style.height = `${rect.height + 16}px`;

        // Intelligent Popup Positioning
        const margin = 20;
        const screenHeight = window.innerHeight;
        const screenWidth = window.innerWidth;
        const popupRect = this.popup.getBoundingClientRect();
        
        // Default: try to put below
        let top = rect.bottom + margin;
        let left = Math.max(margin, Math.min(screenWidth - 280 - margin, rect.left + rect.width/2 - 140));

        // If not enough space below, put above
        if (top + 200 > screenHeight) {
            top = rect.top - 200 - margin;
        }

        this.popup.style.top = `${top}px`;
        this.popup.style.left = `${left}px`;

        // Update content
        text.textContent = step.text;
        progress.textContent = `Étape ${this.currentIndex + 1}/${this.currentSteps.length}`;
        
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (this.currentIndex === this.currentSteps.length - 1) {
            document.getElementById('tutorialNext').textContent = "Terminer";
        }
    },

    nextStep() {
        this.currentIndex++;
        if (this.currentIndex < this.currentSteps.length) {
            this.showStep();
        } else {
            this.finishTour();
        }
    },

    finishTour() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        localStorage.setItem(`tutorial_${page}`, 'true');
        this.overlay.classList.add('opacity-0');
        this.highlight.style.opacity = '0';
        this.popup.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            this.overlay.remove();
            this.highlight.remove();
            this.popup.remove();
        }, 500);
    }
};

// Auto-init
if (document.readyState === 'complete') tutorial.init();
else window.addEventListener('load', () => tutorial.init());
