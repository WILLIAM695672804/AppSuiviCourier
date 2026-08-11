import type { ReactNode } from "react";
import { Squelette } from "@/components/ui/Squelette";

/**
 * Tableau de registre, qui devient une liste de cartes sur téléphone.
 *
 * C'est le composant qui rend l'application utilisable à 390 px de large. Un
 * registre à dix colonnes réclame plus de 1 200 px : le réduire ne donne rien
 * de lisible, et le faire défiler horizontalement oblige à balayer l'écran
 * pour lire une seule ligne. Sous 768 px, chaque ligne devient donc une carte
 * où l'on garde l'essentiel et où l'on abandonne le reste.
 *
 * Ce choix se paie : il faut dire, colonne par colonne, ce qui survit au
 * passage en mobile. C'est le rôle du champ `role` — et c'est une décision
 * métier, pas une décision de mise en page, donc elle appartient à l'écran
 * qui déclare ses colonnes.
 *
 * `TableauRegistre` (courrier) reste en place et n'est pas concerné : il porte
 * une sélection multiple et un tri qui lui sont propres. Ce composant sert aux
 * registres de la gouvernance et des activités.
 */
export interface Colonne<T> {
  cle: string;
  entete: string;
  /** Fragment de `grid-template-columns` : « 116px », « minmax(140px,1fr) »… */
  largeur: string;
  rendu: (ligne: T) => ReactNode;
  /**
   * Ce que devient la colonne sur téléphone :
   * `titre` — en tête de carte, une seule par tableau ;
   * `resume` — paire libellé / valeur sous le titre ;
   * `meta` — abandonnée, consultable en ouvrant la ligne.
   * Par défaut, la première colonne est le titre et les autres sont des résumés.
   */
  role?: "titre" | "resume" | "meta";
  alignement?: "droite";
}

type Props<T> = {
  colonnes: Colonne<T>[];
  lignes: T[];
  cleLigne: (ligne: T) => string | number;
  onLigneClick?: (ligne: T) => void;
  /** Ligne mise en évidence, quand un panneau de détail est ouvert à côté. */
  ligneActive?: (ligne: T) => boolean;
  /** Message affiché quand il n'y a rien à montrer. */
  vide?: string;
  /**
   * Affiche des lignes de remplacement au lieu du message « aucun élément ».
   *
   * La distinction est essentielle : « aucun courrier ne correspond » et
   * « les courriers n'ont pas encore chargé » sont deux informations
   * différentes, et les confondre fait conclure à tort qu'un registre est vide.
   */
  chargement?: boolean;
  /** Nombre de lignes de remplacement. À caler sur la taille de page usuelle. */
  lignesChargement?: number;
};

function roleDe<T>(colonne: Colonne<T>, index: number): "titre" | "resume" | "meta" {
  return colonne.role ?? (index === 0 ? "titre" : "resume");
}

