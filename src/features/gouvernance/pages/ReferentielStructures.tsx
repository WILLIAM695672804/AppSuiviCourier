import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { construireArbre, structuresQuery, type NoeudStructure } from "@/lib/referentiel";

/**
 * Référentiel des structures — la vue de la DSR, en **lecture**.
 *
 * Cet écran a longtemps porté l'ajout d'une structure : le descriptif
 * confiait la liste des Directions, filiales et succursales à la DSR (§3.3),
 * et l'organigramme complet — postes, niveaux — à l'administrateur
 * fonctionnel (§3.9). Deux permissions pour un seul organigramme, et personne
 * ne pouvait faire le geste entier : créer une structure ouvre un poste
 * responsable vacant, que seul l'administrateur savait pourvoir.
 *
 * L'écriture est partie dans l'onglet « Structures » de `/organisation`
 * (ADR 021). Ce qui reste ici est ce dont la DSR a besoin tous les jours et
 * que l'écran d'administration ne montre pas : le délai moyen de réponse et
 * les courriers en cours, structure par structure — de quoi savoir qui
 * relancer.
 *
 * La lecture ne demande aucune permission nommée : le référentiel est ouvert à
 * toute session authentifiée (ADR 007).
 */
export function ReferentielStructures() {
  const { data, isPending } = useQuery(structuresQuery());
  const structures = data ?? [];

  // L'arbre, et non la liste : l'indentation suit le rattachement reel, et
  // chaque direction est immediatement suivie de ses services.
  const noeuds = construireArbre(structures);
  const orphelines = noeuds.filter((n) => n.orpheline).length;

  const colonnes: Colonne<NoeudStructure>[] = [
    {
      cle: "libelle",
      entete: "Structure",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: ({ structure: s, profondeur, orpheline }) => (
        <span className="flex min-w-0 items-center gap-2.5" style={{ paddingLeft: profondeur * 16 }}>
          <span className="flex-none rounded-none bg-surface-douce px-1.5 py-1 text-[10px] leading-none font-bold text-encre-douce">
            {s.sigle}
          </span>
          <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
            {s.libelle}
          </span>
          {orpheline && (
            <span
              className="flex-none"
              title="Sa structure de rattachement n'est plus en vigueur : elle est affichée à la racine faute de mieux."
            >
              <Etiquette ton="alerte">Rattachement rompu</Etiquette>
            </span>
          )}
        </span>
      ),
    },
    {
      cle: "nature",
      entete: "Nature",
      largeur: "124px",
      rendu: ({ structure: s }) => (
        <span
          className={`text-[11.5px] leading-none font-semibold ${
            s.nature === "Filiale" || s.nature === "Succursale"
              ? "text-confidentiel"
              : "text-encre-douce"
          }`}
        >
          {s.nature}
        </span>
      ),
    },
    {
      cle: "responsable",
      entete: "Responsable",
      largeur: "minmax(150px,1fr)",
      rendu: ({ structure: s }) => (
        <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
          {s.responsable ?? "Non désigné"}
        </span>
      ),
    },
    {
      cle: "delai",
      entete: "Délai moyen",
      largeur: "116px",
      rendu: ({ structure: s }) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {s.delaiMoyenJours === null ? "—" : `${s.delaiMoyenJours} j`}
        </span>
      ),
    },
    {
      cle: "encours",
      entete: "Courriers en cours",
      largeur: "132px",
      alignement: "droite",
      rendu: ({ structure: s }) => (
        <span className="text-xs leading-none font-bold text-encre tabular-nums">
          {s.courriersEnCours}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Référentiel des structures"
        compte={structures.length}
        sousTitre="Directions, filiales et succursales — délais de réponse et encours"
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <Encart ton="accent" icone="organisation">
            Ce référentiel est commun aux activités, aux décisions, aux réunions et au scoring.
            Une structure absente ici n'apparaîtra dans aucun tableau de bord.{" "}
            <strong>Il se consulte, il ne se modifie pas ici</strong> : inscrire une structure,
            ouvrir un poste ou nommer son responsable relève de l'administrateur fonctionnel.
          </Encart>

          {orphelines > 0 && (
            <Encart ton="alerte" icone="bouclier">
              {orphelines === 1
                ? "Une structure est rattachée à une structure qui n'est plus en vigueur : "
                : `${orphelines} structures sont rattachées à une structure qui n'est plus en vigueur : `}
              elles sont affichées à la racine, ce qu'elles ne sont pas. Leur rattachement est à
              reprendre.
            </Encart>
          )}

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={noeuds}
              cleLigne={(n) => n.structure.id}
              vide="Aucune structure enregistrée."
            />
          </div>
        </div>
      </div>
    </>
  );
}
