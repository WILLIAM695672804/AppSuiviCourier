import type { NiveauFeu } from "@/lib/feu";

/**
 * Nuage de points, en SVG pur.
 *
 * Il sert à une seule question, mais qu'aucun autre graphique ne pose : deux
 * mesures varient-elles ensemble. Une structure qui exécute mal son plan
 * d'actions traite-t-elle aussi mal son courrier, ou les deux sont-ils sans
 * rapport ? Un histogramme range, un nuage rapproche.
 *
 * Pas de bibliothèque : douze points et deux axes ne justifient pas 300 ko à
 * chaque chargement, dans une administration où le réseau est lent.
 *
 * Deux garde-fous, parce qu'un nuage suggère toujours plus qu'il ne démontre :
 * chaque point porte son libellé au survol, et la légende rappelle en toutes
 * lettres qu'une proximité n'est pas une cause.
 */
export interface Point {
  libelle: string;
  x: number;
  y: number;
  feu: NiveauFeu;
}

const TEINTES: Record<NiveauFeu, string> = {
  vert: "var(--color-succes-vif)",
  orange: "var(--color-alerte-vif)",
  rouge: "var(--color-danger-vif)",
  inconnu: "var(--color-encre-tenue)",
};

const MARGE = { gauche: 38, bas: 30, haut: 12, droite: 12 };

export function NuageDePoints({
  points,
  libelleX,
  libelleY,
  hauteur = 280,
}: {
  points: Point[];
  libelleX: string;
  libelleY: string;
  hauteur?: number;
}) {
  const largeur = 520;
  const traceLargeur = largeur - MARGE.gauche - MARGE.droite;
  const traceHauteur = hauteur - MARGE.haut - MARGE.bas;

  // Les deux axes vont de 0 a 100 : ce sont des taux, et les borner ailleurs
  // donnerait au meme ecart une apparence differente d'un ecran a l'autre.
  const versX = (valeur: number) => MARGE.gauche + (valeur / 100) * traceLargeur;
  const versY = (valeur: number) => MARGE.haut + (1 - valeur / 100) * traceHauteur;

  const graduations = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${largeur} ${hauteur}`}
          className="h-auto w-full min-w-[420px]"
          role="img"
          aria-label={`Nuage de points : ${libelleX} en abscisse, ${libelleY} en ordonnée`}
        >
          {/* Grille et graduations */}
          {graduations.map((valeur) => (
            <g key={`h-${valeur}`}>
              <line
                x1={MARGE.gauche}
                x2={largeur - MARGE.droite}
                y1={versY(valeur)}
                y2={versY(valeur)}
                stroke="var(--color-separateur)"
                strokeWidth="1"
              />
              <text
                x={MARGE.gauche - 8}
                y={versY(valeur) + 3.5}
                textAnchor="end"
                className="fill-[var(--color-encre-tenue)] text-[9px] font-semibold"
              >
                {valeur}
              </text>
            </g>
          ))}

          {graduations.map((valeur) => (
            <text
              key={`v-${valeur}`}
              x={versX(valeur)}
              y={hauteur - MARGE.bas + 14}
              textAnchor="middle"
              className="fill-[var(--color-encre-tenue)] text-[9px] font-semibold"
            >
              {valeur}
            </text>
          ))}

          {/* Diagonale de reference : au-dessus, la structure fait mieux sur Y que sur X. */}
          <line
            x1={versX(0)}
            y1={versY(0)}
            x2={versX(100)}
            y2={versY(100)}
            stroke="var(--color-bordure)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {points.map((point) => (
            <g key={point.libelle}>
              <circle
                cx={versX(point.x)}
                cy={versY(point.y)}
                r="6"
                fill={TEINTES[point.feu]}
                fillOpacity="0.85"
              >
                <title>{`${point.libelle} — ${libelleX} : ${point.x}, ${libelleY} : ${point.y}`}</title>
              </circle>
              <text
                x={versX(point.x)}
                y={versY(point.y) - 10}
                textAnchor="middle"
                className="fill-[var(--color-encre-douce)] text-[9px] font-bold"
              >
                {point.libelle}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-[10.5px] leading-none font-semibold text-encre-tenue">
          Abscisse : {libelleX} · Ordonnée : {libelleY}
        </span>
        <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">
          Une proximité n'est pas une cause : ce nuage montre ce qui varie ensemble, pas ce qui
          explique quoi.
        </span>
      </div>
    </div>
  );
}