export function Tableau<T>({
  colonnes,
  lignes,
  cleLigne,
  onLigneClick,
  ligneActive,
  vide = "Aucun élément à afficher.",
  chargement = false,
  lignesChargement = 6,
}: Props<T>) {
  const grille = { gridTemplateColumns: colonnes.map((c) => c.largeur).join(" ") };

  /*
   * Le chargement se rend avant tout le reste, et surtout avant le message
   * « aucun élément » : une liste qui n'a pas fini de charger n'est pas une
   * liste vide.
   */
  if (chargement) {
    return <TableauEnChargement colonnes={colonnes} grille={grille} lignes={lignesChargement} />;
  }

  if (lignes.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-[12.5px] font-medium text-encre-tenue">{vide}</p>
    );
  }

  const cliquable = onLigneClick !== undefined;

  return (
    <>
      {/* Bureau — la grille, telle que les maquettes la dessinent. */}
      <div className="hidden md:block">
        <div
          role="row"
          style={grille}
          className="grid items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5"
        >
          {colonnes.map((colonne) => (
            <span
              key={colonne.cle}
              role="columnheader"
              className={`truncate text-[10.5px] leading-none font-bold tracking-[.3px] text-encre-tenue uppercase ${
                colonne.alignement === "droite" ? "text-right" : ""
              }`}
            >
              {colonne.entete}
            </span>
          ))}
        </div>

        {lignes.map((ligne) => {
          const actif = ligneActive?.(ligne) ?? false;
          const Balise = cliquable ? "button" : "div";
          return (
            <Balise
              key={cleLigne(ligne)}
              {...(cliquable ? { type: "button" as const, onClick: () => onLigneClick(ligne) } : {})}
              style={grille}
              className={`grid w-full items-center gap-2.5 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                cliquable ? "cursor-pointer" : ""
              } ${actif ? "bg-accent-voile" : cliquable ? "hover:bg-surface-douce" : ""}`}
            >
              {colonnes.map((colonne) => (
                <span
                  key={colonne.cle}
                  className={`min-w-0 ${colonne.alignement === "droite" ? "text-right" : ""}`}
                >
                  {colonne.rendu(ligne)}
                </span>
              ))}
            </Balise>
          );
        })}
      </div>

      {/* Téléphone — une carte par ligne. */}
      <ul className="flex flex-col gap-2.5 py-3 md:hidden">
        {lignes.map((ligne) => {
          const actif = ligneActive?.(ligne) ?? false;
          const Balise = cliquable ? "button" : "div";
          return (
            <li key={cleLigne(ligne)}>
              <Balise
                {...(cliquable
                  ? { type: "button" as const, onClick: () => onLigneClick(ligne) }
                  : {})}
                className={`flex w-full flex-col gap-2 rounded-none border px-3.5 py-3 text-left transition-colors duration-150 ${
                  actif ? "border-accent bg-accent-voile" : "border-bordure bg-surface"
                }`}
              >
                {colonnes.map((colonne, index) => {
                  const role = roleDe(colonne, index);
                  if (role === "meta") return null;

                  if (role === "titre") {
                    return (
                      <span key={colonne.cle} className="text-[13px] leading-snug font-bold text-encre">
                        {colonne.rendu(ligne)}
                      </span>
                    );
                  }

                  return (
                    <span key={colonne.cle} className="flex items-center justify-between gap-3">
                      <span className="flex-none text-[10.5px] leading-none font-bold tracking-[.3px] text-encre-tenue uppercase">
                        {colonne.entete}
                      </span>
                      <span className="min-w-0 text-right">{colonne.rendu(ligne)}</span>
                    </span>
                  );
                })}
              </Balise>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * Lignes de remplacement, calées sur la grille réelle.
 *
 * Les en-têtes restent visibles : ce sont les seules informations dont on
 * dispose avant la réponse, et elles disent déjà ce qu'on va lire. Les
 * largeurs des blocs varient d'une ligne à l'autre — des barres identiques
 * ressemblent à un motif, pas à des données.
 */
function TableauEnChargement<T>({
  colonnes,
  grille,
  lignes,
}: {
  colonnes: Colonne<T>[];
  grille: { gridTemplateColumns: string };
  lignes: number;
}) {
  const largeurs = ["82%", "56%", "94%", "68%", "76%"];

  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement des données en cours</span>

      {/* Bureau */}
      <div className="hidden md:block">
        <div
          style={grille}
          className="grid items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5"
        >
          {colonnes.map((colonne) => (
            <span
              key={colonne.cle}
              className={`truncate text-[10.5px] leading-none font-bold tracking-[.3px] text-encre-tenue uppercase ${
                colonne.alignement === "droite" ? "text-right" : ""
              }`}
            >
              {colonne.entete}
            </span>
          ))}
        </div>

        {Array.from({ length: lignes }, (_, ligne) => (
          <div
            key={ligne}
            style={grille}
            className="grid items-center gap-2.5 border-b border-separateur py-[17px]"
          >
            {colonnes.map((colonne, index) => (
              <Squelette
                key={colonne.cle}
                largeur={largeurs[(ligne + index) % largeurs.length]}
                hauteur={11}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Téléphone : les mêmes cartes que celles qui vont arriver. */}
      <ul className="flex flex-col gap-2.5 py-3 md:hidden">
        {Array.from({ length: Math.min(lignes, 4) }, (_, ligne) => (
          <li
            key={ligne}
            className="flex flex-col gap-2.5 rounded-none border border-bordure bg-surface px-3.5 py-3.5"
          >
            <Squelette largeur="78%" hauteur={13} />
            <Squelette largeur="52%" hauteur={10} />
            <Squelette largeur="64%" hauteur={10} />
          </li>
        ))}
      </ul>
    </div>
  );
}
