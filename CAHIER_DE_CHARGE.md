# Cahier des Charges — FacturaPro
### Application Web de Gestion de Facturation
**Version :** 1.0 — Projet de Fin d'Études (PFA)
**Auteur :** Eljazou Abdessamad
**Date :** Juillet 2026

---

## 1. Présentation du projet

### 1.1 Nom du projet
**FacturaPro** — Plateforme de gestion de facturation professionnelle

### 1.2 Contexte et problématique
La gestion manuelle des factures dans les PME et cabinets comptables génère des erreurs fréquentes, des pertes de documents, des retards de validation et une absence de traçabilité. Les solutions existantes sont soit trop complexes et coûteuses, soit trop limitées pour un usage professionnel.

FacturaPro répond à ce besoin en proposant une application web complète qui centralise la création, la validation, le suivi et l'archivage des factures, avec un workflow clair entre comptables et administrateurs, et une génération automatique de documents PDF conformes.

### 1.3 Objectifs généraux
- Digitaliser et automatiser le processus de facturation d'une entreprise
- Mettre en place un circuit de validation structuré (brouillon → soumission → validation/rejet → paiement)
- Permettre à plusieurs comptables de travailler en parallèle sur la même plateforme
- Offrir à l'administrateur une vue globale de l'activité via des tableaux de bord analytiques
- Générer des factures PDF professionnelles avec signature électronique et QR code de vérification
- Archiver automatiquement les factures clôturées par exercice annuel

### 1.4 Public cible
| Profil | Description |
|--------|-------------|
| **PME et TPE** | Entreprises de taille moyenne cherchant à structurer leur facturation |
| **Cabinets comptables** | Plusieurs comptables gérant des portefeuilles clients différents |
| **Directeurs financiers** | Administrateurs ayant besoin d'indicateurs de performance en temps réel |
| **Clients des entreprises** | Destinataires des factures (accès public en lecture seule via QR code) |

---

## 2. Acteurs du système

### 2.1 Liste des acteurs

Le système comporte **3 acteurs** :

| Acteur | Code rôle | Description |
|--------|-----------|-------------|
| **Visiteur** | — | Utilisateur non connecté accédant à la page publique |
| **Comptable** | `user` | Agent créant et gérant ses propres factures |
| **Administrateur** | `admin` | Responsable validant les factures et gérant la plateforme |

### 2.2 Rôle de chaque acteur

**Visiteur**
Accède à la page d'accueil (tarification), à la page de connexion, d'inscription, et aux pages publiques de factures (consultation via QR code). Ne peut effectuer aucune opération sur les données.

**Comptable (user)**
Acteur opérationnel de la facturation. Il crée et gère ses propres factures, ses clients et ses brouillons. Il soumet ses factures pour validation, suit leur état d'avancement, et marque les factures validées comme payées.

**Administrateur (admin)**
Acteur de supervision et de validation. Il dispose d'une vue globale sur toutes les factures de tous les comptables. Il valide ou rejette les factures soumises, gère les utilisateurs, configure les paramètres de l'application, et archive les exercices comptables.

### 2.3 Permissions par rôle

| Action | Visiteur | Comptable | Admin |
|--------|:--------:|:---------:|:-----:|
| Voir la page tarification | ✅ | ✅ | ✅ |
| Se connecter / s'inscrire | ✅ | — | — |
| Consulter une facture publique (QR) | ✅ | ✅ | ✅ |
| Créer une facture | ❌ | ✅ | ❌ |
| Modifier une facture (brouillon/rejetée) | ❌ | ✅ (siennes) | ❌ |
| Supprimer une facture (brouillon/rejetée) | ❌ | ✅ (siennes) | ❌ |
| Soumettre une facture | ❌ | ✅ | ❌ |
| Valider / Rejeter une facture | ❌ | ❌ | ✅ |
| Marquer une facture comme payée | ❌ | ✅ | ❌ |
| Re-soumettre une facture rejetée | ❌ | ✅ | ❌ |
| Voir ses propres factures | ❌ | ✅ | ✅ |
| Voir TOUTES les factures | ❌ | ❌ | ✅ |
| Gérer ses clients | ❌ | ✅ | ✅ |
| Gérer le catalogue articles | ❌ | ❌ | ✅ |
| Gérer les utilisateurs | ❌ | ❌ | ✅ |
| Configurer les paramètres | ❌ | ❌ | ✅ |
| Archiver un exercice annuel | ❌ | ❌ | ✅ |
| Accéder au tableau de bord admin | ❌ | ❌ | ✅ |
| Télécharger un PDF | ❌ | ✅ (validée/payée) | ✅ |
| Exporter en Excel | ❌ | ✅ | ✅ |
| Gérer son profil | ❌ | ✅ | ✅ |

---

## 3. Besoins fonctionnels

