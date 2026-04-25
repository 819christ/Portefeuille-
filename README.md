# 🚀 FinanceFlow PWA - Assistant Financier Intelligent

**FinanceFlow** est une Progressive Web App (PWA) de gestion de finances personnelles ultra-moderne, pilotée par l'Intelligence Artificielle et conçue pour une utilisation mobile-first.

![Aperçu de l'application](app_logo_1777121141155.png)

## ✨ Fonctionnalités Clés

- 🤖 **Assistant IA Multimodal** : Parlez à votre application ! Enregistrez vos dépenses et revenus à la voix grâce à l'intégration de Groq (Llama 3.3), Google Gemini et Cerebras.
- 📱 **Expérience App Native** : Une interface fluide avec des animations premium, un mode sombre élégant et une navigation intuitive.
- 💾 **Offline-First (PWA)** : Fonctionne sans connexion internet grâce à **IndexedDB** pour le stockage local et un **Service Worker** robuste.
- 🔔 **Système de Planification** : Ne ratez plus un paiement ! Planifiez vos transactions récurrentes et recevez des notifications intelligentes.
- 🔒 **Confidentialité Totale** : Vos données financières ne quittent jamais votre appareil. Tout est stocké localement dans votre navigateur.
- 📊 **Historique & Statistiques** : Visualisez vos flux de trésorerie avec des filtres avancés et un groupage temporel clair.

## 🛠️ Stack Technique

- **Frontend** : HTML5, CSS3 (Tailwind CSS), JavaScript Vanilla.
- **Icônes & Design** : FontAwesome 6 (Auto-hébergé pour la performance).
- **Base de données** : IndexedDB (API native du navigateur).
- **IA** : Intégration API via Groq, Google Generative AI et Cerebras Systems.
- **PWA** : Manifest JSON et Service Workers.

## 🚀 Installation & Déploiement

### Déploiement Rapide
L'application étant statique (Serverless), vous pouvez l'héberger gratuitement sur :
- **GitHub Pages**
- **Vercel**
- **Netlify**

### Installation sur Mobile
1. Ouvrez l'URL de l'application dans Chrome (Android) ou Safari (iOS).
2. Cliquez sur l'icône de téléchargement dans l'en-tête de l'application.
3. Suivez les instructions pour "Ajouter à l'écran d'accueil".

## ⚙️ Configuration de l'Assistant
Pour activer l'IA, vous devez posséder une clé API chez l'un des fournisseurs supportés :
1. Allez dans l'onglet **Assistant**.
2. Cliquez sur l'icône des paramètres (engrenage).
3. Entrez votre clé API et choisissez votre modèle préféré.

## 📂 Structure du Projet

```text
├── index.html           # Tableau de bord principal
├── assistant.html       # Interface de l'IA (STT, TTS, Chat)
├── history.html         # Historique des transactions
├── wallet-detail.html   # Détails par compte
├── notifications.html   # Gestion des alertes
├── telechargement.html  # Page d'installation PWA
├── chargement.html      # Transition animée
├── sw.js                # Service Worker pour le mode offline
├── manifest.json        # Configuration PWA
└── fontawesome/         # Bibliothèque d'icônes locale
```

---
*Développé avec ❤️ pour une gestion financière simplifiée.*
