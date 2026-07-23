# CLAUDE.md — site-ddscreation

Contexte persistant pour Claude Code sur ce dépôt. Lu automatiquement au
début de chaque session.

> **INSTRUCTION POUR CLAUDE :** à la fin de toute session où une
> modification significative a été apportée au projet (nouvelle règle
> apprise, tâche terminée, nouvelle fonctionnalité, changement d'état),
> mets à jour toi-même les sections « État actuel » et « À faire » de ce
> fichier, puis commit ce changement — sans attendre qu'on te le demande
> explicitement. Reste concis : résume, ne duplique pas l'historique
> complet de la conversation.

---

## Contexte du projet

**DDS Creation** (ddscreation.ch) — activité freelance de création de sites
web, fondée et opérée par **Damiano Di Sano** (GitHub : `darkda12`), basé en
Suisse. Damiano est autodidacte, travaille **exclusivement depuis iPhone**
(aucun éditeur de code local) et utilise Claude comme outil de développement
principal via un pipeline GitHub Issues.

Clients actuels :
- **Julie Di Sano** — juliedisano.ch — maquilleuse professionnelle
- **Lorena Lavado** — lorenalavado.ch — coiffeuse à domicile (pas un salon) —
  site en cours de construction

---

## Architecture du pipeline

```
iPhone Shortcut → GitHub Issue (API) → GitHub Actions (edit-via-issue.yml)
  → Claude API (scripts/edit-with-claude.js) → modifie les .html
  → git commit + push → FTP Deploy vers Infomaniak
```

- Déclencheur : ouverture d'une Issue GitHub par `darkda12` uniquement
  (protection via `if: github.event.issue.user.login == 'darkda12'`)
- Le workflow commit **tous les fichiers `*.html`** (migration multi-pages
  effectuée — ce n'était historiquement que `index.html`)
- Résultat visible en 1–2 minutes après ouverture de l'Issue

### Répartition des responsabilités fichiers

| Fichier | Géré par | Notes |
|---|---|---|
| `*.html` | Pipeline (Claude API) | Seuls fichiers modifiés automatiquement |
| `.htaccess` | FTP manuel (Cyberduck) | Dotfile — bloqué par FTP Manager Infomaniak |
| `service-worker.js` | FTP manuel | Jamais touché par le pipeline |
| `contact.js`, `flip.js`, `sw-register.js`, `scroll-restore-v2.js` | FTP manuel | JS externe, jamais inline |
| Images | FTP manuel | Compresser à 60–200 Ko avant upload (quota 10 Mo total) |

---

## Règles strictes (à ne jamais casser)

1. **Aucun JS inline.** La CSP (`script-src 'self'` sans `unsafe-inline`)
   bloque silencieusement tout `<script>` inline et tout `onclick=` /
   `ontouchstart=` en production. Tout JS doit être dans un fichier externe.
2. **Service worker : bypass cross-origin obligatoire.** Un SW actif
   intercepte toutes les requêtes fetch par défaut, y compris cross-origin.
   Il faut explicitement laisser passer (`if (origin !== self.location.origin) return;`)
   sinon ça casse `connect-src` pour des libs comme Supabase.
3. **Cache Safari iOS :**
   - `Cache-Control: no-store` sur le HTML dans `.htaccess` → un simple
     reload suffit après déploiement
   - JS/images en cache 30 jours → toute modif d'un fichier JS existant
     nécessite un **renommage** (`-v2`, `-v3`...) car le hard-reload est
     impossible sur Safari mobile (fonctionne seulement sur desktop, pour
     les tests)
4. **Pas d'animations CSS 3D pour le mobile** (perspective, transform-style,
   backface-visibility) — non fiable sur Safari iOS. Utiliser une classe
   togglée + `display`, déclenchée par un bouton avec un seul event listener.
5. **Librairies esm.sh : CSP double.** Nécessitent à la fois `script-src`
   ET `connect-src` — les imports dynamiques internes sont interceptés sous
   `connect-src` par le navigateur.
6. **Quota FTP : 10 Mo total.** Toujours compresser les images avant upload.

---

## Format d'instruction pour le pipeline

Damiano envoie ses instructions comme **texte exact à copier-coller** dans
l'Issue GitHub — jamais en description en langage naturel approximatif.
Particulièrement critique pour les changements CSS : le pipeline
(`edit-with-claude.js`) a tendance à fusionner ou simplifier des règles qui
doivent rester séparées, ce qui cause des régressions.

Les changements sont déployés et validés **un par un**, jamais en lot.

---

## Design system

- Fond blanc uniquement `#FFFFFF`, texte `#111111`, bordures `#E0E0E0`
- Typo : Georgia (serif) + Helvetica Neue (sans-serif)
- `color-scheme: light only` — pas de dark mode, pas de couleur d'accent
- Pas de logo réel actuellement — wordmark texte "DDS Creation"

---

## Tarifs (pour cohérence du contenu)

- Essentiel : CHF 400
- Pro : CHF 750
- Sur mesure : sur devis
- Hébergement + domaine + petites modifs : CHF 150–200/an, facturé séparément

---

## Infrastructure & accès

- **Hébergement :** Infomaniak Starter (ID 805393), SSL Let's Encrypt
- **Repo :** `darkda12/site-ddscreation` (GitHub)
- **Secrets pipeline :** `ANTHROPIC_API_KEY`, `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
- **Supabase :** URL `https://qxixaiueynntfetyykjn.supabase.co` — table `messages`,
  RLS + policy d'insertion publique
- **Cyberduck** requis pour uploader les dotfiles (`.htaccess`) — le FTP
  Manager Infomaniak les bloque

---

## État actuel (à mettre à jour au fil du projet)

> Dernière mise à jour : 03.07.2026

- Pipeline opérationnel, Shortcut iPhone configuré
- Service worker `dds-creation-v5` actif
- CSP en place : `script-src 'self'` sans `unsafe-inline`, suite complète de
  headers de sécurité, cible A+ sur securityheaders.com (à re-vérifier après
  les derniers correctifs CSP)
- Résolu récemment : erreurs CSP (JS inline + `connect-src` pour esm.sh),
  scroll-to-top Safari mobile, chevauchement du header mobile

### À faire

- [ ] **Priorité : Web3Forms** — récupérer la clé API, router le formulaire
      de contact vers contact@ddscreation.ch
- [ ] Tester une vraie soumission de formulaire de bout en bout (pas
      seulement l'absence d'erreurs console)
- [ ] Re-vérifier le score securityheaders.com après les derniers correctifs
- [ ] Intégrer un vrai logo quand disponible
- [ ] Clarifier la définition de "jusqu'à 5 pages" dans l'offre Pro (nombre
      de templates vs nombre d'URLs, gestion du dépassement)
- [ ] Poursuivre la migration multi-pages : fournir et déployer le contenu
      de `realisations.html`, `tarifs.html`, `apropos.html`, `contact.html`
- [ ] Image de preview pour Lorena Lavado (quand disponible)
- [ ] Preview vidéo pour Julie Di Sano (différé — Cloudinary identifié comme
      solution d'hébergement média au-delà du quota FTP)

---

## Comment ce fichier reste à jour

Grâce à l'instruction en tête de fichier, Claude Code met normalement à jour
lui-même ce fichier en fin de session après un changement important. Si ça
n'arrive pas, tu peux toujours le forcer en disant explicitement
"mets à jour CLAUDE.md avec ce qu'on vient de faire".

Tu peux aussi éditer ce fichier toi-même à tout moment (directement sur
GitHub ou via Claude Code).

Séparément, Claude Code a aussi un système d'**Auto Memory** qui note tout
seul ce qu'il apprend en travaillant (corrections, patterns récurrents) —
mais ces notes vivent dans `~/.claude/projects/.../memory/`, en local,
**pas dans ce repo**. Ce fichier `CLAUDE.md` reste la source de vérité
partagée et versionnée ; l'Auto Memory est un complément local.