### Module Authentification

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-01** | L'utilisateur peut s'inscrire avec email, mot de passe, nom complet et rôle (comptable ou admin) | Visiteur | Must |
| **BF-02** | L'utilisateur peut se connecter avec email et mot de passe | Visiteur | Must |
| **BF-03** | L'application affiche des messages d'erreur clairs en français (pas les codes Firebase bruts) | Tous | Must |
| **BF-04** | L'utilisateur peut réinitialiser son mot de passe par email | Tous | Must |
| **BF-05** | Un utilisateur connecté est automatiquement redirigé vers son tableau de bord selon son rôle | Tous | Must |
| **BF-06** | La session est persistée entre les rechargements de page (Firebase Auth) | Tous | Must |
| **BF-07** | Les routes protégées redirigent vers `/login` si l'utilisateur n'est pas connecté | Système | Must |
| **BF-08** | Les routes admin redirigent vers `/unauthorized` si le rôle est insuffisant | Système | Must |

---

### Module Clients

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-09** | Le comptable peut créer un client (nom, email, téléphone, adresse) | Comptable | Must |
| **BF-10** | Le comptable peut modifier et supprimer ses clients | Comptable | Must |
| **BF-11** | La liste des clients est synchronisée en temps réel | Comptable | Must |
| **BF-12** | Le comptable peut rechercher un client par nom ou email | Comptable | Should |
| **BF-13** | Les clients sont scopés par utilisateur (chaque comptable gère les siens) | Système | Must |

---

### Module Factures

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-14** | Le comptable peut créer une facture avec : client, méthode de calcul, devise, date, lignes d'articles | Comptable | Must |
| **BF-15** | Le numéro de facture est généré automatiquement au format `FAC-YYYY-XXXX` | Système | Must |
| **BF-16** | Le panneau de totaux (HT, remise, TVA, TTC) se met à jour en temps réel à chaque modification de ligne | Système | Must |
| **BF-17** | Le comptable peut ajouter/supprimer des lignes d'articles dynamiquement | Comptable | Must |
| **BF-18** | Le comptable peut sauvegarder une facture en brouillon ou la soumettre directement | Comptable | Must |
| **BF-19** | Le comptable peut modifier une facture en statut brouillon ou rejeté | Comptable | Must |
| **BF-20** | Le comptable peut supprimer une facture en statut brouillon ou rejeté | Comptable | Must |
| **BF-21** | La liste des factures affiche : numéro, date, client, montant TTC, statut | Tous | Must |
| **BF-22** | La liste des factures est filtrable par statut, plage de dates, et recherche textuelle | Tous | Must |
| **BF-23** | La vue détail d'une facture affiche toutes les informations avec un stepper de progression | Tous | Must |
| **BF-24** | La vue détail est synchronisée en temps réel (un autre utilisateur qui modifie la facture met la page à jour) | Système | Must |
| **BF-25** | Les factures en retard de paiement (>30 jours) sont signalées avec un badge | Système | Should |
| **BF-26** | La liste admin affiche l'avatar et le nom du comptable créateur | Admin | Should |

---

### Module Méthodes de Calcul

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-27** | Le système supporte la méthode **Simple** : TVA fixe à 20% sur chaque ligne | Système | Must |
| **BF-28** | Le système supporte la méthode **Remise par ligne** : chaque ligne a son propre pourcentage de remise | Système | Must |
| **BF-29** | Le système supporte la méthode **Remise globale** : une remise unique appliquée sur le total HT avant TVA | Système | Must |
| **BF-30** | Le système supporte la méthode **TVA par catégorie** : chaque catégorie d'article a un taux de TVA configuré (0%, 7%, 10%, 14%, 20%) | Système | Must |
| **BF-31** | Tous les calculs utilisent `Decimal.js` pour garantir une précision financière absolue | Système | Must |

---

