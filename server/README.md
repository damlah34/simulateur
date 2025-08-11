# Focus Patrimoine - DVF Server

## Prérequis
- Node.js 20
- PostgreSQL

## Configuration
Créer un fichier `.env` à la racine du dossier `server` :
```
PORT=3001
DATABASE_URL=postgres://user:pass@host:5432/db
NODE_ENV=development
```

## Commandes
- `npm run dev` : démarrage en mode développement
- `npm run build` : compilation TypeScript
- `npm start` : exécution du serveur compilé
- `npm test` : tests unitaires
- `npm run lint` : ESLint
- `npm run db:setup` : création des tables et import du jeu d'essai

## Données DVF
Les scripts SQL se trouvent dans `sql/` :
- `001_init.sql` : création de la table `dvf_raw`
- `002_sample.sql` : jeu de données d'exemple (~50 lignes)

Pour charger des données réelles, consulter [https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-dvf/](https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-dvf/) puis importer via `COPY`.
