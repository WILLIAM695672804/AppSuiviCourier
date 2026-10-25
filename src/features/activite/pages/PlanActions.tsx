import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Anneau } from "@/components/ui/Anneau";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition, GrilleDefinitions } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { ChoixStructure } from "@/components/ui/ChoixStructure";
import { SelecteurPeriode } from "@/components/ui/SelecteurPeriode";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ModaleEtatPlan } from "@/features/activite/components/ModalesActivite";
import { planActionsQuery, type Activite, type EtatActivite, type EtatPlan } from "@/features/activite/api";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate, formaterMois } from "@/lib/format";
import { periodeCourante, type Periode } from "@/lib/periode";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Plan d'actions annuel d'une structure — §15 du cahier des charges.
 *
 * Le plan est un objet à part entière, distinct de la somme de ses activités :
 * il a un état, une date de soumission, un validateur. « Chaque structure
 * devra enregistrer son Plan d'Actions Annuel validé par la Direction du
 * Contrôle de Gestion » — c'est cette validation qui fait du plan un
 * engagement, et non une liste d'intentions.
 *
 * D'où l'ordre de l'écran : l'état du plan d'abord, les activités ensuite. Un
 * point focal qui ouvre cette page veut d'abord savoir si son plan est validé.
 *
 * L'écran sert deux postes opposés, et c'est le périmètre de la session qui les
 * sépare, jamais l'écran. Un point focal n'a qu'une structure accessible : le
 * sélecteur ne s'affiche même pas. Le contrôle de gestion les a toutes, et
 * arrive ici depuis sa corbeille, la structure déjà choisie dans l'URL — sans
 * quoi valider douze plans imposerait douze allers-retours.
 *
 * Le bouton « Soumettre au contrôle de gestion » n'apparaît qu'à qui saisit ;
 * « Valider le plan » qu'à qui valide. Les deux ne sont jamais la même
 * personne, et c'est le fond du dispositif.
 */
const TONS_PLAN: Record<EtatPlan, TonEtiquette> = {
  Brouillon: "neutre",
  "Soumis au contrôle de gestion": "alerte",
  Validé: "succes",
  Retourné: "danger",
};

