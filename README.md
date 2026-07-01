# FacturaPro

Application web de gestion de facturation professionnelle — Projet de Fin d'Études (PFA)

## Description

FacturaPro est une plateforme complète qui permet à des comptables de créer, soumettre et suivre leurs factures, tandis que les administrateurs valident, rejettent et supervisent l'ensemble de l'activité via des tableaux de bord analytiques.

## Fonctionnalités principales

- **Gestion des factures** — Création avec 4 méthodes de calcul TVA, signature électronique, QR code de vérification
- **Workflow de validation** — Circuit Brouillon → Soumission → Validation/Rejet → Paiement avec notifications temps réel
- **Génération PDF** — Factures professionnelles avec logo, signature et QR code intégrés
- **Tableaux de bord** — KPIs, graphiques et statistiques pour comptables et administrateurs
- **Archivage annuel** — Clôture et consultation des exercices comptables
- **Gestion multi-utilisateurs** — Rôles comptable et administrateur avec permissions distinctes
- **Export Excel** — Export des factures filtrées en `.xlsx`
- **Paiement Stripe** — Abonnements avec 3 plans (mode test)

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | React 19 + Vite |
| UI | Material UI v9 |
| État global | Redux Toolkit |
| Base de données | Firebase Realtime Database |
| Authentification | Firebase Auth |
| PDF | jsPDF + jspdf-autotable |
| Graphiques | Recharts |
| Email | EmailJS |
| Paiement | Stripe |
| Export | xlsx |
| API mock | JSON Server (Railway) |

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/Eljazou/pfa-facturation.git
cd pfa-facturation

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env

# Démarrer le serveur de développement
npm run dev

# Démarrer l'API mock (optionnel)
npm run api
```

## Variables d'environnement

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
VITE_PUBLIC_URL=https://votre-domaine.web.app
VITE_JSON_SERVER_URL=https://votre-api.up.railway.app
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Déploiement

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Application en ligne

[https://facturation-ae9d3.web.app](https://facturation-ae9d3.web.app)

## Documentation

- [`PRESENTATION.md`](./PRESENTATION.md) — Guide de soutenance PFA (architecture, composants, flux)
- [`CAHIER_DE_CHARGE.md`](./CAHIER_DE_CHARGE.md) — Cahier des charges complet (100 besoins fonctionnels)

## Auteur

**Eljazou Abdessamad** — PFA 2026
