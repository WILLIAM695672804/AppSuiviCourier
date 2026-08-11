import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { registreDossiersQuery, type Dossier, type EtatDossier } from "@/features/dossier/api";
import { formaterDate } from "@/lib/format";

/**
 * Registre des dossiers à instruire.
 *
 * La colonne décisive est le nombre de jours restants, et non l'échéance : un
 * instructeur qui balaie sa liste le matin cherche ce qui lui reste, pas une
 * date qu'il devra soustraire mentalement. L'échéance figure en dessous, pour
 * qui a besoin du chiffre exact.
 *
 * « En attente de complément » n'arrête pas le délai. C'est volontaire et
 * c'est ce que dit l'écran : le demandeur qui ne répond pas ne suspend pas
 * l'obligation de l'institution, il la rend seulement plus difficile à tenir.
 */
const ETAPES = ["Toutes", "Qualification", "Instruction", "Validation", "Notification", "Clos"] as const;
const ETATS = ["Tous", "Hors délai", "Retourné", "En attente de complément", "En cours", "Clos"] as const;

const TONS_ETAT: Record<EtatDossier, TonEtiquette> = {
  "En cours": "accent",
  "En attente de complément": "alerte",
  Retourné: "alerte",
  "Hors délai": "danger",
  Clos: "succes",
};

const RANG_ETAT: Record<EtatDossier, number> = {
  "Hors délai": 0,
  Retourné: 1,
  "En attente de complément": 2,
  "En cours": 3,
  Clos: 4,
};

export function RegistreDossiers() {
  const naviguer = useNavigate();
  const [etape, setEtape] = useState<(typeof ETAPES)[number]>("Toutes");
  const [etat, setEtat] = useState<(typeof ETATS)[number]>("Tous");

  const { data, isPending } = useQuery(registreDossiersQuery(etape, etat));
  const dossiers = [...(data?.dossiers ?? [])].sort(
    (a, b) => RANG_ETAT[a.etat] - RANG_ETAT[b.etat] || a.joursRestants - b.joursRestants,
  );

  const colonnes: Colonne<Dossier>[] = [
    {
      cle: "objet",
      entete: "Dossier",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (d) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {d.objet}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {d.reference} · {d.demandeur}
            {d.courrierOrigine ? ` · courrier ${d.courrierOrigine}` : ""}
          </span>
        </span>
      ),
    },
    {
      cle: "type",
      entete: "Type",
      largeur: "120px",
      rendu: (d) => (
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <span className="text-[11.5px] leading-none font-semibold text-encre-douce">{d.type}</span>
          {d.criticite !== "Standard" && (
            <span className="text-[10px] leading-none font-bold text-alerte uppercase">
              {d.criticite}
            </span>
          )}
        </span>
      ),
    },
    {
      cle: "instructeur",
      entete: "Instructeur",
      largeur: "minmax(140px,1fr)",
      role: "meta",
      rendu: (d) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar initiales={d.initiales} taille="petit" />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
              {d.instructeur}
            </span>
            <span className="truncate text-[10px] leading-none font-medium text-encre-tenue">
              {d.structure}
            </span>
          </span>
        </span>
      ),
    },
    {
      cle: "etape",
      entete: "Étape",
      largeur: "124px",
      rendu: (d) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce">{d.etape}</span>
      ),
    },
    {
      cle: "delai",
      entete: "Reste",
      largeur: "116px",
      rendu: (d) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span
            className={`text-[12px] leading-none font-bold tabular-nums ${
              d.joursRestants < 0
                ? "text-danger"
                : d.joursRestants <= 3
                  ? "text-alerte"
                  : "text-encre"
            }`}
          >
            {d.etat === "Clos"
              ? "—"
              : d.joursRestants < 0
                ? `${-d.joursRestants} j de retard`
                : `${d.joursRestants} j`}
          </span>
          <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
            {formaterDate(d.echeance)}
          </span>
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "168px",
      rendu: (d) => <Etiquette ton={TONS_ETAT[d.etat]}>{d.etat}</Etiquette>,
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Dossiers à instruire"
        compte={data?.total}
        sousTitre="Demandes, réclamations, autorisations et requêtes en cours d'instruction"
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <div className="flex flex-col gap-2.5">
              <Pastilles
                options={ETAPES}
                actif={etape}
                onChange={setEtape}
                libelle="Filtrer par étape du circuit"
              />
              <Pastilles options={ETATS} actif={etat} onChange={setEtat} libelle="Filtrer par état" />
            </div>

            <div className="mt-3.5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={dossiers}
                cleLigne={(d) => d.id}
                onLigneClick={(d) => naviguer(`/dossiers/${d.id}`)}
                vide="Aucun dossier ne correspond à ces filtres."
              />
            </div>
          </div>

          <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            L'attente d'un complément ne suspend pas le délai : le demandeur qui ne répond pas ne
            dispense pas l'institution de son obligation de réponse.
          </p>
        </div>
      </div>
    </>
  );
}