const TONS_ETAT: Record<EtatActivite, TonEtiquette> = {
  Programmée: "neutre",
  "En cours": "accent",
  Réalisée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

const MONNAIE = new Intl.NumberFormat("fr-FR");

export function PlanActions() {
  const naviguer = useNavigate();
  const [parametres, setParametres] = useSearchParams();
  const peutSaisir = usePermission(PERMISSIONS.ACT_SAI);
  const peutValider = usePermission(PERMISSIONS.ACT_VAL);
  const [periode, setPeriode] = useState<Periode>(() => periodeCourante("annee"));
  /** Action de changement d'état en cours. `null` ferme la modale. */
  const [action, setAction] = useState<"soumettre" | "valider" | "retourner" | null>(null);

  /*
   * La structure vit dans l'URL et non dans un etat local : c'est ce qui permet
   * au controle de gestion d'ouvrir un plan precis depuis sa corbeille, et de
   * revenir en arriere sans perdre le contexte.
   */
  const structure = parametres.get("structure") ?? "";
  const { data: plan, isPending } = useQuery(planActionsQuery(periode.annee, structure));

  // Le serveur repond avec la structure de rattachement quand aucune n'est
  // demandee : on l'inscrit dans l'URL pour que le lien reste partageable.
  useEffect(() => {
    if (!structure && plan?.structureSigle) {
      setParametres({ structure: plan.structureSigle }, { replace: true });
    }
  }, [structure, plan?.structureSigle, setParametres]);

  const accessibles = plan?.structuresAccessibles ?? [];

  const colonnes: Colonne<Activite>[] = [
    {
      cle: "intitule",
      entete: "Activité programmée",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (a) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {a.intitule}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {a.reference} · {a.axe}
          </span>
        </span>
      ),
    },
    {
      cle: "periode",
      entete: "Exécution",
      largeur: "minmax(140px,1fr)",
      rendu: (a) => (
        <span className="text-[11px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterMois(a.debut)} → {formaterMois(a.fin)}
        </span>
      ),
    },
    {
      cle: "avancement",
      entete: "Avancement",
      largeur: "minmax(130px,1fr)",
      rendu: (a) => (
        <BarreProgression taux={a.avancement} cible={a.avancementAttendu} niveau={a.feu} />
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
        titre="Plan d'actions annuel"
        sousTitre={plan ? `${plan.structureLibelle} — exercice ${plan.annee}` : undefined}
        miettes={
          peutValider
            ? [{ libelle: "Plans à valider", chemin: "/activites/plans" }, { libelle: "Plan d'actions" }]
            : undefined
        }
        actions={
          <>
            <SelecteurPeriode periode={periode} onChange={setPeriode} />
            {peutValider && plan?.etat === "Soumis au contrôle de gestion" && (
              <>
                <Bouton icone="croix" onClick={() => setAction("retourner")}>
                  Retourner
                </Bouton>
                <Bouton variante="principal" icone="coche" onClick={() => setAction("valider")}>
                  Valider le plan
                </Bouton>
              </>
            )}
            {peutSaisir && plan?.etat !== "Validé" && plan?.etat !== "Soumis au contrôle de gestion" && (
              <Bouton variante="principal" icone="exporter" onClick={() => setAction("soumettre")}>
                Soumettre au contrôle de gestion
              </Bouton>
            )}
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          {/* Une seule structure accessible : le choix n'existe pas, et le
              proposer laisserait croire qu'on pourrait voir les autres. */}
          {accessibles.length > 1 && (
            <div className="rounded-none border border-bordure bg-surface px-4 py-3.5 md:px-5">
              <ChoixStructure
                sigles={accessibles.map((s) => s.sigle)}
                actif={plan?.structureSigle ?? ""}
                onChange={(sigle) => setParametres({ structure: sigle })}
                libelle="Plan de la structure"
              />
            </div>
          )}

          <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Carte
              titre="État du plan"
              aDroite={plan && <Etiquette ton={TONS_PLAN[plan.etat]}>{plan.etat}</Etiquette>}
            >
              <GrilleDefinitions>
                <Definition libelle="Structure">{plan?.structureLibelle ?? "—"}</Definition>
                <Definition libelle="Exercice">{plan?.annee ?? periode.annee}</Definition>
                <Definition libelle="Soumis le">{formaterDate(plan?.soumisLe ?? null)}</Definition>
                <Definition libelle="Validé le">{formaterDate(plan?.valideLe ?? null)}</Definition>
                <Definition libelle="Validé par">{plan?.validePar ?? "—"}</Definition>
                <Definition libelle="Budget inscrit">
                  {plan?.budgetTotal ? `${MONNAIE.format(plan.budgetTotal)} F CFA` : "—"}
                </Definition>
              </GrilleDefinitions>

              {plan?.etat === "Retourné" && plan.motifRetour && (
                <div className="mt-4">
                  <Encart ton="danger" icone="croix">
                    Plan retourné par le contrôle de gestion : {plan.motifRetour}
                  </Encart>
                </div>
              )}

              {plan?.etat === "Validé" && (
                <div className="mt-4">
                  <Encart ton="succes" icone="coche">
                    Le plan est validé : les activités qu'il contient engagent la structure, et
                    leur exécution alimente le classement mensuel.
                  </Encart>
                </div>
              )}

              <p className="mt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Le suivi budgétaire ne relève pas de cet écran : les montants inscrits qualifient
                les activités, leur consommation est tenue par le contrôle de gestion.
              </p>
            </Carte>

            <Carte titre="Exécution d'ensemble">
              <div className="mt-3.5 flex flex-col items-center gap-3">
                <Anneau pourcentage={plan?.avancementGlobal ?? 0} objectif={100} taille={132} />
                <span className="text-center text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  Moyenne des {plan?.activites.length ?? 0} activités inscrites au plan.
                </span>
              </div>
            </Carte>
          </div>

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
              chargement={isPending}
              colonnes={colonnes}
              lignes={plan?.activites ?? []}
              cleLigne={(a) => a.id}
              onLigneClick={(a) => naviguer(`/activites/${a.id}`)}
              vide="Aucune activité inscrite à ce plan."
            />
          </div>
        </div>
      </div>

      {action && plan && (
        <ModaleEtatPlan
          ouverte
          onFermer={() => setAction(null)}
          annee={periode.annee}
          structureSigle={plan.structureSigle}
          action={action}
        />
      )}
    </>
  );
}