### Module Workflow & Validation

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-32** | Le comptable peut soumettre une facture brouillon pour validation | Comptable | Must |
| **BF-33** | L'administrateur peut valider une facture soumise | Admin | Must |
| **BF-34** | L'administrateur peut rejeter une facture avec un motif obligatoire (minimum 10 caractères) | Admin | Must |
| **BF-35** | Le comptable peut re-soumettre une facture rejetée après correction (le motif de rejet s'affiche) | Comptable | Must |
| **BF-36** | Le comptable peut marquer une facture validée comme payée avec : date, type de virement, référence | Comptable | Must |
| **BF-37** | Les transitions non autorisées sont bloquées par la machine d'état (`workflowService.canTransition`) | Système | Must |
| **BF-38** | Les règles de transition sont également enforced au niveau des règles de sécurité Firebase | Système | Must |

---

### Module PDF & Documents

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-39** | Le système génère un PDF professionnel pour les factures validées et payées | Système | Must |
| **BF-40** | Le PDF inclut : en-tête entreprise, infos client, tableau des lignes, totaux, signature, QR code | Système | Must |
| **BF-41** | Le PDF peut être téléchargé ou prévisualisé dans un nouvel onglet | Comptable, Admin | Must |
| **BF-42** | Le logo de l'entreprise (uploadé en base64) est intégré dans le PDF | Admin | Should |
| **BF-43** | Le PDF affiche un badge coloré selon le statut de la facture | Système | Should |
| **BF-44** | Le PDF supporte plusieurs devises (MAD, EUR, USD...) | Système | Should |

---

### Module Signature Électronique

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-45** | Le comptable peut signer électroniquement une facture via un canvas dessin | Comptable | Must |
| **BF-46** | La signature est stockée en base64 PNG et persistée dans Firebase | Système | Must |
| **BF-47** | La signature est intégrée dans le PDF généré | Système | Must |
| **BF-48** | Le comptable peut effacer et refaire sa signature | Comptable | Should |

---

### Module QR Code

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-49** | Chaque facture dispose d'un QR code unique pointant vers sa page publique | Système | Must |
| **BF-50** | La page publique `/p/invoice/:id` est accessible sans authentification | Visiteur | Must |
| **BF-51** | Le QR code est intégré dans le PDF et visible dans la vue détail | Système | Must |
| **BF-52** | L'URL du QR est configurable via `VITE_PUBLIC_URL` pour les environnements de production | Système | Should |

---

### Module Notifications

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-53** | L'admin reçoit une notification in-app quand un comptable soumet une facture | Admin | Must |
| **BF-54** | Le comptable reçoit une notification quand sa facture est validée ou rejetée | Comptable | Must |
| **BF-55** | Les notifications non lues affichent un badge rouge sur la cloche | Tous | Must |
| **BF-56** | Le clic sur une notification marque comme lu et navigue vers la facture concernée | Tous | Must |
| **BF-57** | L'admin peut voir le nombre de factures en attente sur sa carte KPI (avec point rouge clignotant) | Admin | Should |
| **BF-58** | Les notifications soumises hors ligne sont détectées au retour de connexion (localStorage) | Admin | Should |

---

### Module Email

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-59** | Un email est envoyé automatiquement au client lors de la validation d'une facture | Système | Must |
| **BF-60** | L'email contient : numéro, date, montant TTC, lien direct vers la page publique | Système | Must |
| **BF-61** | Si l'envoi email échoue, la validation est quand même confirmée (best-effort) | Système | Should |
| **BF-62** | La facture est marquée `email_sent: true` après envoi réussi | Système | Should |

---

### Module Tableau de Bord Comptable

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-63** | Le tableau de bord affiche les KPIs : total factures, montant encaissé, en attente, rejetées | Comptable | Must |
| **BF-64** | Un graphique en donut montre la répartition des factures par statut | Comptable | Must |
| **BF-65** | Un graphique de tendance mensuelle montre l'évolution sur l'année sélectionnée | Comptable | Should |
| **BF-66** | Les 5 dernières factures sont affichées avec accès rapide | Comptable | Must |
| **BF-67** | Le fil d'activité récente liste les derniers événements sur les factures | Comptable | Should |
| **BF-68** | Les filtres (date, devise) sont appliqués à tous les KPIs simultanément | Comptable | Should |
| **BF-69** | Un résumé financier (Total HT, TVA, moyenne) est affiché | Comptable | Should |

---

### Module Tableau de Bord Admin

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-70** | L'admin dispose de KPIs globaux : toutes factures, total encaissé, taux de validation, taux de rejet | Admin | Must |
| **BF-71** | Un graphique à barres affiche les revenus mensuels pour l'année sélectionnée | Admin | Must |
| **BF-72** | Un tableau de performance par agent liste : nb factures, CA, taux de validation | Admin | Must |
| **BF-73** | Le top 3 des clients par CA encaissé est affiché avec médailles | Admin | Should |
| **BF-74** | Les factures en attente sont listées avec des boutons d'action inline (valider/rejeter sans quitter le dashboard) | Admin | Must |
| **BF-75** | Le fil d'activité global liste les événements de tous les agents | Admin | Should |

---

### Module Articles & Catalogue

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-76** | L'admin peut créer, modifier et supprimer des articles (nom, description, prix, catégorie) | Admin | Must |
| **BF-77** | Les articles sont organisés par catégories | Admin | Must |
| **BF-78** | L'admin peut configurer le taux de TVA par catégorie (0%, 7%, 10%, 14%, 20%) | Admin | Must |
| **BF-79** | Le comptable peut sélectionner un article depuis l'autocomplete du formulaire de facture | Comptable | Must |
| **BF-80** | Les prix des articles se pré-remplissent automatiquement dans les lignes de facture | Système | Must |

---

### Module Paramètres

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-81** | L'admin peut configurer les informations de l'entreprise : nom, adresse, ICE, RC, IF, téléphone, email | Admin | Must |
| **BF-82** | L'admin peut uploader le logo de l'entreprise (compressé automatiquement en base64) | Admin | Should |
| **BF-83** | L'admin peut gérer les devises : code, symbole, taux de change par rapport au MAD | Admin | Must |
| **BF-84** | L'admin peut configurer l'email par défaut et les informations d'archivage | Admin | Should |

---

### Module Archive

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-85** | L'admin peut archiver toutes les factures payées/validées d'un exercice annuel | Admin | Must |
| **BF-86** | L'archivage est irréversible et présente un dialogue de confirmation | Admin | Must |
| **BF-87** | Les archives sont consultables par année avec recherche et filtres | Admin | Must |
| **BF-88** | Les factures archivées peuvent être téléchargées en PDF et exportées en Excel | Admin | Must |

---

### Module Export

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-89** | Le comptable peut exporter ses factures filtrées en fichier Excel (`.xlsx`) | Comptable | Must |
| **BF-90** | L'admin peut exporter les archives par exercice annuel | Admin | Must |

---

### Module Gestion des Utilisateurs (Admin)

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-91** | L'admin peut voir la liste de tous les utilisateurs inscrits | Admin | Must |
| **BF-92** | L'admin peut modifier le rôle d'un utilisateur (comptable ↔ admin) | Admin | Must |
| **BF-93** | L'admin peut désactiver un compte utilisateur | Admin | Should |

---

### Module Profil

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-94** | L'utilisateur peut modifier son nom d'affichage | Tous | Should |
| **BF-95** | L'utilisateur peut changer son mot de passe (nécessite confirmation de l'ancien) | Tous | Should |

