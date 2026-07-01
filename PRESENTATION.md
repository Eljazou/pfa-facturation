# PRESENTATION — FacturaPro
## Guide de soutenance PFA · Abdessamad Eljazouly

---

## 1. ARCHITECTURE GÉNÉRALE

FacturaPro est une application web de gestion de facturation construite en **React** avec une base de données **Firebase** en temps réel. Le projet est organisé en couches distinctes :

```
pfa-facturation/
├── src/
│   ├── features/        ← Pages métier (factures, clients, dashboard, auth)
│   ├── components/      ← Composants réutilisables (cloche notifs, signature, QR...)
│   ├── services/        ← Logique métier pure (calculs, PDF, email, workflow...)
│   ├── store/           ← État global Redux (auth, factures, clients, notifs...)
│   ├── config/          ← Connexion Firebase et Stripe
│   ├── hooks/           ← Hooks React personnalisés (PDF, écoute temps réel...)
│   ├── utils/           ← Fonctions utilitaires (numérotation, conversions...)
│   └── pages/           ← Pages publiques (accueil, tarifs)
```

**Comment les parties communiquent :**
1. Les **composants React** lisent l'état depuis **Redux** et affichent les données.
2. Quand l'utilisateur agit (clic, formulaire), un **thunk Redux** est déclenché.
3. Le thunk appelle un **service Firebase** pour lire ou écrire en base de données.
4. Firebase renvoie les données → Redux met à jour l'état → l'interface se rafraîchit automatiquement.
5. La **logique métier** (calculs, workflow) est isolée dans des **services purs** indépendants de l'interface.

---

## 2. COMPOSANTS PRINCIPAUX

---

### InvoiceForm.jsx
> *"Le formulaire de création et modification d'une facture."*

**Ce qu'il fait :** Permet à un comptable de créer ou modifier une facture en ajoutant des lignes d'articles, en choisissant une méthode de calcul, et en signant électroniquement.

**Props reçues :** Aucune — il récupère tout depuis l'URL (ID de la facture à modifier) et Redux.

**Ce qu'il affiche :**
- Une mise en page en deux colonnes : à gauche le formulaire, à droite un panneau récapitulatif des totaux (collant, toujours visible)
- Sélection du client, de la méthode de facturation, de la devise et de la date
- Tableau de lignes d'articles dynamique (ajout/suppression de lignes)
- Bouton "Signature" ouvrant un canvas pour signer à la souris ou au doigt
- Deux boutons d'action : "Sauvegarder en brouillon" et "Soumettre pour validation"

**Exemple d'utilisation :**
```
Route /invoices/new       → crée une nouvelle facture
Route /invoices/:id/edit  → charge et pré-remplit la facture existante
```

**Point technique fort :** Le panneau de totaux utilise `useMemo` pour ne recalculer les montants QUE quand les lignes changent, sans re-rendre tout le composant à chaque frappe clavier.

---

### InvoiceList.jsx
> *"La liste de toutes les factures avec filtres et actions."*

**Ce qu'il fait :** Affiche les factures sous forme de tableau avec filtres de recherche, et propose des actions selon le statut (voir, modifier, télécharger PDF, supprimer).

**Props reçues :** Aucune — les données viennent de Redux.

**Ce qu'il affiche :**
- Barre de filtres : recherche texte, plage de dates, filtre par statut (brouillon / en attente / validée / rejetée / payée)
- Tableau (DataGrid MUI) avec les colonnes : numéro, date, client, montant TTC, statut, actions
- Colonne supplémentaire pour les admins : avatar avec les initiales du comptable créateur
- Dialogue de confirmation avant suppression

**Exemple d'utilisation :**
```
Route /invoices (comptable) → affiche ses propres factures
Route /admin/invoices       → affiche TOUTES les factures de tous les agents
```

---

### InvoiceDetail.jsx
> *"La page de consultation complète d'une facture."*

**Ce qu'il fait :** Affiche tous les détails d'une facture (infos, lignes, totaux, signature, QR code) et permet d'y agir (valider, rejeter, marquer payée, télécharger PDF).

**Props reçues :** Aucune — utilise l'ID de l'URL et un **listener temps réel** Firebase.

