import type { DelaiCourrier } from "@/types/courrier";

const SEGMENTS = 6;

/**
 * Consommation du delai, en six segments.
 *
 * Le chiffre seul ne se lit pas dans un tableau de cent lignes : l'agent
 * balaie la colonne et cherche le rouge. Le texte reste la pour la precision.
 * Un jour entame allume un segment — d'ou l'arrondi superieur.
 */
export function JaugeDelai({ delai, termine = false }: { delai: DelaiCourrier | null; termine?: boolean }) {
  if (!delai) {
    return <span className="text-[11.5px] leading-none font-medium text-encre-tenue">—</span>;
  }

  const { joursEcoules, joursAlloues, joursDepassement } = delai;
  const depasse = joursDepassement > 0;
  const ratio = joursAlloues > 0 ? joursEcoules / joursAlloues : 0;

  const remplis = depasse ? SEGMENTS : Math.min(SEGMENTS, Math.max(1, Math.ceil(ratio * SEGMENTS)));

  const couleur = depasse
    ? "bg-danger-vif"
    : termine || ratio <= 0.5
      ? "bg-succes-vif"
      : "bg-alerte-vif";

  const teinteTexte = depasse
    ? "text-danger-fonce font-bold"
    : termine
      ? "text-succes font-semibold"
      : ratio > 0.5
        ? "text-alerte font-semibold"
        : "text-encre-faible font-semibold";

  return (
    <div className="flex items-center gap-[7px]">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className={`h-3 w-[3px] rounded-none ${i < remplis ? couleur : "bg-inerte"}`}
          />
        ))}
      </div>
      <span className={`text-[10.5px] leading-none tabular-nums ${teinteTexte}`}>
        {depasse ? `+ ${joursDepassement} j` : `${joursEcoules}/${joursAlloues} j`}
      </span>
    </div>
  );
}