---

### Module Tarification & Paiement

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-96** | La page de tarification présente 3 plans : Basique (100 MAD/mois), Pro (200 MAD/mois), Entreprise (300 MAD/mois) | Visiteur | Must |
| **BF-97** | Un toggle permet de basculer entre facturation mensuelle et annuelle (−20% annuel) | Visiteur | Must |
| **BF-98** | Le modal de paiement Stripe permet de saisir les informations bancaires de façon sécurisée | Visiteur | Must |
| **BF-99** | Après paiement réussi, l'utilisateur est redirigé vers l'inscription avec email pré-rempli | Visiteur | Must |

---

### Module Recherche Globale

| ID | Description | Acteur | Priorité |
|----|-------------|--------|----------|
| **BF-100** | La barre de recherche dans le Topbar permet de chercher parmi les factures et les clients | Tous | Should |
| **BF-101** | Les résultats s'affichent en dropdown groupé (Factures / Clients) avec navigation directe | Tous | Should |

---

## 4. Besoins non fonctionnels

### 4.1 Performance
- **Lazy loading :** Toutes les pages lourdes sont chargées à la demande (React `lazy` + `Suspense`) pour réduire le bundle initial
- **Memoïsation :** Les calculs coûteux (KPIs, graphiques, filtres) utilisent `useMemo` pour éviter les recalculs inutiles
- **Suppression des logs :** En production, tous les `console.log/warn/error` sont éliminés par `esbuild.drop: ['console', 'debugger']` dans `vite.config.js`
- **Optimisation des images :** Le logo entreprise est compressé automatiquement avant stockage (utilitaire `imageCompress.js`)
- **Temps de chargement cible :** Moins de 2 secondes pour l'affichage initial de l'application

### 4.2 Sécurité
- **Règles Firebase :** Chaque nœud de la base de données est protégé par des règles déclaratives enforced côté serveur (pas seulement côté client)
- **Isolation des données :** Un comptable ne peut accéder qu'à ses propres clients et factures — enforced à la fois côté UI et dans les règles Firebase
- **Contrôle des transitions :** Les transitions de statut sensibles (validated_by, rejected_by) ne peuvent être écrites que par un admin — enforced dans Firebase
- **Authentification Firebase :** Token JWT vérifié côté serveur à chaque requête
- **Variables sensibles :** Toutes les clés API (Firebase, Stripe, EmailJS) sont dans `.env` et non commitées
- **Stripe PCI DSS :** Les données de carte bancaire ne transitent jamais par notre application (CardElement Stripe)
- **Erreurs d'authentification :** Les messages d'erreur ne révèlent pas d'informations sensibles (codes Firebase traduits en français générique)

### 4.3 Disponibilité
- **Hébergement :** Firebase Hosting (CDN mondial, 99.95% SLA)
- **Base de données :** Firebase Realtime Database (99.95% SLA)
- **API mock :** JSON Server déployé sur Railway (disponibilité best-effort)
- **Mode dégradé :** Si l'API JSON Server est hors ligne, le formulaire de facture reste utilisable (articles saisis manuellement)

### 4.4 Responsive Design
- L'application est entièrement responsive et fonctionnelle sur mobile, tablette et desktop
- Utilisation des breakpoints MUI : `xs` (mobile), `sm` (tablette), `md` (desktop)
- Les filtres du tableau de bord ont deux mises en page distinctes : 2 lignes sur mobile, 1 ligne sur desktop
- La barre de navigation latérale (Sidebar) est collapsée sur mobile

### 4.5 Compatibilité navigateurs
| Navigateur | Support |
|-----------|---------|
| Google Chrome 90+ | ✅ Complet |
| Mozilla Firefox 88+ | ✅ Complet |
| Microsoft Edge 90+ | ✅ Complet |
| Safari 14+ | ✅ Complet |
| Internet Explorer | ❌ Non supporté |

---

## 5. Architecture technique

### 5.1 Stack complet avec justification

