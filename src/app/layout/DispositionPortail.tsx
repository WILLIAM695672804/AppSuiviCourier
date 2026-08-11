import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { Icone, type NomIcone } from "@/components/ui/Icone";
import { MenuProfil } from "@/components/ui/MenuProfil";

/**
 * Disposition du portail externe.
 *
 * Ni barre latérale, ni tiroir : une barre horizontale de trois entrées. Un
 * usager qui vient deux fois par an ne mémorise pas une navigation ; il doit
 * voir toutes ses options d'un seul regard, sans avoir à ouvrir quoi que ce
 * soit.
 *
 * La largeur est bornée à 1 040 px et centrée. L'espace de travail occupe
 * l'écran entier parce que l'agent y compare des colonnes ; ici on lit un
 * dossier à la fois, et une ligne de texte de deux mille pixels est
 * illisible.
 *
 * Le bandeau du haut nomme l'institution. C'est la seule chose qui rassure un
 * usager arrivé par un lien reçu par courriel : il doit reconnaître, en une
 * seconde, qu'il est au bon endroit.
 */
interface EntreePortail {
  chemin: string;
  libelle: string;
  icone: NomIcone;
  exact?: boolean;
}

const MENU: EntreePortail[] = [
  { chemin: "/portail", libelle: "Mes demandes", icone: "document", exact: true },
  { chemin: "/portail/echanges", libelle: "Échanges", icone: "courrier" },
  { chemin: "/portail/preferences", libelle: "Notifications", icone: "cloche" },
];

export function DispositionPortail({ children }: { children?: ReactNode }) {
  return (
    <div className="zone-portail flex min-h-screen flex-col">
      <header className="flex-none border-b border-bordure bg-surface">
        <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center gap-4 px-4 py-3.5 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-[30px] flex-none place-items-center rounded-none bg-accent">
              <span className="size-2.5 rotate-45 rounded-none bg-white" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[14px] leading-none font-extrabold tracking-[-.2px] text-encre">
                Port Autonome de Douala
              </span>
              <span className="truncate text-[11px] leading-none font-medium text-encre-tenue">
                Espace des usagers et partenaires
              </span>
            </span>
          </div>

          <div className="flex-1" />

          <MenuProfil compact />
        </div>

        <nav
          aria-label="Portail"
          className="mx-auto flex w-full max-w-[1040px] items-center gap-1 overflow-x-auto px-2 md:px-4"
        >
          {MENU.map((entree) => (
            <NavLink
              key={entree.chemin}
              to={entree.chemin}
              end={entree.exact}
              className={({ isActive }) =>
                `flex flex-none items-center gap-2 border-b-2 px-3 py-3 text-[13px] leading-none font-semibold transition-colors duration-150 ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-encre-faible hover:text-encre-douce"
                }`
              }
            >
              <Icone nom={entree.icone} taille={15} />
              {entree.libelle}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 md:px-6 md:py-8">
        {children ?? <Outlet />}
      </main>

      <footer className="flex-none border-t border-bordure bg-surface">
        <div className="mx-auto w-full max-w-[1040px] px-4 py-4 md:px-6">
          <p className="text-[11px] leading-[1.6] font-medium text-encre-tenue">
            Les délais annoncés sont ceux que l'institution s'engage à tenir. En l'absence de
            réponse à leur terme, vous pouvez saisir le service instructeur depuis la page de votre
            demande.
          </p>
        </div>
      </footer>
    </div>
  );
}