**Ce qu'il affiche :**
- En-tête avec numéro de facture, statut coloré, badge "en retard" si applicable
- Stepper visuel montrant la progression : Brouillon → En attente → Validée → Payée
- Alerte rouge si la facture est rejetée (avec le motif affiché)
- Grille d'informations : détails de la facture à gauche, infos client + QR code à droite
- Tableau des lignes avec sous-totaux et détail TVA par taux
- Image de signature électronique si présente
- Boutons : Télécharger PDF, Prévisualiser PDF, Modifier, et le composant `ValidationActions`

**Point technique :** Utilise un **listener Firebase en temps réel** (`useInvoiceListener`) — si un admin valide la facture depuis un autre ordinateur, la page se met à jour instantanément sans rechargement.

---

### ValidationActions.jsx
> *"Les boutons d'action sur le workflow d'une facture."*

**Ce qu'il fait :** Affiche les boutons d'action disponibles selon l'état de la facture et le rôle de l'utilisateur, et gère toutes les transitions (soumettre, valider, rejeter, marquer payée, re-soumettre).

**Props reçues :**
- `invoice` — l'objet facture complet
- `onUpdated(data)` — callback appelé après chaque transition réussie

**Ce qu'il affiche selon le rôle :**
- Comptable sur brouillon → bouton "Soumettre"
- Admin sur facture en attente → boutons "Valider" (vert) et "Rejeter" (rouge)
- Comptable sur facture validée → bouton "Marquer comme payée" (bleu)
- Comptable sur facture rejetée → bouton "Re-soumettre" (jaune)
- Chaque action ouvre un dialogue de confirmation avec les champs nécessaires

**Ce qui se passe à la validation :**
1. `workflowService` vérifie que la transition est autorisée
2. Firebase met à jour le statut
3. EmailJS envoie un email au client
4. Une notification in-app est envoyée au comptable

---

### UserDashboard.jsx
> *"Le tableau de bord du comptable avec ses indicateurs personnels."*

**Ce qu'il fait :** Affiche les KPIs, graphiques et activité récente d'un comptable pour ses propres factures.

**Props reçues :** Aucune.