| Couche | Technologie | Version | Justification |
|--------|------------|---------|---------------|
| **Framework UI** | React | 19 | Composants réutilisables, grande communauté, hooks modernes |
| **Composants UI** | Material UI (MUI) | 9 | Design system professionnel, responsive natif, icônes intégrées |
| **Grille de données** | MUI X DataGrid | 9 | Tri, pagination, filtres, export intégrés nativement |
| **État global** | Redux Toolkit | 2.11 | Gestion d'état prévisible, DevTools, thunks async simplifiés |
| **Routing** | React Router | 7 | Navigation SPA, routes protégées, lazy loading |
| **Validation formulaires** | Formik + Yup | 2.4 / 1.7 | Validation déclarative, intégration MUI, gestion erreurs |
| **Base de données** | Firebase RTDB | 12 | Temps réel sans polling, authentification intégrée, SDK client |
| **Authentification** | Firebase Auth | 12 | JWT, persistance session, réinitialisation mot de passe |
| **PDF** | jsPDF + autoTable | 4.2 / 5.0 | Génération côté client, tableaux formatés, pas de serveur nécessaire |
| **QR Code** | qrcode + qrcode.react | 1.5 / 4.2 | Génération SVG côté client, intégration PDF et UI |
| **Graphiques** | Recharts | 3.8 | Responsive natif, compatible React, personnalisable |
| **Précision calculs** | Decimal.js | 10.6 | Arithmétique financière sans erreurs de virgule flottante |
| **Email** | EmailJS | 4.4 | Envoi email sans serveur backend, templates configurables |
| **Paiement** | Stripe | 9.8 | PCI DSS, CardElement securisé, mode test disponible |
| **Export Excel** | xlsx | 0.18 | Génération `.xlsx` côté client, pas de dépendance serveur |
| **Signature** | react-signature-canvas | 1.1 | Canvas HTML5, export base64 PNG |
| **API mock** | JSON Server | 1.0-beta | REST API sur fichier JSON, déployable sur Railway |
| **Build** | Vite | 8 | HMR rapide, optimisation esbuild, tree-shaking |
| **Tests** | Vitest | 4.1 | Compatible Vite, runner Jest-compatible |

### 5.2 Schéma des couches

```
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION (React)                  │
│  pages/ · features/ · components/                               │
│  MUI v9 · Recharts · react-signature-canvas · qrcode.react     │
└────────────────────────┬────────────────────────────────────────┘
                         │ dispatch / useSelector
┌────────────────────────▼────────────────────────────────────────┐
│                   COUCHE ÉTAT (Redux Toolkit)                   │
│  authSlice · invoicesSlice · clientsSlice                       │
│  notificationsSlice · settingsSlice · toastSlice                │
└────────────────────────┬────────────────────────────────────────┘
                         │ appel de services
┌────────────────────────▼────────────────────────────────────────┐
│                  COUCHE SERVICES (logique métier)                │
│  firebaseService · billingEngine · workflowService              │
│  pdfGenerator · emailService · dashboardService                 │
│  archiveService · exportService · notificationService           │
└──────────────────┬─────────────────────────┬───────────────────┘
                   │                         │
    ┌──────────────▼──────────────┐  ┌───────▼──────────────────┐
    │   Firebase Realtime DB      │  │   JSON Server (Railway)   │
    │   + Firebase Auth           │  │   /settings · /currencies │
    │   /factures · /clients      │  │   /categories · /companies│
    │   /users · /notifications   │  └──────────────────────────┘
    │   /companySettings          │
    └─────────────────────────────┘
```

### 5.3 Firebase vs JSON Server — Pourquoi deux backends ?

**Firebase Realtime Database** est utilisé pour toutes les données métier critiques :
- Factures, clients, utilisateurs, notifications, paramètres entreprise
- **Pourquoi :** Synchronisation temps réel entre utilisateurs, règles de sécurité côté serveur, authentification intégrée, pas de serveur à gérer

**JSON Server (Railway)** est utilisé pour les données de configuration :
- Devises, catégories d'articles, paramètres généraux, catalogue articles
- **Pourquoi :** Ces données ne nécessitent pas de temps réel ni de règles de sécurité complexes. JSON Server sur Railway offre une API REST simple, gratuite, déployable en quelques minutes sur un fichier `db.json`

---

## 6. Règles métier

### 6.1 Les 4 méthodes de calcul

#### Méthode 1 — Simple
Chaque ligne de facture supporte une TVA fixe de **20%**. Aucune remise.

```
Total ligne = Quantité × Prix unitaire
TVA ligne   = Total ligne × 20%
Total TTC   = Σ(Total ligne + TVA ligne)
```

#### Méthode 2 — Remise par ligne (`line_discount`)
Chaque ligne peut avoir son propre pourcentage de remise. La TVA (20%) est calculée sur le montant après remise.

```
Sous-total brut  = Quantité × Prix unitaire
Montant remise   = Sous-total brut × (Remise% / 100)
Sous-total net   = Sous-total brut − Montant remise
TVA ligne        = Sous-total net × 20%
Total ligne      = Sous-total net + TVA ligne
```

#### Méthode 3 — Remise globale (`global_discount`)
Une remise unique est appliquée sur le total HT de toutes les lignes. La TVA est calculée sur le total après remise globale.

```
Total HT              = Σ(Quantité × Prix unitaire) [sans TVA ligne]
Remise globale (MAD)  = Total HT × (Remise globale% / 100)
Total HT après remise = Total HT − Remise globale
TVA (20%)             = Total HT après remise × 20%
Total TTC             = Total HT après remise + TVA
```

