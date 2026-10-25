import { PiedGraphe } from "@/components/ui/PiedGraphe";

export interface PartRepartition {
  libelle: string;
  valeur: number;
}

/** Echelle sequentielle de l'accent, du plus soutenu au plus clair. */
const TEINTES = [
  "var(--color-serie-1)",
  "var(--color-serie-2)",
  "var(--color-serie-3)",
  "var(--color-serie-4)",
  "var(--color-serie-5)",
];

/* Repere de dessin. Le trace est en coordonnees fixes puis mis a l'echelle
   par le viewBox : c'est ce qui evite de mesurer le conteneur en JavaScript. */
const LARGEUR = 360;
const HAUTEUR = 226;
const CX = LARGEUR / 2;
const CY = HAUTEUR / 2;
const RAYON = 66;
const EPAISSEUR = 30;
/** Abscisse du coude des lignes de rappel, de part et d'autre du centre. */
const COUDE = 112;
/** Hauteur minimale entre deux etiquettes d'un meme cote. */
const INTERLIGNE = 18;

/**
 * Anneau de repartition, etiquettes posees autour et reliees par un trait.
 *
 * La legende en pave, sous le graphique, oblige a faire l'aller-retour entre
 * une pastille de couleur et une part : pour cinq structures aux teintes
 * voisines, cet aller-retour se rate. L'etiquette reliee a sa part supprime le
 * probleme — c'est la raison d'etre des lignes de rappel, pas leur decor.
 *
 * L'anneau plutot que le disque : le centre libere sert au total, qui est le
 * chiffre que l'on cherche en premier.
 *
 * Il n'y a donc pas de legende, et c'est le seul trace dans ce cas : les
 * etiquettes reliees *sont* la legende, posee au contact de la part. Le pied ne
 * sert ici qu'a la mention d'unite et a la note, au meme endroit qu'ailleurs.
 */
