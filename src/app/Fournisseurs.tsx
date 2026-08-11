import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FournisseurSession } from "@/lib/session";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      // Les registres bougent en continu ; 30 s evitent un rechargement a chaque clic
      // sans donner d'information perimee a l'agent.
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Fournisseurs({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <FournisseurSession>{children}</FournisseurSession>
    </QueryClientProvider>
  );
}