#### Méthode 4 — TVA par catégorie (`category_tva`)
Chaque catégorie d'article a son propre taux de TVA configuré par l'admin (0%, 7%, 10%, 14%, ou 20%). La TVA est ventilée par taux dans le récapitulatif.

```
Pour chaque ligne :
  TVA ligne = Sous-total net × (Taux TVA de la catégorie / 100)

Ventilation TVA :
  { "7%": montant_total_tva_7, "20%": montant_total_tva_20, ... }

Total TTC = Σ(Total HT ligne + TVA ligne)
```

> **Note :** Tous les calculs utilisent `Decimal.js` pour garantir la précision à la centième près, sans erreurs de virgule flottante JavaScript.

---

### 6.2 Workflow des factures (machine d'état)

```
┌──────────┐    soumettre()     ┌─────────┐
│  DRAFT   │ ──────────────────▶│ PENDING │
│ Brouillon│                    │En attente│
└──────────┘                    └────┬────┘
     ▲                               │
     │  modifier()                   ├─── valider() [admin]  ──▶ VALIDATED
     │  re-soumettre()               │                           Validée
     │                               └─── rejeter() [admin]  ──▶ REJECTED
     │                                                            Rejetée
     │                                                              │
     └──────────────────────────────────────────────────────────── ┘
                              (re-soumettre)

VALIDATED ──── marquer_payée() [comptable] ──▶ PAID
Validée                                         Payée (terminal)
```

| Transition | Acteur autorisé | Données supplémentaires requises |
|-----------|-----------------|----------------------------------|
| draft → pending | Comptable | — |
| pending → validated | Admin | `validated_by`, `validated_at` |
| pending → rejected | Admin | `rejection_reason` (min 10 car.), `rejected_by`, `rejected_at` |
| rejected → pending | Comptable | Efface `rejection_reason` |
| validated → paid | Comptable | `date_encaissement`, `type_virement`, `reference_paiement` |

---

### 6.3 Génération du numéro de facture `FAC-YYYY-XXXX`

```
1. Lire l'année courante (ex: 2026)
2. Compter les factures existantes commençant par "FAC-2026-"
3. Incrémenter ce compte de 1
4. Formater sur 4 chiffres avec zéros de remplissage
5. Concaténer : "FAC-" + année + "-" + numéro_4_chiffres

Exemples : FAC-2026-0001, FAC-2026-0042, FAC-2026-0100
```

La numérotation repart à 0001 chaque nouvelle année.

---

### 6.4 Règles de validation par rôle

| Règle | Détail |
|-------|--------|
| **Création** | Uniquement les comptables (`user`). Les admins ne peuvent pas créer de factures. |
| **Modification** | Uniquement le propriétaire de la facture, uniquement si statut `draft` ou `rejected`. |
| **Suppression** | Uniquement le propriétaire, uniquement si statut `draft` ou `rejected`. |
| **Soumission** | Uniquement le propriétaire (comptable), depuis le statut `draft` ou `rejected`. |
| **Validation/Rejet** | Uniquement les admins, depuis le statut `pending`. |
| **Marquer payée** | Uniquement le comptable propriétaire, depuis le statut `validated`. |
| **Retard** | Une facture `pending` ou `validated` depuis plus de 30 jours est considérée en retard. |
| **Motif de rejet** | Texte obligatoire, minimum 10 caractères, trimé. |
| **PDF** | Disponible uniquement pour les statuts `validated` et `paid`. |

---

## 7. Interfaces principales

### 7.1 Pages publiques (sans authentification)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `SmartHome` in `AppRouter.jsx` | Redirige les utilisateurs connectés vers leur dashboard ; affiche PricingPage aux visiteurs |
| `/pricing` | `src/pages/PricingPage.jsx` | Page de tarification avec 3 plans, toggle mensuel/annuel, effets animés, modal de contact |
| `/login` | `src/features/auth/LoginPage.jsx` | Formulaire de connexion avec gestion des erreurs en français et réinitialisation de mot de passe |
| `/register` | `src/features/auth/RegisterPage.jsx` | Formulaire d'inscription avec choix du rôle |
| `/p/invoice/:id` | `src/features/invoices/PublicInvoicePage.jsx` | Page publique de consultation d'une facture (accessible via QR code, sans connexion) |
| `/unauthorized` | `src/components/UnauthorizedPage.jsx` | Page d'accès refusé (rôle insuffisant) |

### 7.2 Pages protégées — Rôle comptable (user)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/dashboard` | `src/features/dashboard/UserDashboard.jsx` | Tableau de bord personnel : KPIs, graphiques, activité récente |
| `/clients` | `src/features/clients/ClientListPage.jsx` | Gestion du carnet de clients (CRUD avec tableau et formulaire modal) |
| `/invoices` | `src/features/invoices/InvoiceListPage.jsx` | Liste des factures avec filtres et actions contextuelles |
| `/invoices/new` | `src/features/invoices/InvoiceCreatePage.jsx` | Formulaire de création de facture |
| `/invoices/:id` | `src/features/invoices/InvoiceDetailPage.jsx` | Vue détaillée d'une facture avec toutes ses informations et actions |
| `/invoices/:id/edit` | `src/features/invoices/InvoiceCreatePage.jsx` | Formulaire de modification (même composant que création, en mode édition) |
| `/profile` | `src/features/profile/ProfilePage.jsx` | Page de profil : modification nom, changement de mot de passe |

