import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    /*
     * Le backend tourne sur 8000, le front sur 5173. Sans ce relais, le
     * navigateur verrait deux origines : le cookie de session `suivi_session`
     * est SameSite=Lax, il ne serait pas renvoyé sur les requêtes croisées, et
     * la session serait perdue à chaque appel. Le relais fait tenir les deux
     * sur la même origine — aucune configuration CORS n'est alors nécessaire.
     */
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
      },
    },
  },
})