**Ce qu'il affiche :**
- Message de bienvenue personnalisé + filtres (date, devise, export Excel)
- 4 cartes KPI : Total factures / Montant encaissé / En attente / Rejetées
- Tableau des 5 dernières factures (cliquable vers le détail)
- Graphique en donut (répartition par statut)
- Résumé financier : Total HT, Total TVA, Moyenne par facture
- Fil d'activité récente (les derniers événements sur ses factures)
- Graphique de tendance mensuelle (sélecteur d'année)

---

### AdminDashboard.jsx
> *"Le tableau de bord administrateur avec une vue globale de l'activité."*

**Ce qu'il fait :** Donne à l'admin une vue complète : KPIs globaux, performances par agent, factures en attente actionnables, revenus mensuels.

**Props reçues :** Aucune.

**Ce qu'il affiche en plus du tableau de bord comptable :**
- Taux de validation et de rejet (en %)
- Tableau de performance par agent (nombre de factures, chiffre d'affaires, taux de validation avec barre colorée)
- Top 3 clients par CA encaissé (avec médailles 🥇🥈🥉)
- Graphique à barres des revenus mensuels
- Tableau des factures en attente avec boutons d'action inline (sans quitter le dashboard)
- Point rouge clignotant sur la carte "En attente" pour alerter visuellement

---

### NotificationBell.jsx
> *"La cloche de notifications dans la barre du haut."*

**Ce qu'il fait :** Affiche le nombre de notifications non lues et une liste déroulante avec les derniers événements (validation, rejet, paiement...).

**Props reçues :** Aucune — données depuis Redux.

**Ce qu'il affiche :**
- Icône de cloche avec badge rouge indiquant le nombre non lu
- Au clic : popover avec la liste des 10 dernières notifications
- Chaque notification : icône colorée selon le type, message en gras si non lu, heure relative ("il y a 2h")
- Bouton "Tout marquer comme lu"
- Clic sur une notification → navigue vers la facture concernée

---

### SignaturePad.jsx
> *"Le canvas pour signer électroniquement une facture."*

**Ce qu'il fait :** Ouvre une boîte de dialogue avec un canvas sur lequel l'utilisateur dessine sa signature, qui est ensuite convertie en image et stockée avec la facture.

**Props reçues :**
- `open` (booléen) — ouvre/ferme le dialogue
- `onClose` — callback de fermeture
- `onSave(dataURL)` — reçoit la signature en base64 PNG

**Ce qu'il affiche :**
- Canvas blanc avec filigrane "Signez ici" (non interactif, juste décoratif)
- Stylo noir pour dessiner la signature
- Boutons : "Effacer", "Annuler", "Confirmer"
- Erreur si l'utilisateur essaie de sauvegarder un canvas vide

**Pourquoi base64 :** La signature PNG en base64 peut être stockée directement dans Firebase (texte), affichée comme `<img>` dans l'interface, et intégrée dans le PDF généré.

---

### QRPreview.jsx
> *"Le QR code de vérification d'une facture."*

**Ce qu'il fait :** Génère et affiche un QR code qui pointe vers la page publique de la facture, permettant à n'importe qui de scanner et vérifier l'authenticité.

**Props reçues :**
- `invoice` — l'objet facture (l'ID est utilisé pour construire l'URL)
- `size` — taille en pixels (110 par défaut)

**Ce qu'il affiche :**
- QR code SVG pointant vers `{VITE_PUBLIC_URL}/p/invoice/{id}`
- Texte "Scanner pour vérifier" en dessous
- Avertissement si l'URL est localhost (non scannable depuis un téléphone)

**Utilité :** Un client peut scanner le QR imprimé sur la facture PDF et accéder à une page publique qui confirme que la facture est authentique et validée.

---

### PricingPage.jsx
> *"La page de tarification publique avec abonnements et paiement Stripe."*

**Ce qu'il fait :** Présente les 3 plans d'abonnement (Basique / Pro / Entreprise), permet de basculer entre paiement mensuel et annuel, et ouvre le modal de paiement Stripe au clic.

**Props reçues :** Aucune — page publique accessible sans connexion.

**Ce qu'il affiche :**
- Section héro animée avec blobs flottants et titre accrocheur
- Toggle personnalisé Mensuel / Annuel (−20% annuel mis en avant)
- 3 cartes de prix avec features listées (carte Pro flottante et brillante)
- Section FAQ
- Section CTA finale avec boutons d'inscription et de connexion
- Modale "Contacter l'équipe" avec design dégradé bleu→violet

**Effets visuels :** Animations d'apparition au scroll (`IntersectionObserver`), blobs animés en CSS, carte Pro avec effet "glow" pulsant, shimmer sur le bouton CTA.

---

### CheckoutModal.jsx
> *"Le formulaire de paiement Stripe intégré dans une modale."*

**Ce qu'il fait :** Affiche un formulaire de paiement sécurisé Stripe directement dans l'application, sans redirection externe.

**Props reçues :**
- `open` — visibilité
- `onClose` — fermeture
- `plan` — le plan choisi (Basique / Pro / Entreprise)
- `billingCycle` — mensuel ou annuel

**Ce qu'il affiche :**
1. **Formulaire de paiement :** Résumé de la commande (plan, prix), champs Nom/Email, champ de carte bancaire Stripe (CardElement stylisé comme MUI), bouton "Payer et créer mon compte"
2. **Écran de succès :** Animation d'apparition d'une coche verte, "Paiement réussi !", bouton "Créer mon compte maintenant" qui redirige vers l'inscription avec email pré-rempli

---

## 3. SERVICES ET LOGIQUE MÉTIER

---

### `firebaseService.js`
La **couche de communication** avec la base de données Firebase. Tout accès aux données passe par ce fichier.

Il gère : l'authentification (inscription, connexion, déconnexion), la gestion des utilisateurs et de leurs profils, le CRUD complet des factures et des clients, les listeners temps réel (quand les données changent dans Firebase, l'application est notifiée automatiquement), les paramètres de l'entreprise (nom, logo, ICE, RC...).

**Fonctions clés :**
- `createInvoice(data)` → crée une facture dans `/factures`
- `subscribeInvoices(callback)` → écoute toutes les factures en temps réel
- `updateStatus(id, statusData)` → met à jour le statut d'une facture
- `getNextInvoiceNumber(prefix)` → génère le numéro auto : `FAC-2026-0042`

---

### `billingEngine.js`
Le **moteur de calcul** des factures. C'est la partie la plus critique : elle doit être précise à la centimes près.

Il calcule les montants d'une facture selon 4 méthodes différentes :
- **Simple** : TVA fixe à 20% sur chaque ligne
- **Remise par ligne** : chaque ligne a sa propre remise en %
- **Remise globale** : une remise unique appliquée sur le total HT
- **TVA par catégorie** : chaque catégorie d'article a un taux de TVA différent

**Pourquoi `Decimal.js` ?** JavaScript a un problème célèbre : `0.1 + 0.2 = 0.30000000000000004`. Pour une application de facturation, ce genre d'erreur est inacceptable. La bibliothèque `Decimal.js` garantit une précision absolue sur toutes les opérations arithmétiques.

---

### `workflowService.js`
La **machine d'état** qui contrôle le cycle de vie d'une facture.

Une facture suit un chemin précis et on ne peut pas sauter des étapes ou revenir en arrière de façon arbitraire :

```
Brouillon → En attente → Validée → Payée (terminal)
                ↓
            Rejetée → En attente (re-soumission possible)
```

Chaque transition est contrôlée par le rôle :
- Seul un **comptable** peut soumettre, marquer payée, re-soumettre
- Seul un **admin** peut valider ou rejeter

`canTransition(currentStatus, targetStatus, userRole)` → retourne `true/false`

---

### `pdfGenerator.js`
Le **générateur de PDF** professionnel de la facture.

Construit le document page par page avec la bibliothèque `jsPDF` :
1. **En-tête** : logo de l'entreprise (si uploadé), nom, adresse, contacts
2. **Méta** : numéro de facture, date, badge de statut coloré, méthode de calcul
3. **Infos client + QR Code** : données du client et QR code de vérification
4. **Tableau des lignes** : désignation, quantité, prix unitaire, remise, TVA, total
5. **Récapitulatif** : total HT, remises, ventilation TVA par taux, total TTC
6. **Signature** : image de la signature électronique (ou emplacement réservé)
7. **Pied de page** : numéro de page, mentions légales (ICE, RC)

**Problème résolu :** Le PDF ne supporte pas certains caractères arabes (le symbole du dirham ﺩﺭﻫﻢ). La fonction `safe()` filtre automatiquement les caractères non-ASCII pour éviter l'encodage corrompu.

---

### `emailService.js`
Le service d'**envoi d'email** au client lors de la validation d'une facture.

Utilise **EmailJS** (service tiers gratuit, pas de serveur backend nécessaire) pour envoyer directement depuis le navigateur.

Ce qui est envoyé au client :
- Son nom, l'email de destination
- Le numéro et la date de la facture
- Le montant TTC et la devise
- Un **lien direct** vers la page publique de la facture

Appelé automatiquement depuis `ValidationActions.jsx` quand un admin valide une facture. Si l'envoi échoue (pas de connexion), la validation se fait quand même (best-effort).

---

### `dashboardService.js`
Le service de **calcul des KPIs et statistiques** pour les tableaux de bord.

C'est un ensemble de **fonctions pures** (elles ne font qu'entrée → sortie, sans effets de bord) qui transforment la liste des factures en métriques lisibles :

