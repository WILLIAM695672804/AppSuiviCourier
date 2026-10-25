import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { ModaleNouvelleDecision } from "@/features/gouvernance/components/ModalesDecision";
import { registreDecisionsQuery, type Decision, type EtatDecision } from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Registre des décisions des instances — §3.3 du descriptif fonctionnel.
 *
 * C'est le registre que la DSR tient « en propre » : ce qui a été décidé en
 * CA, en CODIR ou par le Directeur général, et où en est l'exécution. Une
 * décision n'est pas close quand elle est prise, mais quand elle est exécutée
 * — c'est toute la raison d'être de cet écran, et de la colonne d'avancement
 * qui l'accompagne.
 *
 * Le tri par défaut place les décisions en retard en tête. Une liste
 * chronologique aurait enterré le plus urgent sous le plus récent.
 */
const INSTANCES = ["Toutes", "Conseil d'administration", "CODIR", "Directeur général"] as const;
const ETATS = ["Tous", "En retard", "En cours", "À lancer", "Exécutée", "Suspendue"] as const;

const TONS_ETAT: Record<EtatDecision, TonEtiquette> = {
  "À lancer": "neutre",
  "En cours": "accent",
  Exécutée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

/** Les plus critiques d'abord : c'est ce qu'on vient chercher. */
const RANG_ETAT: Record<EtatDecision, number> = {
  "En retard": 0,
  "En cours": 1,
  "À lancer": 2,
  Suspendue: 3,
  Exécutée: 4,
};

export function RegistreDecisions() {
  const naviguer = useNavigate();
  /*
   * Les filtres s'amorcent sur l'URL, et seulement a l'ouverture : c'est ce qui
   * rend le registre atteignable depuis un graphique de la vue d'ensemble du
   * Directeur general (ADR 027). Ensuite les selecteurs reprennent la main.
   */
  const [parametres] = useSearchParams();
  const [instance, setInstance] = useState<(typeof INSTANCES)[number]>(() => {
    const demande = parametres.get("instance");
    return INSTANCES.includes(demande as (typeof INSTANCES)[number])
      ? (demande as (typeof INSTANCES)[number])
      : "Toutes";
  });
  const [etat, setEtat] = useState<(typeof ETATS)[number]>(() => {
    const demande = parametres.get("etat");
    return ETATS.includes(demande as (typeof ETATS)[number])
      ? (demande as (typeof ETATS)[number])
      : "Tous";
  });
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const { data, isPending } = useQuery(registreDecisionsQuery(instance, etat));
  const decisions = [...(data?.decisions ?? [])].sort(
    (a, b) => RANG_ETAT[a.etat] - RANG_ETAT[b.etat],
  );

  const colonnes: Colonne<Decision>[] = [
    {
      cle: "reference",
      entete: "Référence",
      largeur: "124px",
      role: "resume",
      rendu: (d) => (
        <span className="text-xs leading-none font-bold text-accent tabular-nums">{d.reference}</span>
      ),
    },
    {
      cle: "objet",
      entete: "Objet de la décision",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (d) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {d.objet}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {d.seance}
          </span>
        </span>
      ),
    },
    {
      cle: "structures",
      entete: "Structures chargées",
      largeur: "minmax(150px,1fr)",
      rendu: (d) => {
        const pilote = d.structures.find((s) => s.pilote);
        const autres = d.structures.length - (pilote ? 1 : 0);
        return (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs leading-none font-semibold text-encre">
              {pilote?.sigle ?? "—"}
            </span>
            {pilote && (
              <span className="flex-none rounded-none bg-accent-voile px-1 py-0.5 text-[9px] leading-none font-bold text-accent-fonce">
                PILOTE
              </span>
            )}
            {autres > 0 && (
              <span className="flex-none text-[10.5px] leading-none font-semibold text-encre-tenue">
                +{autres}
              </span>
            )}
          </span>
        );
      },
    },
    {
      cle: "echeance",
      entete: "Échéance",
      largeur: "112px",
      rendu: (d) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {d.echeance ? formaterDate(d.echeance) : "—"}
        </span>
      ),
    },
    {
      cle: "avancement",
      entete: "Avancement",
      largeur: "minmax(120px,1fr)",
      rendu: (d) => <BarreProgression taux={d.avancement} />,
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "104px",
      rendu: (d) => <Etiquette ton={TONS_ETAT[d.etat]}>{d.etat}</Etiquette>,
    },
    {
      cle: "relances",
      entete: "Relances",
      largeur: "84px",
      role: "meta",
      alignement: "droite",
      rendu: (d) => (
        <span
          className={`text-xs leading-none font-bold tabular-nums ${
            d.relances >= 3 ? "text-danger" : d.relances > 0 ? "text-alerte" : "text-encre-tenue"
          }`}
        >
          {d.relances === 0 ? "—" : d.relances}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Décisions des instances"
        compte={data?.total}
        sousTitre="Conseil d'administration, comité de direction et instructions du Directeur général"
        actions={
          <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
            Enregistrer une décision
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <div className="flex flex-col gap-2.5">
              <Pastilles
                options={INSTANCES}
                actif={instance}
                onChange={setInstance}
                libelle="Filtrer par instance"
              />
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
                lignes={decisions}
                cleLigne={(d) => d.id}
                onLigneClick={(d) => naviguer(`/gouvernance/decisions/${d.id}`)}
                vide="Aucune décision ne correspond à ces filtres."
              />
            </div>
          </div>
        </div>
      </div>

      <ModaleNouvelleDecision ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
