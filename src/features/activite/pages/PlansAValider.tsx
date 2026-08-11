import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { SelecteurPeriode } from "@/components/ui/SelecteurPeriode";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { corbeillePlansQuery, type EtatPlan, type PlanResume } from "@/features/activite/api";
import { formaterDate } from "@/lib/format";
import { periodeCourante, type Periode } from "@/lib/periode";

/**
 * Corbeille des plans d'actions — §15, côté contrôle de gestion.
 *
 * « Chaque structure devra enregistrer son Plan d'Actions Annuel validé par la
 * Direction du Contrôle de Gestion. » Le cahier des charges décrit la
 * validation sans dire où elle se fait : un validateur qui devrait ouvrir les
 * douze plans un par un pour savoir lesquels l'attendent ne validerait rien.
 *
 * L'écran est donc une liste, et rien d'autre : l'état de chaque plan, sa date
 * de soumission, son poids en activités et en budget. Le geste de validation
 * lui-même reste sur la fiche du plan, où l'on voit ce qu'on valide.
 *
 * Les plans soumis remontent en tête. C'est ce qu'on vient chercher ; le reste
 * n'est là que pour établir qu'aucune structure n'a été oubliée — un plan resté
 * en brouillon au mois d'août est une information au moins aussi utile.
 */
const TONS_PLAN: Record<EtatPlan, TonEtiquette> = {
  Brouillon: "neutre",
  "Soumis au contrôle de gestion": "alerte",
  Validé: "succes",
  Retourné: "danger",
};

const RANG_PLAN: Record<EtatPlan, number> = {
  "Soumis au contrôle de gestion": 0,
  Retourné: 1,
  Brouillon: 2,
  Validé: 3,
};

const MONNAIE = new Intl.NumberFormat("fr-FR");

export function PlansAValider() {
  const naviguer = useNavigate();
  const [periode, setPeriode] = useState<Periode>(() => periodeCourante("annee"));
  const { data, isPending } = useQuery(corbeillePlansQuery(periode.annee));

  const plans = [...(data?.plans ?? [])].sort(
    (a, b) => RANG_PLAN[a.etat] - RANG_PLAN[b.etat] || a.structureSigle.localeCompare(b.structureSigle),
  );
  const enAttente = plans.filter((p) => p.etat === "Soumis au contrôle de gestion").length;
  const sansPlan = plans.filter((p) => p.etat === "Brouillon").length;

  const colonnes: Colonne<PlanResume>[] = [
    {
      cle: "structure",
      entete: "Structure",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (p) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {p.structureLibelle}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {p.structureSigle} · exercice {p.annee}
          </span>
        </span>
      ),
    },
    {
      cle: "activites",
      entete: "Activités",
      largeur: "92px",
      role: "meta",
      alignement: "droite",
      rendu: (p) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {p.activites}
        </span>
      ),
    },
    {
      cle: "budget",
      entete: "Budget inscrit",
      largeur: "minmax(140px,1fr)",
      role: "meta",
      alignement: "droite",
      rendu: (p) => (
        <span className="text-[11px] leading-none font-semibold text-encre-douce tabular-nums">
          {p.budgetTotal ? `${MONNAIE.format(p.budgetTotal)} F CFA` : "—"}
        </span>
      ),
    },
    {
      cle: "avancement",
      entete: "Exécution",
      largeur: "minmax(130px,1fr)",
      rendu: (p) => <BarreProgression taux={p.avancementGlobal} />,
    },
    {
      cle: "soumis",
      entete: "Soumis le",
      largeur: "116px",
      rendu: (p) => (
        <span className="text-[11px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterDate(p.soumisLe)}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "184px",
      rendu: (p) => <Etiquette ton={TONS_PLAN[p.etat]}>{p.etat}</Etiquette>,
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Plans d'actions à valider"
        compte={plans.length}
        sousTitre="Ce que chaque structure a inscrit pour l'exercice, et où en est sa validation"
        actions={<SelecteurPeriode periode={periode} onChange={setPeriode} />}
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          {sansPlan > 0 && (
            <Encart ton="alerte" icone="horloge">
              {sansPlan} structure{sansPlan > 1 ? "s n'ont" : " n'a"} pas encore soumis de plan pour
              l'exercice {periode.annee}. Un plan non soumis n'engage personne : les activités qu'il
              contient ne comptent dans aucun classement.
            </Encart>
          )}

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
              chargement={isPending}
              colonnes={colonnes}
              lignes={plans}
              cleLigne={(p) => p.structureSigle}
              onLigneClick={(p) => naviguer(`/activites/plan?structure=${p.structureSigle}`)}
              vide="Aucun plan pour cet exercice."
            />
          </div>

          <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
            {enAttente === 0
              ? "Aucun plan n'attend votre décision."
              : `${enAttente} plan${enAttente > 1 ? "s attendent" : " attend"} votre décision. Ouvrez la ligne pour voir les activités avant de valider.`}
          </p>
        </div>
      </div>
    </>
  );
}
