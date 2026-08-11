import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ModaleNouvelleStructure } from "@/features/gouvernance/components/ModalesRegistre";
import { structuresQuery, type StructureRef } from "@/lib/referentiel";

/**
 * Référentiel unique des structures, tenu par la DSR — §3.3.
 *
 * Cet écran fait doublon avec l'onglet « Organisation » de la zone
 * d'administration, et c'est délibéré. Le descriptif fonctionnel confie le
 * référentiel des structures à deux acteurs : l'administrateur fonctionnel
 * (§3.9), qui tient l'organigramme complet — structures, postes, niveaux
 * hiérarchiques — et la DSR (§3.3), qui tient la seule liste des Directions,
 * filiales et succursales pour garantir « une couverture homogène de tous les
 * modules ».
 *
 * Deux besoins, deux périmètres, deux chartes. Faire transiter la DSR par la
 * zone d'administration pour cette seule liste l'aurait sortie de son espace
 * de travail à chaque ajout de structure — et lui aurait donné accès, au
 * passage, aux postes et aux niveaux hiérarchiques qui ne la regardent pas.
 *
 * Ce que cet écran ne fait pas : créer un poste, déplacer une structure dans
 * l'arbre, modifier un niveau hiérarchique. Cela reste `/organisation`.
 */
export function ReferentielStructures() {
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const { data, isPending } = useQuery(structuresQuery());
  const structures = data ?? [];

  const colonnes: Colonne<StructureRef>[] = [
    {
      cle: "libelle",
      entete: "Structure",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (s) => (
        <span className="flex min-w-0 items-center gap-2.5" style={{ paddingLeft: s.niveau * 14 }}>
          <span className="flex-none rounded-none bg-surface-douce px-1.5 py-1 text-[10px] leading-none font-bold text-encre-douce">
            {s.sigle}
          </span>
          <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
            {s.libelle}
          </span>
        </span>
      ),
    },
    {
      cle: "nature",
      entete: "Nature",
      largeur: "124px",
      rendu: (s) => (
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
      rendu: (s) => (
        <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
          {s.responsable ?? "Non désigné"}
        </span>
      ),
    },
    {
      cle: "delai",
      entete: "Délai moyen",
      largeur: "116px",
      rendu: (s) => (
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
      rendu: (s) => (
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
        sousTitre="Directions, filiales et succursales — la liste dont dépendent tous les modules"
        actions={
          <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
            Ajouter une structure
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <Encart ton="accent" icone="organisation">
            Ce référentiel est commun aux activités, aux décisions, aux réunions et au scoring.
            Une structure absente ici n'apparaîtra dans aucun tableau de bord. Les postes et les
            niveaux hiérarchiques relèvent de l'administrateur fonctionnel.
          </Encart>

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={structures}
              cleLigne={(s) => s.id}
              vide="Aucune structure enregistrée."
            />
          </div>
        </div>
      </div>

      <ModaleNouvelleStructure ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
