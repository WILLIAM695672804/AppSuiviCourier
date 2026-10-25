# ---------------------------------------------------------------------
#  Le front et le serveur qui le sert.
#
#  Une seule origine pour tout : `src/lib/api.ts` appelle `/api` en
#  relatif, et le cookie de session `suivi_session` est `SameSite=Lax`.
#  Servir le front sur un domaine et l'API sur un autre perdrait la
#  session a chaque appel — c'est deja ce que le relais de Vite evite en
#  developpement. Nginx tient ici le meme role.
# ---------------------------------------------------------------------
FROM node:22-alpine AS construction

WORKDIR /front

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `VITE_API_URL` reste vide : le front doit appeler `/api` en relatif.
# Y mettre une adresse absolue reintroduirait deux origines.
RUN npm run build

# ---------------------------------------------------------------------
FROM nginx:1.27-alpine

COPY --from=construction /front/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
