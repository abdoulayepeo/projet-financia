# Financia 💸

Application de gestion de finances personnelles pensée pour les jeunes.
Chaque mois, tu saisis tes revenus et tes dépenses, et tu visualises où part ton argent
grâce à des statistiques par catégorie.

## Fonctionnalités

- ➕ Saisie rapide des revenus et dépenses (montant, catégorie, date, note)
- 📊 Tableau de bord mensuel : revenus, dépenses, solde et répartition des dépenses par catégorie (graphique)
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
├── db.ts                  # Schéma IndexedDB (Dexie)
├── categories.ts          # Catégories de revenus/dépenses + couleurs
├── stores/transactions.ts # Store Pinia (chargement par mois, totaux, stats)
├── views/                 # Tableau de bord, liste, formulaire d'ajout
└── components/            # Sélecteur de mois, graphique par catégorie
```

## Pistes d'évolution

- Budgets par catégorie avec alertes de dépassement
- Transactions récurrentes (loyer, abonnements…)
- Export CSV / sauvegarde
- Synchronisation multi-appareils via un backend (Django REST)
