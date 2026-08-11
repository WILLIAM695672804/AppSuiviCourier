import { Icone } from "@/components/ui/Icone";

type Props = {
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  className?: string;
  /**
   * Prend le focus au montage. Réservé aux champs qui sont la raison d'être de
   * ce qui vient de s'ouvrir — le glossaire, par exemple. Sur un écran de
   * liste, voler le focus déplace la page sous le lecteur.
   */
  autoFocus?: boolean;
};

export function ChampRecherche({
  valeur,
  onChange,
  placeholder = "Rechercher…",
  className = "",
  autoFocus = false,
}: Props) {
  return (
    <div
      className={`flex items-center gap-2 rounded-none border border-bordure bg-surface-douce px-2.5 py-2 focus-within:border-accent-trait focus-within:bg-surface ${className}`}
    >
      <Icone nom="recherche" taille={14} epaisseur={1.6} className="text-encre-tenue" />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] leading-none font-medium text-encre outline-none placeholder:text-encre-tenue"
      />
    </div>
  );
}