### 7.3 Pages protégées — Rôle admin uniquement

| Route | Fichier | Description |
|-------|---------|-------------|
| `/admin/dashboard` | `src/features/dashboard/AdminDashboard.jsx` | Tableau de bord global : KPIs, revenus mensuels, performance agents, factures en attente |
| `/admin/users` | `src/features/admin/UserManagementPage.jsx` | Gestion des utilisateurs inscrits (modification de rôle) |
| `/admin/articles` | `src/features/articles/ArticleListPage.jsx` | Catalogue d'articles avec catégories et TVA par catégorie |
| `/admin/settings` | `src/features/settings/SettingsPage.jsx` | Paramètres : entreprise, TVA, devises, email, archivage (onglets) |
| `/archive` | `src/features/archive/ArchivePage.jsx` | Archivage annuel des factures + consultation des archives par exercice |

### 7.4 Composants de layout

| Composant | Fichier | Description |
|-----------|---------|-------------|
| AppLayout | `src/components/layout/AppLayout.jsx` | Wrapper principal : Sidebar + Topbar + zone de contenu |
| Sidebar | `src/components/layout/Sidebar.jsx` | Navigation latérale avec items selon le rôle |
| Topbar | `src/components/layout/Topbar.jsx` | Barre supérieure : recherche globale, cloche notifications, menu profil |

---

## 8. Contraintes techniques

### 8.1 Technologies imposées
- **React** pour le framework frontend (SPA)
- **Firebase** pour la base de données et l'authentification (serverless)
- **Vite** pour le build (performance, HMR)
- **MUI v9** pour les composants UI (cohérence visuelle)

### 8.2 Variables d'environnement requises

Le fichier `.env` à la racine du projet doit contenir les variables suivantes :

```env
# Firebase — configuration du projet Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# EmailJS — service d'envoi d'email
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...

# URL publique pour QR codes et liens email
VITE_PUBLIC_URL=https://votre-domaine.web.app

# JSON Server — API de configuration (Railway)
VITE_JSON_SERVER_URL=https://votre-projet.up.railway.app

# Stripe — paiement (clé publique uniquement, mode test)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

> ⚠️ Le fichier `.env` ne doit **jamais** être commité dans le dépôt Git (il est dans `.gitignore`).

### 8.3 Dépendances externes et leurs rôles

| Service | Rôle | Mode |
|---------|------|------|
| **Firebase Authentication** | Gestion des comptes utilisateurs, sessions JWT | Production |
| **Firebase Realtime Database** | Stockage temps réel de toutes les données métier | Production |
| **Firebase Hosting** | Hébergement de l'application React buildée | Production |
| **EmailJS** | Envoi d'emails de confirmation au client lors de la validation | Production |
| **Stripe** | Traitement des paiements de l'abonnement FacturaPro | Test (pas de vrais paiements) |
| **Railway** | Hébergement du JSON Server (API mock de configuration) | Production |

### 8.4 Commandes de développement

```bash
npm run dev      # Démarrer le serveur de développement (port 5173)
npm run api      # Démarrer JSON Server localement (port 3001)
npm run build    # Builder pour la production
npm run preview  # Prévisualiser le build de production
npm run lint     # Linter ESLint
```

### 8.5 Déploiement

```bash
# Déployer sur Firebase Hosting
npx firebase-tools deploy --only hosting

# Le build est dans dist/ (généré par npm run build)
```

---

## 9. Livrables

### 9.1 Application déployée
- **URL de production :** `https://facturation-ae9d3.web.app`
- **Hébergement :** Firebase Hosting (CDN mondial, HTTPS automatique)
- **Statut :** Déployée et fonctionnelle

### 9.2 Rapport PFA
Document technique décrivant :
- La problématique et les objectifs
- L'architecture et les choix technologiques
- Les fonctionnalités développées
- Les difficultés rencontrées et les solutions apportées
- Les perspectives d'amélioration

### 9.3 Présentation soutenance
- **Fichier :** `PRESENTATION.md` à la racine du projet
- Explication de l'architecture pour le jury
- Description des composants principaux
- Flux de données principaux (création facture, validation, paiement)
- Extraits de code commentés

### 9.4 Tests

Le projet inclut des tests unitaires pour les modules critiques :

| Fichier de test | Module testé | Ce qui est testé |
|----------------|-------------|-----------------|
| `billingEngine.test.js` | `utils/billingEngine.js` | Calculs des 4 méthodes de facturation, précision Decimal.js |
| `workflowService.test.js` | `services/workflowService.js` | Transitions autorisées/bloquées selon statut et rôle |
| `dashboardService.test.js` | `services/dashboardService.js` | Calculs KPIs, agrégation des données |

