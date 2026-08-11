import { Link } from "react-router";
import { CaseACocher } from "@/components/ui/CaseACocher";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { JaugeDelai } from "@/features/courrier/components/JaugeDelai";
import { statutAffiche } from "@/features/courrier/statut";
import { formaterDate } from "@/lib/format";
import type { CourrierResume } from "@/types/courrier";

/**
 * Registre des courriers.
 *
 * Grille CSS et non `<table>` : les colonnes doivent garder une largeur fixe
 * quel que soit le contenu, et une ligne entiere doit rester cliquable.
 * Le role ARIA retablit la semantique de tableau pour les lecteurs d'ecran.
 */
const GRILLE =
  "grid grid-cols-[38px_116px_minmax(140px,1fr)_minmax(200px,1.5fr)_112px_128px_108px_104px_100px_34px] items-center gap-2.5 px-[26px]";

const COLONNES = [
  "N° d'enregistrement",
  "Expéditeur",
  "Objet",
  "Statut",
  "Coté à",
  "Nature",
  "Délai",
  "Arrivé le",
];

/** La colonne « Cote a » montre le chef de file ; les co-saisies sont comptees. */
function ColonneCotation({ structures }: { structures: string[] }) {
  if (structures.length === 0) {
    return <span className="text-[11.5px] leading-none font-medium text-encre-tenue">—</span>;
  }

  return (
    <span
      className="flex min-w-0 items-center gap-1.5"
      title={
        structures.length > 1
          ? `Chef de file : ${structures[0]} — également coté à ${structures.slice(1).join(", ")}`
          : `Chef de file : ${structures[0]}`
      }
    >
      <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
        {structures[0]}
      </span>
      {structures.length > 1 && (
        <span className="flex-none rounded-none bg-surface-douce px-1 py-0.5 text-[10px] leading-none font-bold text-encre-faible">
          +{structures.length - 1}
        </span>
      )}
    </span>
  );
}

function Ligne({
  courrier,
  selectionnee,
  onSelection,
}: {
  courrier: CourrierResume;
  selectionnee: boolean;
  onSelection: (id: number, cochee: boolean) => void;
}) {
  const statut = statutAffiche(courrier);

  return (
    <div
      role="row"
      className={`${GRILLE} border-b border-separateur py-3 transition-colors duration-150 ${
        selectionnee ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
      }`}
    >
      <CaseACocher
        cochee={selectionnee}
        onChange={(cochee) => onSelection(courrier.id, cochee)}
        libelle={`Sélectionner le courrier ${courrier.numero}`}
      />

      <Link
        to={`/courriers/${courrier.id}`}
        className="text-[11.5px] leading-none font-semibold text-encre-faible tabular-nums hover:text-accent"
      >
        {courrier.numero}
      </Link>

      <span className="truncate text-xs leading-[1.3] font-semibold text-encre-douce" title={courrier.correspondant}>
        {courrier.correspondant}
      </span>

      <Link
        to={`/courriers/${courrier.id}`}
        className="flex min-w-0 items-center gap-2 text-[12.5px] leading-[1.3] font-semibold text-encre hover:text-accent"
        title={courrier.objet}
      >
        <span className="truncate">{courrier.objet}</span>
        {courrier.confidentiel && (
          <Icone nom="bouclier" taille={12} className="flex-none text-confidentiel" />
        )}
      </Link>

      <span className="justify-self-start">
        <Etiquette ton={statut.ton}>{statut.libelle}</Etiquette>
      </span>

      <ColonneCotation structures={courrier.structuresCotees} />

      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne">
        {courrier.nature}
      </span>

      <JaugeDelai delai={courrier.delai} termine={courrier.etape === "CLOTURE"} />

      <span className="text-[11.5px] leading-none font-medium text-encre-faible">
        {formaterDate(courrier.dateReception)}
      </span>

      <button
        type="button"
        aria-label={`Actions sur ${courrier.numero}`}
        className="justify-self-center text-sm leading-none font-bold tracking-[1px] text-encre-tenue hover:text-encre-faible"
      >
        ···
      </button>
    </div>
  );
}

type Props = {
  lignes: CourrierResume[];
  selection: Set<number>;
  onSelection: (id: number, cochee: boolean) => void;
  onToutSelectionner: (cochee: boolean) => void;
  /** Vrai pendant le rechargement : la liste reste lisible, simplement estompee. */
  enChargement?: boolean;
};

export function TableauRegistre({
  lignes,
  selection,
  onSelection,
  onToutSelectionner,
  enChargement = false,
}: Props) {
  const toutes = lignes.length > 0 && lignes.every((c) => selection.has(c.id));
  const partielle = !toutes && lignes.some((c) => selection.has(c.id));

  if (lignes.length === 0 && !enChargement) {
    return (
      <div className="grid flex-1 place-items-center px-6 py-16 text-center">
        <div>
          <p className="text-sm font-bold text-encre-douce">Aucun courrier</p>
          <p className="mt-1.5 text-xs font-medium text-encre-tenue">
            Aucun courrier ne correspond à ce filtre.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="table"
      aria-label="Registre des courriers"
      className={`min-w-[1180px] transition-opacity duration-150 ${enChargement ? "opacity-55" : ""}`}
    >
      <div
        role="row"
        className={`${GRILLE} sticky top-0 z-2 border-y border-bordure bg-surface-tete py-2.5`}
      >
        <CaseACocher
          cochee={toutes}
          partielle={partielle}
          onChange={onToutSelectionner}
          libelle="Sélectionner toute la page"
        />
        {COLONNES.map((titre) => (
          <span
            key={titre}
            role="columnheader"
            className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
          >
            {titre}
          </span>
        ))}
        <span />
      </div>

      {lignes.map((courrier) => (
        <Ligne
          key={courrier.id}
          courrier={courrier}
          selectionnee={selection.has(courrier.id)}
          onSelection={onSelection}
        />
      ))}
    </div>
  );
}
