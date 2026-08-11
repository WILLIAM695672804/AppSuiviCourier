import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { BarreLaterale } from "@/app/layout/BarreLaterale";
import { TiroirNavigation } from "@/components/ui/TiroirNavigation";

/**
 * `children` sert au seul aiguillage de l'accueil, qui choisit son layout et
 * sa page ensemble. Partout ailleurs la disposition est une route mere et
 * rend l'`Outlet`.
 *
 * La hauteur d'ecran fixe convient au poste de bureau, ou rien ne doit
 * defiler en entier. Sur telephone elle serait un piege : le clavier virtuel
 * reduit la fenetre, et un `min-h` de 600 px couperait le formulaire. La
 * contrainte ne s'applique donc qu'a partir de `md`.
 */
export function Disposition({ children }: { children?: ReactNode }) {
  return (
    <TiroirNavigation
      barre={<BarreLaterale />}
      className="h-screen overflow-hidden bg-fond md:min-h-[600px]"
    >
      {/* La zone de travail est blanche et ne defile jamais en entier :
          chaque ecran garde son en-tete et ses filtres fixes. */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        {children ?? <Outlet />}
      </main>
    </TiroirNavigation>
  );
}
