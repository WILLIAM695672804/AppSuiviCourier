import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { ModaleDeclarerAbsence } from "@/features/gouvernance/components/ModalesRegistre";
import { registreDisponibilitesQuery, type Disponibilite, type TypeAbsence } from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Registre de disponibilité des hauts responsables — §3.3.
 *
 * Le registre ne sert pas à gérer les congés, qui relèvent des ressources
 * humaines : il sert à savoir qui décide pendant l'absence. C'est pourquoi la
 * colonne qui compte n'est pas la durée mais l'intérimaire — et pourquoi une
 * absence en cours sans suppléance désignée passe au rouge.
 *
 * Sans cette information, une décision confiée à un directeur en mission
 * attend son retour sans que personne ne le sache, et la relance part vers
 * quelqu'un qui ne la lira pas.
 */
const FILTRES = ["Toutes", "En cours", "Sans intérim", "Congé annuel", "Mission", "Intérim"] as const;

const TONS_TYPE: Record<TypeAbsence, TonEtiquette> = {
  "Congé annuel": "accent",
  Mission: "confidentiel",
  Intérim: "succes",
  Formation: "neutre",
  "Absence exceptionnelle": "alerte",
};

export function Disponibilites() {
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]>("Toutes");
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const { data, isPending } = useQuery(registreDisponibilitesQuery(filtre));
  const lignes = data?.disponibilites ?? [];

  const colonnes: Colonne<Disponibilite>[] = [
    {
      cle: "responsable",
      entete: "Responsable",
      largeur: "minmax(190px,1.6fr)",
      role: "titre",
      rendu: (d) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar initiales={d.initiales} taille="petit" />
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
              {d.responsable}
            </span>
            <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
              {d.poste} · {d.structure}
            </span>
          </span>
        </span>
      ),
    },
    {
      cle: "type",
      entete: "Motif",
      largeur: "148px",
      rendu: (d) => <Etiquette ton={TONS_TYPE[d.type]}>{d.type}</Etiquette>,
    },
    {
      cle: "periode",
      entete: "Période",
      largeur: "minmax(160px,1fr)",
      rendu: (d) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
            {formaterDate(d.du)} → {formaterDate(d.au)}
          </span>
          <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
            {d.jours} jour{d.jours > 1 ? "s" : ""} ouvré{d.jours > 1 ? "s" : ""}
          </span>
        </span>
      ),
    },
    {
      cle: "interim",
      entete: "Intérim assuré par",
      largeur: "minmax(150px,1fr)",
      rendu: (d) =>
        d.interimaire ? (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar initiales={d.interimaireInitiales ?? "?"} taille="petit" />
            <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
              {d.interimaire}
            </span>
          </span>
        ) : (
          <Feu niveau={d.feu} libelle="Aucun désigné" />
        ),
    },
    {
      cle: "etat",
      entete: "Statut",
      largeur: "104px",
      rendu: (d) =>
        d.enCours ? (
          <Etiquette ton="alerte">En cours</Etiquette>
        ) : (
          <Etiquette ton="neutre">À venir</Etiquette>
        ),
    },
    {
      cle: "saisi",
      entete: "Saisi par",
      largeur: "128px",
      role: "meta",
      rendu: (d) => (
        <span className="truncate text-[11px] leading-none font-medium text-encre-tenue">
          {d.saisiPar}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Disponibilité des responsables"
        compte={lignes.length}
        sousTitre="Congés, missions et intérims des directeurs et membres du Cabinet"
        actions={
          <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
            Déclarer une absence
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          {(data?.sansInterim ?? 0) > 0 && (
            <Encart ton="danger" icone="cloche">
              {data?.sansInterim} responsable{(data?.sansInterim ?? 0) > 1 ? "s sont absents" : " est absent"} sans
              intérimaire désigné. Les décisions et les courriers qui leur reviennent n'avanceront
              pas, et les relances partiront dans le vide.
            </Encart>
          )}

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <Pastilles
              options={FILTRES}
              actif={filtre}
              onChange={setFiltre}
              libelle="Filtrer les absences"
            />

            <div className="mt-3.5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={lignes}
                cleLigne={(d) => d.id}
                vide="Aucune absence déclarée pour ce filtre."
              />
            </div>
          </div>
        </div>
      </div>

      <ModaleDeclarerAbsence ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