- `computeAdminKPIs(invoices)` → Total encaissé, taux de validation, top client...
- `buildMonthlyRevenueData(invoices, year)` → Tableau de 12 mois avec revenus et nombre de factures
- `buildStatusDistributionData(invoices)` → Données pour le graphique en donut
- `buildTopClientsData(invoices, clients, 5)` → Top 5 clients par chiffre d'affaires
- `computeOverdueStatus(invoice, today)` → Détecte si une facture est en retard (+30 jours)

---

### `stripeService.js`
Le service de **gestion des abonnements** avec Stripe.

Définit les 3 plans avec leurs prix en MAD :
- Basique : 100 MAD/mois | 80 MAD/mois (annuel)
- Pro : 200 MAD/mois | 160 MAD/mois (annuel)
- Entreprise : 300 MAD/mois | 240 MAD/mois (annuel)

> **Note pour la soutenance :** L'intégration Stripe fonctionne en mode **test**. Dans un vrai déploiement, il faudrait un serveur backend pour créer un `PaymentIntent` côté serveur (exigence de sécurité Stripe). Ici on simule la confirmation côté client, ce qui est suffisant pour la démonstration.

---

## 4. REDUX STORE

Redux est le **gestionnaire d'état global** de l'application. Chaque slice est comme un "compartiment" qui stocke une partie de l'état.

---

### `authSlice`
Stocke l'**utilisateur connecté** et son état d'authentification.

