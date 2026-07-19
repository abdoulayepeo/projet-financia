# Financia 💸

Application de gestion de finances personnelles pensée pour les jeunes.
Chaque mois, tu saisis tes revenus et tes dépenses, et tu visualises où part ton argent
grâce à des statistiques par catégorie.

## Fonctionnalités

- ➕ Saisie rapide des revenus et dépenses (montant, catégorie, date, note) et **modification** en touchant une transaction
- 📊 Tableau de bord mensuel : revenus, dépenses, solde et répartition des dépenses par catégorie (graphique)
- 🎯 **Budgets mensuels par catégorie** avec barres de progression et alerte de dépassement
- 🔁 **Transactions récurrentes** (loyer, abonnements…) créées automatiquement chaque mois, rattrapage des mois manqués au démarrage
- 📈 **Vue annuelle** : revenus et dépenses mois par mois, totaux de l'année
- 📤 **Export CSV** (mois affiché ou historique complet, compatible Excel)
- 🧾 Historique des transactions groupées par jour, navigation de mois en mois
- 📱 **PWA installable** : fonctionne en ligne comme hors ligne
- 🔒 **Local-first** : les données restent sur ton appareil (IndexedDB), aucun compte requis

## Stack technique

| Rôle | Techno |
| --- | --- |
| Framework | [Vue 3](https://vuejs.org/) (Composition API) + TypeScript |
| Build | [Vite](https://vite.dev/) |
| État | [Pinia](https://pinia.vuejs.org/) |
| Stockage hors ligne | [Dexie](https://dexie.org/) (IndexedDB) |
| Graphiques | [Chart.js](https://www.chartjs.org/) via vue-chartjs |
| PWA / Service worker | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production (dist/)
npm run preview    # prévisualiser le build (nécessaire pour tester la PWA)
```

> ℹ️ Le service worker n'est généré qu'au build : pour tester le mode hors ligne,
> utilise `npm run build && npm run preview`, ouvre l'app, puis coupe le réseau.

## Structure

```
src/
├── db.ts          # Schéma IndexedDB (Dexie) : transactions, budgets, récurrences
├── categories.ts  # Catégories de revenus/dépenses + couleurs
├── lib/           # Helpers : formatage, mois, export CSV
├── stores/        # Stores Pinia : transactions, budgets, récurrences
├── views/         # Accueil, stats annuelles, historique, formulaire, réglages
└── components/    # Sélecteur de mois, graphique par catégorie
```

## Pistes d'évolution

- Synchronisation multi-appareils via un backend (Django REST)
- Objectifs d'épargne
- Import CSV / restauration de sauvegarde
