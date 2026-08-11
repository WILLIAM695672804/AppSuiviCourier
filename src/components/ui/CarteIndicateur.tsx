export type TonIndicateur = "accent" | "succes" | "alerte" | "danger";

const TRAIT: Record<TonIndicateur, string> = {
  accent: "#2f6bed",
  succes: "#12b76a",
  alerte: "#f79009",
  danger: "#f04438",
};

const TEXTE: Record<TonIndicateur, string> = {
  accent: "text-accent",
  succes: "text-succes",
  alerte: "text-alerte",
  danger: "text-danger-fonce",
};

const LARGEUR = 96;
const HAUTEUR = 34;

/** Courbe de tendance sans axes ni echelle : elle donne le sens, pas la mesure. */
function Sparkline({ serie, ton }: { serie: number[]; ton: TonIndicateur }) {
  if (serie.length < 2) return null;

  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const amplitude = max - min || 1;
  const pas = (LARGEUR - 4) / (serie.length - 1);

  const trace = serie
    .map((v, i) => {
      const x = 2 + i * pas;
      const y = 4 + (1 - (v - min) / amplitude) * (HAUTEUR - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L");

  return (
    <svg
      width={LARGEUR}
      height={HAUTEUR}
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      fill="none"
      className="flex-none"
      aria-hidden="true"
    >
      <path
        d={`M${trace}`}
        stroke={TRAIT[ton]}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Props = {
  libelle: string;
  valeur: string;
  variation?: { texte: string; ton: TonIndicateur };
  serie?: number[];
  ton?: TonIndicateur;
  /** Precision sous le chiffre : ce qu'il recouvre, ou l'objectif vise. */
  note?: string;
};

export function CarteIndicateur({ libelle, valeur, variation, serie, ton = "accent", note }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-[15px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-xs leading-none font-semibold text-encre-moyenne">{libelle}</span>
        <div className="flex items-baseline gap-[7px]">
          <span className="text-2xl leading-none font-bold tracking-[-.6px] whitespace-nowrap text-encre tabular-nums">
            {valeur}
          </span>
          {variation && (
            <span className={`text-[11px] leading-none font-bold whitespace-nowrap ${TEXTE[variation.ton]}`}>
              {variation.texte}
            </span>
          )}
        </div>
        {note && (
          <span className="text-[11px] leading-none font-medium text-encre-tenue">{note}</span>
        )}
      </div>
      {serie && <Sparkline serie={serie} ton={ton} />}
    </div>
  );
}