```
{ user: { uid, email, displayName, role }, loading, initialized, error }
```
- `user` est `null` si personne n'est connecté
- `role` peut être `"user"` (comptable) ou `"admin"` — détermine toutes les permissions
- `initialized` passe à `true` quand Firebase a fini de vérifier la session (évite l'écran blanc au démarrage)

---

### `invoicesSlice`
Stocke la **liste des factures** et la facture en cours de consultation.

```
{ invoices: [...], currentInvoice: null, loading, error }
```
- `invoices` : tableau de toutes les factures accessibles à l'utilisateur
- `currentInvoice` : la facture sélectionnée/en cours d'édition
- Mise à jour optimiste : quand une facture est créée, elle est ajoutée localement AVANT que Firebase confirme (l'interface est instantanée)

---

### `clientsSlice`
Stocke la **liste des clients** de l'utilisateur connecté.

```
{ clients: [...], loading, error }
```
- Les clients sont **scopés par utilisateur** : chaque comptable ne voit que ses propres clients
- Synchronisé en temps réel via un listener Firebase (ajout/suppression visible instantanément)

---

### `notificationsSlice`
Stocke les **notifications in-app** (soumission, validation, rejet, paiement).

```
{ notifications: [...], pendingCount: 0 }
```
- `pendingCount` : nombre de factures en attente (affiché sur la carte KPI de l'admin)
- Fonctions : `addNotification`, `markAsRead`, `markAllAsRead`, `clearNotifications`
- Pas de thunks asynchrones ici — les notifications sont poussées par les services directement

---

### `settingsSlice`
Stocke les **paramètres de l'application** : configuration générale, devises, sociétés.

```
{ settings: { key: value }, currencies: [...], companies: [...], activeCurrency: "MAD", loading, error }
```
- `settings` : paramètres clé/valeur (ex: `default_currency: "MAD"`)
- `currencies` : liste des devises disponibles (MAD, EUR, USD...) avec taux de change
- `companies` : profils d'entreprise (pour le PDF)
- Source de données : **JSON Server** sur Railway (API REST mock)

---

## 5. FLUX PRINCIPAUX

---

### Flux 1 — Créer une facture

```
1. Comptable remplit InvoiceForm.jsx
   ↓
2. À chaque changement de ligne → billingEngine.calculateLine()
   calcule sous-total, remise, TVA, total ligne (précision Decimal.js)
   ↓
3. Panneau de droite → billingEngine.calculateInvoice()
   calcule total HT, remises, ventilation TVA, total TTC
   ↓
4. Clic "Soumettre" → formik.handleSubmit()
   ↓
5. Dispatch Redux → thunk createInvoice()
   ↓
6. firebaseService.createInvoice() → enregistre dans /factures
   Numéro auto-généré : FAC-2026-0042
   ↓
7. notificationService.triggerNotification('invoice_submitted', ...)
   → pousse une notification à l'admin dans /notifications/adminId
   ↓
8. Redux met à jour invoices[] → liste des factures rafraîchie
```

---

### Flux 2 — Valider une facture

```
1. Admin voit la facture en attente (NotificationBell ou dashboard)
   ↓
2. Admin clique "Valider" dans ValidationActions.jsx
   ↓
3. workflowService.canTransition('pending', 'validated', 'admin')
   → vérifie que la transition est autorisée ✓
   ↓
4. workflowService.transitionInvoice(...)
   → firebaseService.updateStatus() avec : statut, validated_by, validated_at
   ↓
5. emailService.sendInvoiceEmail(invoice, client, companySettings, agentName)
   → EmailJS envoie l'email au client avec le lien de sa facture
   → Firebase marque email_sent: true
   ↓
6. notificationService.triggerNotification('invoice_validated', ..., userId)
   → notification in-app envoyée au comptable
   ↓
7. Listener temps réel Firebase → InvoiceDetail se met à jour instantanément
   → Stepper passe à l'étape "Validée"
```

---

### Flux 3 — Paiement Stripe

```
1. Visiteur arrive sur PricingPage.jsx
   ↓
2. Choisit le plan (Basique / Pro / Entreprise) et le cycle (mensuel/annuel)
   ↓
3. Clic "Commencer" → CheckoutModal.jsx s'ouvre
   ↓
4. Rempli Nom, Email, numéro de carte (CardElement Stripe)
   ↓
5. Clic "Payer" → stripe.createPaymentMethod({ card, billing_details })
   → Stripe valide la carte sans la stocker côté application
   ↓
6. Si succès → écran de confirmation animé (coche verte)
   ↓
7. Clic "Créer mon compte" → navigate('/register')
   avec état { email, name, plan, fromPayment: true }
   ↓
8. RegisterPage.jsx pré-remplit l'email et le nom
   affiche "Paiement confirmé !" en alert vert
   → Compte Firebase créé et profil stocké dans /users
```

---

## 6. TECHNOLOGIES UTILISÉES

| Technologie | Rôle dans le projet |
|-------------|---------------------|
| **React 19** | Framework principal — construit toute l'interface avec des composants réutilisables |
| **Firebase** | Base de données temps réel + authentification — pas de serveur à gérer, synchronisation instantanée entre les utilisateurs |
| **MUI v9** | Bibliothèque de composants UI — fournit les boutons, tableaux, dialogues, icônes avec un style professionnel cohérent |
| **Redux Toolkit** | Gestionnaire d'état global — évite de passer les données de composant en composant, tout le monde lit depuis un seul "magasin" |
| **jsPDF + autoTable** | Génération de PDF côté client — crée des factures PDF professionnelles directement dans le navigateur, sans serveur |
| **Recharts** | Graphiques — camembert des statuts, courbe de tendance, barres des revenus mensuels, 100% responsive |
| **Decimal.js** | Précision arithmétique — évite les erreurs de virgule flottante dans les calculs financiers (0.1 + 0.2 ≠ 0.30000000000000004) |
| **EmailJS** | Envoi d'email sans serveur — envoie des emails directement depuis le navigateur lors de la validation d'une facture |
| **Stripe** | Paiement en ligne — intégration de formulaire de carte bancaire sécurisé (PCI DSS) sans jamais toucher les données de carte |
| **JSON Server** | API REST mock déployée sur Railway — simule un backend pour les paramètres, devises et catégories |

---

## 7. POINTS TECHNIQUES FORTS

---

### 1. Machine d'état du workflow de facturation
Le fichier `workflowService.js` implémente une **machine d'états finie** qui contrôle les transitions entre les statuts d'une facture. Il est impossible de passer directement de "Brouillon" à "Payée" ou d'aller dans le mauvais sens. Chaque transition vérifie le rôle de l'utilisateur. C'est une vraie logique métier encodée en code, pas juste des if/else éparpillés.

---

### 2. Calculs financiers précis avec Decimal.js
Toutes les opérations dans `billingEngine.js` utilisent `Decimal.js` au lieu des opérateurs JavaScript natifs. Dans une application financière, présenter un total de "1234.5700000001 MAD" au lieu de "1234.57 MAD" serait une faute professionnelle grave. Cette décision technique garantit une précision absolue.

---

### 3. Synchronisation temps réel multi-utilisateur
Grâce aux **listeners Firebase** (`onValue`), si un admin valide une facture sur son ordinateur, le comptable qui a la page ouverte sur le sien voit le statut changer **en direct**, sans recharger. C'est particulièrement visible dans `InvoiceDetail.jsx` avec le hook `useInvoiceListener`.

---

### 4. Production propre — zéro log en production
Le fichier `vite.config.js` est configuré avec `esbuild: { drop: ['console', 'debugger'] }` — lors du build de production, **tous les `console.log/warn/error` sont supprimés automatiquement** du code. Un utilisateur qui ouvre la console du navigateur ne voit rien. C'est une pratique professionnelle qui évite aussi de fuiter des informations sensibles.

---

### 5. Architecture services purs pour le tableau de bord
Toutes les fonctions de `dashboardService.js` sont des **fonctions pures** (même entrée → même sortie, aucun effet de bord). Cela signifie que les KPIs et graphiques peuvent être testés indépendamment sans Mock de base de données, et que les calculs sont déterministes. Si 3 développeurs appellent `computeAdminKPIs(mêmesFactures)` en même temps, ils obtiennent exactement le même résultat.

---

## 8. EXTRAITS DE CODE À MONTRER EN SOUTENANCE

---

### Extrait 1 — Machine d'états du workflow (`workflowService.js`)

```javascript
// Table de toutes les transitions autorisées
const TRANSITIONS = {
  draft:     { next: ['pending'],    actor: 'user'  },
  pending:   { next: ['validated', 'rejected'], actor: 'admin' },
  validated: { next: ['paid'],       actor: 'user'  },
  rejected:  { next: ['pending'],    actor: 'user'  },
  paid:      { next: [],             actor: null    },
};

// Vérifie si une transition est autorisée
function canTransition(currentStatus, targetStatus, userRole) {
  const rule = TRANSITIONS[currentStatus];
  if (!rule) return false;
  return rule.next.includes(targetStatus) && rule.actor === userRole;
}
```

**Explication ligne par ligne :**
- L'objet `TRANSITIONS` est une table de vérité : pour chaque statut, on définit les statuts suivants possibles ET quel rôle peut faire la transition.
- `paid` a un tableau `next: []` vide → c'est un **état terminal**, aucune transition possible.
- `canTransition` retourne simplement un booléen : la cible est-elle dans la liste ET est-ce le bon rôle ?
- C'est compact, lisible, et extensible : ajouter un nouveau statut = ajouter une ligne dans l'objet.

---

### Extrait 2 — Calcul d'une ligne de facture (`billingEngine.js`)

```javascript
function calculateLine(ligne, method, categoryTVARates = {}) {
  const qty  = new Decimal(ligne.quantite   || 0);
  const price = new Decimal(ligne.prix_unitaire || 0);
  const disc  = new Decimal(ligne.remise_ligne  || 0);

  const brut = qty.times(price);                      // Quantité × Prix unitaire
  const remiseMontant = brut.times(disc).dividedBy(100); // Montant de la remise
  const net  = brut.minus(remiseMontant);             // Sous-total après remise

  const tvaRate = method === 'category_tva'
    ? new Decimal(categoryTVARates[ligne.categorie_id] ?? DEFAULT_TVA)
    : new Decimal(DEFAULT_TVA);

  const tvaMontant = method === 'global_discount' ? new Decimal(0) : net.times(tvaRate).dividedBy(100);
  const totalLigne = net.plus(tvaMontant);

  return {
    sous_total_brut:  brut.toDecimalPlaces(2).toNumber(),
    remise_montant:   remiseMontant.toDecimalPlaces(2).toNumber(),
    sous_total_net:   net.toDecimalPlaces(2).toNumber(),
    tva_rate:         tvaRate.toNumber(),
    tva_montant:      tvaMontant.toDecimalPlaces(2).toNumber(),
    total_ligne:      totalLigne.toDecimalPlaces(2).toNumber(),
  };
}
```

**Explication ligne par ligne :**
- Tout est converti en objet `Decimal` dès le départ pour éviter les erreurs de virgule flottante.
- `brut = qty × price` : le sous-total brut avant remise.
- `remiseMontant` : montant en MAD de la remise (pas juste le %).
- `net` : ce qu'on facture vraiment après remise.
- Si la méthode est `global_discount`, on ne calcule **pas** de TVA par ligne (elle sera calculée sur le total global).
- Si méthode `category_tva`, le taux vient du paramètre — sinon 20% par défaut.
- `.toDecimalPlaces(2)` garantit exactement 2 décimales en sortie.

---

### Extrait 3 — Génération de numéro de facture automatique (`invoiceNumber.js`)

```javascript
export function generateInvoiceNumber(existingInvoices = []) {
  const year = new Date().getFullYear();          // Année courante (ex: 2026)

  const countThisYear = existingInvoices.filter(inv => {
    const num = inv.numero || '';
    return num.startsWith(`FAC-${year}-`);        // Compte les FAC-2026-xxx
  }).length;

  const next = countThisYear + 1;                 // Prochain numéro
  const padded = String(next).padStart(4, '0');   // "42" → "0042"

  return `FAC-${year}-${padded}`;                 // "FAC-2026-0042"
}
```

**Explication ligne par ligne :**
- `new Date().getFullYear()` récupère l'année courante (2026).
- On filtre les factures existantes pour ne garder que celles de cette année.
- `countThisYear + 1` donne le prochain numéro séquentiel.
- `padStart(4, '0')` formate le numéro sur 4 chiffres : 1 → "0001", 42 → "0042".
- Le résultat : une numérotation **lisible, triable, et unique par année** — exactement comme une vraie facture professionnelle.

---

*Document généré pour la soutenance PFA · FacturaPro · 2026*
