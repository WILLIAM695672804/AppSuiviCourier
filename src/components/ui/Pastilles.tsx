/**
 * Rangée de filtres exclusifs, en pastilles.
 *
 * Née dans l'écran de traçabilité, elle en sort ici parce que tous les
 * registres de la gouvernance filtrent de la même manière : par nature de
 * décision, par instance, par type de rapport. Trois écrans qui redessinent
 * le même bouton finissent toujours par diverger.
 *
 * Sur mobile, la rangée défile horizontalement plutôt que de passer à la
 * ligne : une rangée de filtres qui occupe quatre lignes repousse le contenu
 * hors de l'écran, et c'est le contenu qu'on est venu lire.
 */
export function Pastilles<T extends string>({
  options,
  actif,
  onChange,
  libelle,
}: {
  options: readonly T[];
  actif: T;
  onChange: (valeur: T) => void;
  /** Nommé pour le lecteur d'écran : « Filtrer par nature ». */
  libelle: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={libelle}
      className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {options.map((option) => {
        const on = actif === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option)}
            className={`min-h-11 flex-none cursor-pointer rounded-none px-3 text-xs leading-none font-semibold transition-colors duration-150 md:min-h-0 md:py-2 ${
              on ? "bg-encre text-white" : "bg-surface-douce text-encre-faible hover:bg-bordure"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
