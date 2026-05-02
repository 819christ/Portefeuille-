// src/services/ai.js
// AI service — full system prompt with all action tags, matching prototype assistant.html

import db from './db';

export const getAIContext = () => {
  try {
    return JSON.parse(sessionStorage.getItem('agentContext') || '{}');
  } catch {
    return {};
  }
};

export const buildSystemPrompt = async () => {
  const userName = localStorage.getItem('user_name') || 'Utilisateur';
  const aiName = localStorage.getItem('ai_name') || 'Assistant IA';

  let wallets = [];
  try {
    wallets = await db.getAllWallets();
  } catch (_) {}

  const walletsStr = wallets.map(w => `ID:${w.id} ${w.name} (${w.balance} FCFA)`).join(', ') || 'Aucun portefeuille';
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return `
NOM DE L'IA : ${aiName}
NOM DE L'UTILISATEUR : ${userName}
DATE ACTUELLE : ${dateStr}
PERSONNALITÉ : Tu es un agent financier tendre mais très pointu. Tu fusionnes la rigueur d'un comptable avec une personnalité douce, rigolote et adaptative.
OBJECTIF : Aide l'utilisateur à gérer son argent. Sois pro-actif : si tu vois des planifications bientôt dues, mentionne-les.
DONNÉES :
- Wallets: ${walletsStr}
ACTIONS SPÉCIALES (Utilise ces tags SEULS en fin de message si nécessaire) :
- [ACTION:REDIRECT:HISTORY:all|deposit|withdrawal]
- [ACTION:REDIRECT:PLANIFICATIONS]
- [ACTION:REDIRECT:WALLET:ID]
- [ACTION:CREATE_WALLET:Nom:Description]
- [ACTION:DELETE_WALLET:ID]
- [ACTION:DEPOSIT:W_ID:Montant:Motif]
- [ACTION:WITHDRAW:W_ID:Montant:Motif]
- [ACTION:CREATE_PLAN:W_ID:Montant:Type:Label:Desc:Freq:Day]
- [ACTION:DELETE_PLAN:ID]
RÈGLE ANTI-HALLUCINATION : Ne devine jamais un montant ou un ID. Demande si c'est flou.
RÈGLE DE NAVIGATION : Ne redirige JAMAIS l'utilisateur sans qu'il l'ait explicitement demandé.
  `.trim();
};

export const fetchAIResponse = async (messages, _contextStr) => {
  const key = localStorage.getItem('assistant_api_key');
  if (!key) throw new Error("Clé API manquante. Configurez-la dans les Paramètres.");

  const provider = localStorage.getItem('ai_provider') || 'groq';
  const url = provider === 'groq' 
    ? 'https://api.groq.com/openai/v1' 
    : provider === 'google' 
      ? 'https://generativelanguage.googleapis.com/v1beta/openai' 
      : 'https://api.cerebras.ai/v1';

  const model = provider === 'google' 
    ? 'gemini-1.5-flash' 
    : provider === 'cerebras' 
      ? 'llama3.1-70b' 
      : 'llama-3.3-70b-versatile';

  // Build full system prompt with live wallet data
  const systemPrompt = await buildSystemPrompt();

  // Take last 50 messages for context
  const recentMessages = messages.slice(-50);

  const response = await fetch(url + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentMessages.map(m => ({ role: m.role, content: m.content || m.text }))
      ]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Erreur API (${response.status})`);
  }

  const data = await response.json();

  if (data.error) throw new Error(data.error.message || "Erreur API");
  if (!data.choices?.[0]) throw new Error("Réponse API invalide");

  return data.choices[0].message.content;
};
