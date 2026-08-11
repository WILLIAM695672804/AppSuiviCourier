import { Icone } from "@/components/ui/Icone";
import {
  decalerPeriode,
  libellePeriode,
  memePeriode,
  periodeCourante,
  type Periode,
} from "@/lib/periode";

/**
 * Choix de la période observée : l'en-tête commun de tous les écrans de
 * pilotage. La logique de calendrier vit dans `lib/periode.ts`, parce que les
 * requêtes en ont besoin autant que l'affichage.
 */
export function SelecteurPeriode({
  periode,
  onChange,
  /** Interdit d'aller au-delà de la période en cours : l'avenir n'est pas mesuré. */
  bornerAuPresent = true,
}: {
  periode: Periode;
  onChange: (periode: Periode) => void;
  bornerAuPresent?: boolean;
}) {
  const auPresent = memePeriode(periode, periodeCourante(periode.granularite));

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(decalerPeriode(periode, -1))}
        aria-label="Période précédente"
        className="grid size-10 flex-none cursor-pointer place-items-center rounded-none border border-bordure-forte text-encre-faible transition-colors duration-150 hover:bg-surface-douce"
      >
        <Icone nom="chevronGauche" taille={13} />
      </button>

      <span className="inline-flex min-w-[124px] items-center justify-center gap-2 rounded-none border border-bordure-forte px-3 py-[9px] text-xs leading-none font-semibold text-encre">
        <Icone nom="calendrier" taille={13} className="flex-none text-encre-tenue" />
        {libellePeriode(periode)}
      </span>

      <button
        type="button"
        onClick={() => onChange(decalerPeriode(periode, 1))}
        disabled={bornerAuPresent && auPresent}
        aria-label="Période suivante"
        className="grid size-10 flex-none cursor-pointer place-items-center rounded-none border border-bordure-forte text-encre-faible transition-colors duration-150 hover:bg-surface-douce disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Icone nom="chevronDroite" taille={13} />
      </button>
    </div>
  );
}
