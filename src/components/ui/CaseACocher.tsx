/**
 * Marque visuelle seule, sans comportement.
 *
 * Sert quand la ligne entiere porte deja le role de case a cocher : imbriquer
 * un bouton dans un bouton produit un HTML invalide et un double declenchement
 * qui annule la selection.
 */
export function MarqueCase({ cochee, partielle = false }: { cochee: boolean; partielle?: boolean }) {
  const active = cochee || partielle;

  return (
    <span
      aria-hidden="true"
      className={`grid size-4 flex-none place-items-center rounded-none border-[1.5px] transition-colors duration-150 ${
        active ? "border-accent bg-accent" : "border-bordure-champ bg-surface"
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2">
        {partielle ? (
          <path d="M3 6h6" />
        ) : (
          <path d="M2.5 6.2 4.8 8.5 9.5 3.6" style={{ opacity: cochee ? 1 : 0 }} />
        )}
      </svg>
    </span>
  );
}

type Props = {
  cochee: boolean;
  /** Vrai quand une partie seulement de la selection est cochee. */
  partielle?: boolean;
  onChange: (cochee: boolean) => void;
  libelle: string;
};

export function CaseACocher({ cochee, partielle = false, onChange, libelle }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partielle ? "mixed" : cochee}
      aria-label={libelle}
      onClick={() => onChange(!cochee)}
      className="cursor-pointer hover:[&>span]:border-accent"
    >
      <MarqueCase cochee={cochee} partielle={partielle} />
    </button>
  );
}