**Plan de smoke test (14 étapes) :**
1. Accéder à `https://facturation-ae9d3.web.app` — PricingPage visible
2. Naviguer vers `/login` — formulaire de connexion
3. Se connecter avec un compte comptable valide
4. Accéder au dashboard `/dashboard` — KPIs affichés
5. Créer un client via `/clients`
6. Créer une facture via `/invoices/new` — vérifier calcul des totaux
7. Sauvegarder en brouillon — vérifier numéro auto `FAC-YYYY-XXXX`
8. Soumettre la facture — vérifier notification admin
9. Se connecter en admin sur un autre onglet
10. Valider la facture depuis le dashboard admin
11. Vérifier réception email (ou mock EmailJS)
12. Comptable marque la facture comme payée
13. Télécharger le PDF — vérifier contenu (signature, QR, totaux)
14. Scanner le QR code — vérifier page publique `/p/invoice/:id`

---

## 10. Glossaire

| Terme | Définition |
|-------|------------|
| **Facture (Facture)** | Document commercial officiel attestant d'une vente ou prestation de service, avec montants HT, TVA et TTC |
| **HT (Hors Taxes)** | Montant d'une facture avant application de la taxe sur la valeur ajoutée (TVA) |
| **TTC (Toutes Taxes Comprises)** | Montant final incluant la TVA — c'est ce que paie le client |
| **TVA (Taxe sur la Valeur Ajoutée)** | Taxe collectée par l'entreprise et reversée à l'État. Taux standard au Maroc : 20% |
| **ICE** | Identifiant Commun de l'Entreprise — numéro fiscal unique au Maroc |
| **RC** | Registre de Commerce — numéro d'immatriculation de l'entreprise |
| **IF** | Identifiant Fiscal — numéro attribué par l'administration fiscale marocaine |
| **Brouillon (Draft)** | Premier statut d'une facture — en cours de rédaction, non soumise |
| **En attente (Pending)** | Facture soumise par le comptable, en attente de validation par l'administrateur |
| **Validée (Validated)** | Facture approuvée par l'admin — le client peut être contacté et payer |
| **Rejetée (Rejected)** | Facture refusée par l'admin avec un motif — le comptable doit la corriger |
| **Payée (Paid)** | Facture dont le paiement a été encaissé — statut terminal |
| **Machine d'état** | Système informatique qui contrôle les transitions entre états autorisés selon des règles précises |
| **Workflow** | Enchaînement structuré d'étapes pour réaliser un processus métier |
| **Redux** | Bibliothèque de gestion d'état global pour applications JavaScript |
| **Thunk** | Fonction asynchrone Redux permettant d'effectuer des appels API dans les actions |
| **Slice** | Portion du store Redux gérant un domaine fonctionnel (auth, factures, clients...) |
| **Firebase RTDB** | Firebase Realtime Database — base de données NoSQL en temps réel hébergée par Google |
| **Listener** | Abonnement Firebase qui notifie l'application en temps réel de tout changement de données |
| **JWT** | JSON Web Token — token d'authentification sécurisé utilisé par Firebase Auth |
| **API REST** | Architecture d'API utilisant les verbes HTTP (GET, POST, PUT, DELETE) sur des ressources |
| **base64** | Encodage binaire en texte ASCII — utilisé pour stocker images (logo, signature) dans la base de données |
| **QR Code** | Code matriciel encodant une URL, scannable par téléphone pour accéder à la facture publique |
| **PDF** | Portable Document Format — format de document non modifiable pour les factures officielles |
| **Lazy loading** | Chargement différé — les pages ne sont chargées que quand l'utilisateur les consulte |
| **Memoïsation** | Mise en cache du résultat d'un calcul coûteux pour éviter de le recalculer inutilement |
| **Decimal.js** | Bibliothèque JavaScript de calcul arithmétique précis, sans les erreurs de virgule flottante natifs |
| **SPA (Single Page Application)** | Application web chargée une seule fois, naviguant sans rechargement complet de page |
| **CDN** | Content Delivery Network — réseau de serveurs répartis mondialement pour distribuer rapidement les fichiers |
| **PCI DSS** | Payment Card Industry Data Security Standard — norme de sécurité pour le traitement des paiements par carte |
| **Stripe** | Service de paiement en ligne sécurisé gérant les transactions par carte bancaire |
| **EmailJS** | Service d'envoi d'emails depuis le navigateur sans serveur backend |
| **Railway** | Plateforme cloud simple pour déployer des serveurs Node.js (utilisé pour JSON Server) |
| **Vite** | Outil de build moderne pour applications JavaScript, très rapide grâce à esbuild |
| **esbuild** | Bundler JavaScript ultra-rapide, utilisé par Vite pour la minification de production |
| **Hot Module Replacement (HMR)** | Remplacement à chaud des modules en développement sans rechargement complet |
| **Exercice annuel** | Période comptable d'un an — l'archivage se fait par exercice annuel |

---

*Cahier des charges établi dans le cadre du Projet de Fin d'Études (PFA)*
*FacturaPro — Application de Gestion de Facturation — 2026*
