import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ModaleNouvelleActivite } from "@/features/activite/components/ModalesActivite";
import { registreActivitesQuery, type Activite, type EtatActivite } from "@/features/activite/api";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Registre des activités programmées et réalisées.
 *
 * La colonne qui décide de tout est l'écart : l'avancement déclaré, comparé à
 * l'avancement attendu à la date du jour. Un taux de 34 % ne dit rien seul ;
 * 34 % là où 60 % étaient attendus dit qu'il faut relancer. C'est ce que le
 * repère sur la barre de progression matérialise.
 *
 * Le filtre par structure n'apparaît qu'à ceux dont le périmètre dépasse leur
 * propre structure. Un point focal ne voit que la sienne : lui proposer de
 * filtrer serait lui laisser croire qu'il pourrait voir les autres.
 */
const ETATS = ["Tous", "En retard", "En cours", "Programmée", "Réalisée", "Suspendue"] as const;

const TONS_ETAT: Record<EtatActivite, TonEtiquette> = {
  Programmée: "neutre",
  "En cours": "accent",
  Réalisée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

const RANG_ETAT: Record<EtatActivite, number> = {
  "En retard": 0,
  "En cours": 1,
  Programmée: 2,
  Suspendue: 3,
  Réalisée: 4,
};

export function RegistreActivites() {
  const naviguer = useNavigate();
  const peutSaisir = usePermission(PERMISSIONS.ACT_SAI);
  const [structure, setStructure] = useState("Toutes");
  const [etat, setEtat] = useState<(typeof ETATS)[number]>("Tous");
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const { data, isPending } = useQuery(registreActivitesQuery(structure, etat));
  const activites = [...(data?.activites ?? [])].sort(
    (a, b) => RANG_ETAT[a.etat] - RANG_ETAT[b.etat],
  );
  const structures = ["Toutes", ...(data?.structures ?? [])];

  const colonnes: Colonne<Activite>[] = [
    {
      cle: "intitule",
      entete: "Activité",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (a) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
              {a.intitule}
            </span>
            {/* §20 : « activités critiques ». La marque suit l'activité partout,
                sans quoi la structure découvre au cockpit du DG qu'elle y est. */}
            {a.critique && <Etiquette ton="danger">Critique</Etiquette>}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {a.reference} · {a.axe}
          </span>
        </span>
      ),
    },
    {
      cle: "structure",
      entete: "Structure",
      largeur: "108px",
      rendu: (a) => (
        <span className="inline-block rounded-none bg-surface-douce px-1.5 py-1 text-[10px] leading-none font-bold text-encre-douce">
          {a.structureSigle}
        </span>
      ),
    },
    {
      cle: "responsable",
      entete: "Responsable",
      largeur: "minmax(140px,1fr)",
      role: "meta",
      rendu: (a) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar initiales={a.initiales} taille="petit" />
          <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
            {a.responsable}
          </span>
        </span>
      ),
    },
    {
      cle: "periode",
      entete: "Période",
      largeur: "124px",
      rendu: (a) => (
        <span className="text-[11px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterDate(a.fin)}
        </span>
      ),
    },
    {
      cle: "avancement",
      entete: "Avancement",
      largeur: "minmax(140px,1.2fr)",
      rendu: (a) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <BarreProgression taux={a.avancement} cible={a.avancementAttendu} niveau={a.feu} />
          <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
            {a.avancement >= a.avancementAttendu
              ? `+${a.avancement - a.avancementAttendu} pt sur l'attendu`
              : `${a.avancement - a.avancementAttendu} pt sur l'attendu`}
          </span>
        </span>
      ),
    },
    {
      cle: "taches",
      entete: "Tâches",
      largeur: "84px",
      role: "meta",
      alignement: "droite",
      rendu: (a) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {a.tachesFaites} / {a.tachesTotal}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "112px",
      rendu: (a) => <Etiquette ton={TONS_ETAT[a.etat]}>{a.etat}</Etiquette>,
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Activités des structures"
        compte={data?.total}
        sousTitre="Plans d'actions annuels : ce qui est programmé, ce qui est réalisé"
        actions={
          peutSaisir ? (
            <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
              Ajouter une activité
            </Bouton>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <div className="flex flex-col gap-2.5">
              {structures.length > 2 && (
                <Pastilles
                  options={structures}
                  actif={structure}
                  onChange={setStructure}
                  libelle="Filtrer par structure"
                />
              )}
              <Pastilles
                options={ETATS}
                actif={etat}
                onChange={setEtat}
                libelle="Filtrer par état d'exécution"
              />
            </div>

            <div className="mt-3.5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={activites}
                cleLigne={(a) => a.id}
                onLigneClick={(a) => naviguer(`/activites/${a.id}`)}
                vide="Aucune activité ne correspond à ces filtres."
              />
            </div>
          </div>
        </div>
      </div>

      <ModaleNouvelleActivite ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
