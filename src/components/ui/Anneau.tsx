/**
 * Jauge circulaire d'un taux.
 *
 * L'anneau se lit d'un coup d'oeil, mais ne dit pas de combien on est loin de
 * l'objectif : celui-ci est donc ecrit sous le chiffre, en toutes lettres.
 */
export function Anneau({
  pourcentage,
  objectif,
  taille = 132,
}: {
  pourcentage: number;
  objectif?: number;
  taille?: number;
}) {
  const rayon = taille / 2 - 9;
  const circonference = 2 * Math.PI * rayon;
  const atteint = Math.min(100, Math.max(0, pourcentage));
  const rempli = (atteint / 100) * circonference;

  const teinte =
    objectif === undefined || atteint >= objectif
      ? "var(--color-succes-vif)"
      : atteint >= objectif - 15
        ? "var(--color-alerte-vif)"
        : "var(--color-danger-vif)";

  return (
    <div className="relative grid place-items-center" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90" aria-hidden="true">
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="var(--color-inerte)"
          strokeWidth="10"
        />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={teinte}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${circonference}`}
          className="transition-[stroke-dasharray] duration-300"
        />
      </svg>

      <div className="absolute flex flex-col items-center gap-1">
        <span className="text-xl leading-none font-extrabold tracking-[-.4px] text-encre tabular-nums">
          {atteint} %
        </span>
        {objectif !== undefined && (
          <span className="text-[10px] leading-none font-medium text-encre-tenue">
            objectif {objectif} %
          </span>
        )}
      </div>
    </div>
  );
}
