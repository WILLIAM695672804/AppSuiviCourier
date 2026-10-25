import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { BarreLaterale } from "@/app/layout/BarreLaterale";
import { DispositionDirection } from "@/app/layout/DispositionDirection";
import { TiroirNavigation } from "@/components/ui/TiroirNavigation";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * `children` sert au seul aiguillage de l'accueil, qui choisit son layout et
 * sa page ensemble. Partout ailleurs la disposition est une route mere et
 * rend l'`Outlet`.
 *
 * La hauteur d'ecran fixe convient au poste de bureau, ou rien ne doit
 * defiler en entier. Sur telephone elle serait un piege : le clavier virtuel
 * reduit la fenetre, et un `min-h` de 600 px couperait le formulaire. La
 * contrainte ne s'applique donc qu'a partir de `md`.
 *
 * Une session qui porte `VUE_DG` passe par `DispositionDirection`, sans barre
 * laterale : le Directeur general navigue par ce qu'il regarde, pas par un menu
 * (ADR 027). L'aiguillage est ici plutot que dans le routeur parce que la
 * disposition est une route mere unique — la dupliquer aurait duplique l'arbre
 * entier des routes.
 */
export function Disposition({ children }: { children?: ReactNode }) {
  const posteDeDirection = usePermission(PERMISSIONS.VUE_DG);

  if (posteDeDirection) {
    return <DispositionDirection>{children}</DispositionDirection>;
  }

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
