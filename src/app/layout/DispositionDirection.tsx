import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Icone } from "@/components/ui/Icone";

/**
 * Disposition du poste de Directeur général — sans barre latérale.
 *
 * Le Directeur général ne navigue pas par un menu : il ouvre sa vue
 * d'ensemble, et il descend dans le détail **par ce qu'il regarde**. Un
 * graphique cliqué ouvre l'écran qui porte la matière de ce graphique, et le
 * fil de retour le ramène. C'est la demande, et elle se tient : sept entrées
 * de menu à côté d'un écran de lecture invitent à chercher ailleurs ce que
 * l'écran montre déjà.
 *
 * La barre latérale portait la navigation, et rien d'autre — l'identité et la
 * déconnexion vivent dans l'en-tête de chaque écran (`EnTetePage`), qui reste
 * en place. La retirer ne prive donc de rien d'autre que du menu.
 *
 * Aucun `TiroirNavigation` n'est monté : `useTiroir()` rend `null`, et
 * l'en-tête n'affiche pas de bouton de menu, y compris sur téléphone. C'est le
 * comportement voulu — il n'y a pas de menu à ouvrir.
 */
export function DispositionDirection({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();

  // La vue d'ensemble est atteignable par deux adresses : `/`, que l'accueil
  // aiguille, et `/direction`, que porte la route nommée. Le fil de retour ne
  // s'affiche sur aucune des deux — on n'y revient pas, on y est.
  const surLaVueEnsemble = pathname === "/" || pathname === "/direction";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-fond md:min-h-[600px]">
      {!surLaVueEnsemble && (
        <div
          className="flex flex-none items-center border-b border-bordure bg-surface px-4 py-2 md:px-[26px]"
          data-impression="masquer"
        >
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[11.5px] leading-none font-bold text-accent transition-colors duration-150 hover:underline"
          >
            <Icone nom="chevronGauche" taille={13} epaisseur={2} />
            Vue d'ensemble
          </Link>
        </div>
      )}

      {/* La zone de travail est blanche et ne defile jamais en entier :
          chaque ecran garde son en-tete et ses filtres fixes. */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
