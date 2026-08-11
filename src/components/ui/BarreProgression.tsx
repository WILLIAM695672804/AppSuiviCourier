import { feuDepuisTaux, type NiveauFeu } from "@/lib/feu";

/**
 * Taux d'exécution d'une activité, d'un plan d'actions ou d'une structure.
 *
 * L'anneau existant (`Anneau`) reste le bon choix pour un indicateur unique
 * mis en avant. Celui-ci sert aux listes : cinquante activités les unes sous
 * les autres, où seule compte la comparaison d'une ligne à l'autre.
 *
 * La cible, quand elle est fournie, apparaît comme un repère sur la barre.
 * Sans elle, on ne peut pas dire si 62 % est une bonne ou une mauvaise
 * nouvelle — et c'est pourtant la seule question que pose le lecteur.
 */
const TEINTES: Record<NiveauFeu, string> = {
  vert: "bg-succes-vif",
  orange: "bg-alerte-vif",
  rouge: "bg-danger-vif",
  inconnu: "bg-encre-tenue",
};

export function BarreProgression({
  taux,
  cible,
  /** Force la teinte au lieu de la déduire du taux. */
  niveau,
  chiffre = true,
}: {
  taux: number;
  cible?: number;
  niveau?: NiveauFeu;
  chiffre?: boolean;
}) {
  const atteint = Math.min(100, Math.max(0, Math.round(taux)));
  const teinte = TEINTES[niveau ?? feuDepuisTaux(taux)];

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        role="progressbar"
        aria-valuenow={atteint}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={cible === undefined ? "Taux d'exécution" : `Taux d'exécution, cible ${cible} %`}
        className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-none bg-inerte"
      >
        <span
          className={`block h-full rounded-none transition-[width] duration-300 ${teinte}`}
          style={{ width: `${atteint}%` }}
        />
        {cible !== undefined && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-encre-douce"
            style={{ left: `${Math.min(100, Math.max(0, cible))}%` }}
          />
        )}
      </div>
      {chiffre && (
        <span className="w-9 flex-none text-right text-[11.5px] leading-none font-bold text-encre tabular-nums">
          {atteint} %
        </span>
      )}
    </div>
  );
}
