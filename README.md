# Simulateur

This project contains a few financial tools built with React and TypeScript.

## Features

- **Battre l'inflation** – compare your custom investment against the Livret A.
- **Projet immobilier** – simulate a rental real estate investment and visualize cashflows and remaining loan over time.

Use the navigation links in the header ("Battre l'inflation" and "Projet Immo") or the cards on the home page to access each tool.

## Development

### 1. Install dependencies

Install dependencies and run the linter and type checks:

```bash
npm install
npm run lint
npm run build
```

> ℹ️ La ligne « Dernière mise à jour » affichée sous le titre *Focus Patrimoine* est générée au moment du build. Si vous ne voyez pas l'horodatage après avoir récupéré une nouvelle version, relancez `npm run build` pour régénérer les fichiers statiques.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` at the project root and only keep it on your machine:

```bash
cp .env.example .env.local
```

Then fill the placeholders with your own values:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (and optionally `SUPABASE_SERVICE_ROLE_KEY`) for the Node API
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for the React app

> ⚠️ Never commit the resulting `.env.local` – the file is ignored by Git but if it was committed previously you must remove it (`git rm .env.local`) and rotate the exposed keys on Supabase.

If you also run the Express server, duplicate the relevant values into `server/.env.local` so the backend can access them.

### 3. Start the development servers

Start the React development server:

```bash
npm run dev
```

To inspect the production build locally (et vérifier l'horodatage affiché dans l'entête), exécutez ensuite :

```bash
npm run preview
```

Start the Node API from the `server/` folder in a separate terminal once the environment variables are in place:

```bash
cd server
npm install
npm run dev
```