export function GrapheRepartition({
  parts,
  total,
  libelleTotal,
  format = (valeur) => valeur.toLocaleString("fr-FR"),
  mention,
  note,
}: {
  parts: PartRepartition[];
  /** Total inscrit au centre. Par defaut, la somme des parts affichees. */
  total?: number;
  libelleTotal?: string;
  format?: (valeur: number) => string;
  /** Mention posee au pied : l'unite, la periode couverte. */
  mention?: string;
  /** Reserve de lecture, posee a droite du pied. */
  note?: string;
}) {
  const somme = parts.reduce((cumul, part) => cumul + part.valeur, 0) || 1;
  const circonference = 2 * Math.PI * RAYON;

  /* Un segment par part, pose sur un cercle unique : la longueur du tiret
     porte la valeur, le decalage porte la position. Deux pixels sont retires
     a chaque tiret pour que les parts voisines ne se touchent pas. */
  const cumuls = parts.map((_, index) =>
    parts.slice(0, index).reduce((total, part) => total + part.valeur, 0),
  );

  const segments = parts.map((part, index) => {
    const debut = cumuls[index] / somme;
    const fin = (cumuls[index] + part.valeur) / somme;
    const milieu = ((debut + fin) / 2) * 2 * Math.PI - Math.PI / 2;

    return {
      ...part,
      teinte: TEINTES[index % TEINTES.length],
      longueur: Math.max(0, (fin - debut) * circonference - 2),
      decalage: -debut * circonference,
      part: fin - debut,
      /** Point d'attache de la ligne de rappel, juste au-dela de l'anneau. */
      ancre: {
        x: CX + Math.cos(milieu) * (RAYON + EPAISSEUR / 2 + 3),
        y: CY + Math.sin(milieu) * (RAYON + EPAISSEUR / 2 + 3),
      },
      droite: Math.cos(milieu) >= 0,
    };
  });

  const etiquettes = [
    ...repartirVerticalement(segments.filter((s) => !s.droite)),
    ...repartirVerticalement(segments.filter((s) => s.droite)),
  ];

  const trace = (
    <svg
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      className="w-full"
      role="img"
      aria-label={parts
        .map((part) => `${part.libelle} : ${format(part.valeur)}`)
        .join(" ; ")}
    >
      <g transform={`rotate(-90 ${CX} ${CY})`}>
        {segments.map((segment) => (
          <circle
            key={segment.libelle}
            cx={CX}
            cy={CY}
            r={RAYON}
            fill="none"
            stroke={segment.teinte}
            strokeWidth={EPAISSEUR}
            strokeDasharray={`${segment.longueur} ${circonference - segment.longueur}`}
            strokeDashoffset={segment.decalage}
          >
            <title>{`${segment.libelle} : ${format(segment.valeur)}`}</title>
          </circle>
        ))}
      </g>

      {libelleTotal && (
        <>
          <text
            x={CX}
            y={CY - 2}
            textAnchor="middle"
            className="fill-[color:var(--color-encre)] text-[17px] font-extrabold tabular-nums"
          >
            {format(total ?? somme)}
          </text>
          <text
            x={CX}
            y={CY + 13}
            textAnchor="middle"
            className="fill-[color:var(--color-encre-tenue)] text-[9px] font-semibold"
          >
            {libelleTotal}
          </text>
        </>
      )}

      {etiquettes.map((etiquette) => {
        const sens = etiquette.droite ? 1 : -1;
        const xCoude = CX + sens * COUDE;
        const xTexte = xCoude + sens * 5;

        return (
          <g key={etiquette.libelle}>
            <polyline
              points={`${etiquette.ancre.x},${etiquette.ancre.y} ${xCoude - sens * 12},${etiquette.y} ${xCoude},${etiquette.y}`}
              fill="none"
              stroke="var(--color-bordure-champ)"
              strokeWidth={1}
            />
            <text
              x={xTexte}
              y={etiquette.y - 3}
              textAnchor={etiquette.droite ? "start" : "end"}
              className="fill-[color:var(--color-encre-douce)] text-[9.5px] font-semibold"
            >
              {tronquer(etiquette.libelle)}
            </text>
            <text
              x={xTexte}
              y={etiquette.y + 8}
              textAnchor={etiquette.droite ? "start" : "end"}
              className="fill-[color:var(--color-encre-tenue)] text-[9px] font-medium tabular-nums"
            >
              {`${format(etiquette.valeur)} · ${Math.round(etiquette.part * 100)} %`}
            </text>
          </g>
        );
      })}
    </svg>
  );

  // Sans mention ni note, le trace se rend seul : un conteneur de plus
  // decalerait les panneaux qui le posent deja dans leur propre grille.
  if (!mention && !note) return trace;

  return (
    <div className="flex flex-col gap-2">
      {trace}
      <PiedGraphe mention={mention} note={note} />
    </div>
  );
}

/**
 * Ecarte les etiquettes d'un meme cote jusqu'a ce qu'aucune n'en recouvre une
 * autre. Deux parts voisines et minces ont des angles medians proches : sans
 * cette passe, leurs deux etiquettes se superposent et aucune ne se lit.
 */
function repartirVerticalement<T extends { ancre: { y: number } }>(
  segments: T[],
): (T & { y: number })[] {
  const ordonnes = [...segments].sort((a, b) => a.ancre.y - b.ancre.y);
  let precedent = -Infinity;

  const places = ordonnes.map((segment) => {
    const y = Math.max(segment.ancre.y, precedent + INTERLIGNE);
    precedent = y;
    return { ...segment, y };
  });

  // Le tassement se fait vers le bas ; si la derniere etiquette deborde, tout
  // le paquet remonte d'autant, sans quoi elle sortirait du cadre.
  const debordement = (places.at(-1)?.y ?? 0) - (HAUTEUR - 12);
  return debordement > 0 ? places.map((place) => ({ ...place, y: place.y - debordement })) : places;
}

const tronquer = (texte: string) => (texte.length > 24 ? `${texte.slice(0, 23)}…` : texte);
