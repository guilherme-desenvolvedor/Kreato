# Kreator — imagem de produção (funciona em Render, Railway, Fly.io, Google Cloud Run etc.)
# Build:  docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... -t kreator .
# Run:    docker run -p 3000:3000 -e GEMINI_API_KEY=... -e VITE_SUPABASE_URL=... -e VITE_SUPABASE_ANON_KEY=... kreator

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev
COPY . .
# As variáveis VITE_* são embutidas no site na hora do build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
