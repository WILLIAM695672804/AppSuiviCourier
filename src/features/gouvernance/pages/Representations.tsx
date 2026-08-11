import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import {
  representationsQuery,
  type EtatDecision,
  type RecommandationExterne,
  type Representation,
} from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Représentation du Port autonome à l'extérieur — §3.3.
 *
 * Deux objets distincts, d'où les deux tableaux.
 *
 * Le **mandat** dit qui nous représente, jusqu'à quand, et avec quelle
 * assiduité. Un mandat expiré n'est pas un détail administratif : les
 * positions prises par un représentant sans mandat n'engagent personne, et
 * peuvent être contestées après coup.
 *
 * La **recommandation** engage une structure interne exactement comme une
 * décision d'instance — elle a une échéance, un pilote et un avancement. La
 * seule différence est son origine : elle vient du dehors, ce qui la rend
 * précisément plus facile à oublier.
 *
 * La colonne « apport » est vide pour deux organisations. C'est voulu : le
 * §3.3 demande d'« évaluer l'apport de la présence du PAD » dans ces
 * regroupements, et une case vide est la seule façon honnête de dire qu'on ne
 * l'a pas évalué.
 */
const TONS_ETAT: Record<EtatDecision, TonEtiquette> = {
  "À lancer": "neutre",
  "En cours": "accent",
  Exécutée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

export function Representations() {
  const { data, isPending } = useQuery(representationsQuery());
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const expires = (data?.representations ?? []).filter((r) => r.mandatAu < aujourdhui);

  const colonnesMandats: Colonne<Representation>[] = [
    {
      cle: "organisation",
      entete: "Organisation",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (r) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {r.organisation}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {r.sigle} · {r.nature}
          </span>
        </span>
      ),
    },
    {
      cle: "representant",
      entete: "Représentant",
      largeur: "minmax(150px,1fr)",
      rendu: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar initiales={r.initiales} taille="petit" />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
              {r.representant}
            </span>
            <span className="truncate text-[10px] leading-none font-medium text-encre-tenue">
              {r.suppleant ? `suppléant : ${r.suppleant}` : "aucun suppléant"}
            </span>
          </span>
        </span>
      ),
    },
    {
      cle: "mandat",
      entete: "Mandat",
      largeur: "132px",
      rendu: (r) => {
        const expire = r.mandatAu < aujourdhui;
        return (
          <span className="flex min-w-0 flex-col gap-1.5">
            <span
              className={`text-[11.5px] leading-none font-bold tabular-nums ${
                expire ? "text-danger" : "text-encre-douce"
              }`}
            >
              jusqu'au {formaterDate(r.mandatAu)}
            </span>
            {expire && <Etiquette ton="danger">Expiré</Etiquette>}
          </span>
        );
      },
    },
    {
      cle: "assiduite",
      entete: "Assiduité",
      largeur: "minmax(130px,1fr)",
      rendu: (r) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <BarreProgression taux={r.tauxParticipation} niveau={r.feu} />
          <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
            {r.reunionsParticipees} séances sur {r.reunionsTenues}
          </span>
        </span>
      ),
    },
    {
      cle: "apport",
      entete: "Apport évalué",
      largeur: "minmax(180px,1.4fr)",
      role: "meta",
      rendu: (r) =>
        r.apport ? (
          <span className="line-clamp-2 text-[11px] leading-[1.4] font-medium text-encre-moyenne">
            {r.apport}
          </span>
        ) : (
          <span className="text-[11px] leading-none font-semibold text-alerte">Non évalué</span>
        ),
    },
  ];

  const colonnesRecommandations: Colonne<RecommandationExterne>[] = [
    {
      cle: "objet",
      entete: "Recommandation",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (r) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {r.objet}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {r.reference} · {r.organisation} · émise le {formaterDate(r.emiseLe)}
          </span>
        </span>
      ),
    },
    {
      cle: "pilote",
      entete: "Structure pilote",
      largeur: "128px",
      rendu: (r) => (
        <span className="inline-block rounded-none bg-surface-douce px-1.5 py-1 text-[10px] leading-none font-bold text-encre-douce">
          {r.structurePilote}
        </span>
      ),
    },
    {
      cle: "echeance",
      entete: "Échéance",
      largeur: "112px",
      rendu: (r) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {r.echeance ? formaterDate(r.echeance) : "—"}
        </span>
      ),
    },
    {
      cle: "avancement",
      entete: "Avancement",
      largeur: "minmax(130px,1fr)",
      rendu: (r) => <BarreProgression taux={r.avancement} niveau={r.feu} />,
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "112px",
      rendu: (r) => <Etiquette ton={TONS_ETAT[r.etat]}>{r.etat}</Etiquette>,
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Représentations extérieures"
        compte={data?.representations.length}
        sousTitre="Mandats dans les organisations portuaires et suivi de leurs recommandations"
        actions={
          <Bouton variante="principal" icone="plus">
            Enregistrer un mandat
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          {expires.length > 0 && (
            <Encart ton="danger" icone="bouclier">
              {expires.length} mandat{expires.length > 1 ? "s sont expirés" : " est expiré"} :{" "}
              {expires.map((r) => r.sigle).join(", ")}. Les positions prises par un représentant
              sans mandat n'engagent pas l'institution et peuvent être contestées après coup.
            </Encart>
          )}

          <Carte titre="Mandats de représentation">
            <div className="mt-2">
              <Tableau
                chargement={isPending}
                colonnes={colonnesMandats}
                lignes={data?.representations ?? []}
                cleLigne={(r) => r.id}
                vide="Aucun mandat enregistré."
              />
            </div>
            <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue">
              L'apport de la présence du PAD reste à évaluer pour les organisations dont la case
              est vide. Une case vide dit ce qu'elle dit : l'évaluation n'a pas été faite.
            </p>
          </Carte>

          <Carte titre="Avis et recommandations à mettre en œuvre">
            <div className="mt-2">
              <Tableau
                chargement={isPending}
                colonnes={colonnesRecommandations}
                lignes={data?.recommandations ?? []}
                cleLigne={(r) => r.id}
                vide="Aucune recommandation en cours."
              />
            </div>
            <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Une recommandation externe engage sa structure pilote comme une décision d'instance.
              Sa seule différence est de venir du dehors — ce qui la rend plus facile à oublier.
            </p>
          </Carte>
        </div>
      </div>
    </>
  );
}
