import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import {
  versementsQuery,
  type EtatVersement,
  type Versement,
} from "@/features/archivage/api";
import { formaterDate } from "@/lib/format";

/**
 * File des dossiers clos à verser au système d'archivage.
 *
 * La colonne qui décide de tout est l'échéance du sort final : c'est la date à
 * laquelle la durée d'utilité administrative expire. Un dossier dont
 * l'échéance est passée sans traitement n'est pas un retard administratif
 * ordinaire — c'est une non-conformité archivistique, opposable en cas de
 * contrôle.
 *
 * Le tri place donc les échéances dépassées en tête, avant même les anomalies
 * bloquantes : une pièce manquante se répare, une durée légale dépassée ne se
 * rattrape pas.
 */
const FILTRES = [
  "Tous",
  "À verser",
  "Échéance dépassée",
  "Anomalie",
  "Versé",
] as const;

const TONS_ETAT: Record<EtatVersement, TonEtiquette> = {
  "À verser": "accent",
  "En cours": "alerte",
  Versé: "succes",
  Anomalie: "danger",
};

export function Versements() {
  const naviguer = useNavigate();
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]>("Tous");

  const { data, isPending } = useQuery(versementsQuery(filtre));
  const aujourdhui = new Date().toISOString().slice(0, 10);

  // Un dossier sans règle de conservation n'a pas d'échéance de sort final :
  // il passe en tête, avant les échéances dépassées. Ce n'est pas une urgence
  // de calendrier, c'est une règle qui manque — et tant qu'elle manque, le
  // dossier ne peut pas être versé du tout.
  const rang = (v: Versement) => {
    if (v.echeanceSortFinal === null) return 0;
    return v.echeanceSortFinal < aujourdhui && v.etat !== "Versé" ? 1 : 2;
  };

  const versements = [...(data?.versements ?? [])].sort(
    (a, b) =>
      rang(a) - rang(b) ||
      (a.echeanceSortFinal ?? "").localeCompare(b.echeanceSortFinal ?? ""),
  );

  const colonnes: Colonne<Versement>[] = [
    {
      cle: "objet",
      entete: "Dossier clos",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (v) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {v.objet}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {v.reference} · {v.structure} · clos le {formaterDate(v.closLe)}
          </span>
        </span>
      ),
    },
    {
      cle: "typologie",
      entete: "Typologie",
      largeur: "minmax(150px,1fr)",
      rendu: (v) => (
        <span className="truncate text-[11.5px] leading-[1.3] font-semibold text-encre-douce">
          {v.typologie}
        </span>
      ),
    },
    {
      cle: "echeance",
      entete: "Échéance du sort final",
      largeur: "148px",
      rendu: (v) => {
        const depassee =
          v.echeanceSortFinal !== null &&
          v.echeanceSortFinal < aujourdhui &&
          v.etat !== "Versé";
        return (
          <span className="flex min-w-0 flex-col gap-1.5">
            <span
              className={`text-[11.5px] leading-none font-bold tabular-nums ${
                depassee ? "text-danger" : "text-encre-douce"
              }`}
            >
              {formaterDate(v.echeanceSortFinal)}
            </span>
            <span className="text-[10px] leading-none font-medium text-encre-tenue">
              {depassee
                ? "dépassée"
                : `${v.sortFinal.toLowerCase()} · DUA ${v.dua} ans`}
            </span>
          </span>
        );
      },
    },
    {
      cle: "pieces",
      entete: "Pièces",
      largeur: "104px",
      rendu: (v) => (
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <span
            className={`text-[12px] leading-none font-bold tabular-nums ${
              v.pieces < v.piecesAttendues ? "text-danger" : "text-encre"
            }`}
          >
            {v.pieces} / {v.piecesAttendues}
          </span>
          {v.pieces < v.piecesAttendues && (
            <Feu niveau="rouge" libelle="incomplet" />
          )}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "116px",
      rendu: (v) => <Etiquette ton={TONS_ETAT[v.etat]}>{v.etat}</Etiquette>,
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Versements"
        compte={versements.length}
        sousTitre="Dossiers clos à contrôler puis à verser au système d'archivage"
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs
            compteurs={data?.compteurs ?? []}
            chargement={isPending}
          />

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <Pastilles
              options={FILTRES}
              actif={filtre}
              onChange={setFiltre}
              libelle="Filtrer les versements"
            />

            <div className="mt-3.5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={versements}
                cleLigne={(v) => v.id}
                onLigneClick={(v) => naviguer(`/archivage/versements/${v.id}`)}
                vide="Aucun dossier pour ce filtre."
              />
            </div>
          </div>

          <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            Une échéance dépassée n'est pas un retard ordinaire : la durée
            légale de conservation est opposable en cas de contrôle, et son
            dépassement se constate sans se rattraper.
          </p>
        </div>
      </div>
    </>
  );
}
