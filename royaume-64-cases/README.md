# Le Royaume des 64 Cases

BD interactive avec 9 mini-jeux d'échecs.

## Sécurité du mot mystère

Le mot final n'est présent ni dans `index.html`, ni dans `app.js`, ni dans `worker.js`.
Le Worker Cloudflare le lit uniquement depuis le secret d'environnement `MYSTERY_WORD`.
La progression est protégée par un jeton HMAC signé avec le secret `SIGNING_KEY`, ce qui empêche de fabriquer simplement une fin de partie depuis le navigateur.

## Mise en ligne du Worker Cloudflare

1. Créer un Worker nommé `royaume-64-cases-api`.
2. Copier le contenu de `worker.js` dans le Worker puis déployer.
3. Dans les paramètres du Worker, ajouter deux secrets :
   - `MYSTERY_WORD` : le mot final voulu.
   - `SIGNING_KEY` : une longue chaîne aléatoire difficile à deviner.
4. Vérifier que l'adresse du Worker correspond à celle indiquée dans `app.js`.

Le site GitHub Pages peut alors communiquer avec le Worker sans exposer le mot mystère dans le dépôt public.
