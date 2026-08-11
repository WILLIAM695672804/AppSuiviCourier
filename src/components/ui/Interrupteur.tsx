type Props = {
  actif: boolean;
  onChange: (actif: boolean) => void;
  libelle: string;
};

/**
 * Bascule d'option.
 *
 * Reserve aux choix qui changent l'ecran immediatement (ouvrir un bloc,
 * activer une suite). Pour une donnee enregistree, on utilise une case a
 * cocher : l'agent doit voir qu'il remplit un formulaire, pas qu'il regle
 * un appareil.
 */
export function Interrupteur({ actif, onChange, libelle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={() => onChange(!actif)}
      className="flex cursor-pointer items-center gap-2.5"
    >
      <span
        className={`flex h-5 w-9 rounded-none p-0.5 transition-colors duration-150 ${
          actif ? "justify-end bg-accent" : "justify-start bg-bordure-champ"
        }`}
      >
        <span className="size-4 rounded-none bg-white shadow-[0_1px_2px_rgba(16,24,40,.2)]" />
      </span>
      <span className="text-xs leading-none font-semibold text-encre-douce">{libelle}</span>
    </button>
  );
}
