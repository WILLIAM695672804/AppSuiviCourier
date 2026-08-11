import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import {
  filialesQuery,
  type EtatDecision,
  type EtatPreparation,
  type OrganeGestion,
  type PrescriptionFiliale,
} from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Filiales et succursales — §3.3.
 *
 * « Suivre la préparation des sessions des organes de gestion des filiales et
 * succursales et la mise en œuvre de leurs prescriptions. »
 *
 * L'écran a deux moitiés parce que la mission en a deux : l'amont — le dossier
 * de séance sera-t-il prêt — et l'aval — ce qui a été prescrit est-il exécuté.
 * Les traiter sur deux écrans aurait dissocié ce qui, pour la DSR, est un seul
 * cycle : on prépare une session, elle produit des prescriptions, on les suit
 * jusqu'à la session suivante où l'on rendra compte.
 *
 * La colonne des pièces reçues est celle qui compte. Une session dont le
 * dossier n'est pas constitué se tiendra quand même, mais sans les documents
 * qui permettent d'y décider quoi que ce soit.
 */
const TONS_PREPARATION: Record<EtatPreparation, TonEtiquette> = {
  "À préparer": "danger",
  "Dossier en cours": "alerte",
  "Dossier transmis": "succes",
  Tenue: "neutre",
};

const TONS_ETAT: Record<EtatDecision, TonEtiquette> = {
  "À lancer": "neutre",
  "En cours": "accent",
  Exécutée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

export function Filiales() {
  const { data, isPending } = useQuery(filialesQuery());

  const colonnesOrganes: Colonne<OrganeGestion>[] = [
    {
      cle: "entite",
      entete: "Entité",
      largeur: "minmax(200px,1.8fr)",
      role: "titre",
      rendu: (o) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {o.entite}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {o.sigle} · {o.nature} · {o.organe}
          </span>
        </span>
      ),
    },
    {
      cle: "session",
      entete: "Prochaine session",
      largeur: "136px",
      rendu: (o) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterDate(o.prochaineSession)}
        </span>
      ),
    },
    {
      cle: "dossier",
      entete: "Dossier de séance",
      largeur: "minmax(150px,1fr)",
      rendu: (o) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <BarreProgression
            taux={(o.documentsRecus / o.documentsAttendus) * 100}
            niveau={o.feu}
            chiffre={false}
          />
          <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
            {o.documentsRecus} pièce{o.documentsRecus > 1 ? "s" : ""} sur {o.documentsAttendus}
          </span>
        </span>
      ),
    },
    {
      cle: "preparation",
      entete: "Préparation",
      largeur: "148px",
      rendu: (o) => (
        <Etiquette ton={TONS_PREPARATION[o.etatPreparation]}>{o.etatPreparation}</Etiquette>
      ),
    },
    {
      cle: "prescriptions",
      entete: "Prescriptions",
      largeur: "128px",
      role: "meta",
      alignement: "droite",
      rendu: (o) => (
        <span className="flex min-w-0 flex-col items-end gap-1.5">
          <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
            {o.prescriptionsExecutees} / {o.prescriptionsTotal}
          </span>
          {o.prescriptionsEnRetard > 0 && (
            <Feu niveau="rouge" libelle={`${o.prescriptionsEnRetard} en retard`} />
          )}
        </span>
      ),
    },
  ];

  const colonnesPrescriptions: Colonne<PrescriptionFiliale>[] = [
    {
      cle: "objet",
      entete: "Prescription",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (p) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {p.objet}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {p.reference} · {p.entite} · {p.sessionOrigine}
          </span>
        </span>
      ),
    },
    {
      cle: "echeance",
      entete: "Échéance",
      largeur: "116px",
      rendu: (p) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterDate(p.echeance)}
        </span>
      ),
    },
    {
      cle: "avancement",
      entete: "Avancement",
      largeur: "minmax(130px,1fr)",
      rendu: (p) => <BarreProgression taux={p.avancement} niveau={p.feu} />,
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "112px",
      rendu: (p) => <Etiquette ton={TONS_ETAT[p.etat]}>{p.etat}</Etiquette>,
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Filiales et succursales"
        compte={data?.organes.length}
        sousTitre="Sessions des organes de gestion et suivi de leurs prescriptions"
        actions={
          <Bouton variante="principal" icone="plus">
            Ouvrir une session
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          <Carte titre="Préparation des sessions">
            <div className="mt-2">
              <Tableau
                chargement={isPending}
                colonnes={colonnesOrganes}
                lignes={data?.organes ?? []}
                cleLigne={(o) => o.id}
                vide="Aucun organe de gestion suivi."
              />
            </div>
            <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Une session dont le dossier n'est pas constitué se tiendra quand même — mais sans les
              documents qui permettent d'y décider quoi que ce soit.
            </p>
          </Carte>

          <Carte titre="Mise en œuvre des prescriptions">
            <div className="mt-2">
              <Tableau
                chargement={isPending}
                colonnes={colonnesPrescriptions}
                lignes={data?.prescriptions ?? []}
                cleLigne={(p) => p.id}
                vide="Aucune prescription en cours."
              />
            </div>
          </Carte>
        </div>
      </div>
    </>
  );
}
