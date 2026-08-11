export type Onglet<T extends string> = {
  cle: T;
  libelle: string;
};

type Props<T extends string> = {
  onglets: readonly Onglet<T>[];
  actif: T;
  onChange: (cle: T) => void;
};

/** Onglets soulignes de la barre d'ecran. Filtres, jamais navigation. */
export function Onglets<T extends string>({ onglets, actif, onChange }: Props<T>) {
  return (
    <div role="tablist" className="flex items-center gap-[22px] border-b border-bordure px-[26px]">
      {onglets.map(({ cle, libelle }) => {
        const on = cle === actif;
        return (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(cle)}
            className={`cursor-pointer border-b-2 py-[13px] text-[12.5px] leading-none font-semibold transition-colors duration-150 ${
              on ? "border-accent text-encre" : "border-transparent text-encre-faible hover:text-encre-douce"
            }`}
          >
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
