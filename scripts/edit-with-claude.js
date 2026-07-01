const fs = require('fs');

async function main() {
  const currentHtml = fs.readFileSync('index.html', 'utf8');
  const issueTitle = process.env.ISSUE_TITLE || '';
  const issueBody = process.env.ISSUE_BODY || '';
  const request = `${issueTitle}\n${issueBody}`.trim();

  const systemPrompt = `Tu modifies le fichier HTML du site vitrine de DDS Création (ddscreation.ch).
DDS Création est une activité freelance de création de pages web, fondée par Damiano Di Sano, basé en Suisse.
Le site est un one-page minimaliste avec les sections : Hero, Réalisations, Tarifs, Méthode, Contact.
Design : fond blanc uniquement (#FFFFFF), texte noir (#111111), bordures grises fines (#E0E0E0), aucune couleur d'accent, aucun logo (juste le texte "DDS Création").
Le formulaire de contact est connecté à Supabase via esm.sh — ne jamais toucher à ce code JS sauf si la demande le concerne explicitement.

Règles strictes :
- Réponds UNIQUEMENT avec le code HTML complet et final, du <!DOCTYPE html> jusqu'à </html>.
- N'ajoute aucun texte avant ou après, aucune explication, aucun bloc de code markdown (pas de \`\`\`).
- Conserve tout le style, la structure et le design existants sauf ce qui doit changer selon la demande.
- N'ajoute jamais d'attribut contenteditable.
- N'intègre jamais d'image en base64 directement dans le HTML ; utilise toujours un fichier séparé référencé par son chemin.
- Si la demande est ambiguë, fais le choix le plus raisonnable et cohérent avec le reste du site.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Voici le contenu actuel de index.html :\n\n${currentHtml}\n\n---\n\nDemande de modification :\n${request}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Erreur API Anthropic:', response.status, errText);
    process.exit(1);
  }

  const data = await response.json();
  const textBlock = data.content.find(b => b.type === 'text');
  let newHtml = textBlock ? textBlock.text.trim() : '';

  // Sécurité : enlever d'éventuels fences markdown résiduels
  newHtml = newHtml.replace(/^```(html)?/i, '').replace(/```$/, '').trim();

  if (!newHtml.startsWith('<!DOCTYPE') && !newHtml.startsWith('<!doctype')) {
    console.error('Réponse inattendue, abandon pour sécurité.');
    process.exit(1);
  }

  fs.writeFileSync('index.html', newHtml, 'utf8');
  console.log('Fichier index.html mis à jour avec succès.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
