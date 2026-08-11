type Props = {
  page: number;
  nombrePages: number;
  onChange: (page: number) => void;
  /** Ligne d'information a gauche : « 42 courriers affiches sur 128 ». */
  resume: string;
};

const CASE = "rounded-none border px-[11px] py-1.5 text-[11.5px] leading-none transition-colors duration-150";

export function Pagination({ page, nombrePages, onChange, resume }: Props) {
  const pages = Array.from({ length: nombrePages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-[26px] pt-3.5 pb-[26px]">
      <span className="text-[11.5px] leading-none font-medium text-encre-tenue">{resume}</span>

      {nombrePages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
            className={`${CASE} border-bordure-forte px-2.5 font-semibold text-encre-faible hover:bg-surface-douce disabled:opacity-40 disabled:hover:bg-transparent`}
          >
            Précédent
          </button>
          {pages.map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onChange(n)}
              className={`${CASE} ${
                n === page
                  ? "border-accent-trait bg-accent-voile font-bold text-accent-fonce"
                  : "border-bordure-forte font-semibold text-encre-faible hover:bg-surface-douce"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={page === nombrePages}
            onClick={() => onChange(page + 1)}
            className={`${CASE} border-bordure-forte px-2.5 font-semibold text-encre-faible hover:bg-surface-douce disabled:opacity-40 disabled:hover:bg-transparent`}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
