import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Icone } from "@/components/ui/Icone";

/**
 * Champs de saisie.
 *
 * Un libelle au-dessus, jamais a gauche : les formulaires de l'application
 * sont denses et le lecteur doit pouvoir balayer une colonne. L'erreur se
 * pose sous le champ, en rouge, et le champ prend un contour rouge — deux
 * signaux, parce qu'un seul ne suffit pas a qui distingue mal les couleurs.
 */

const CONTOUR =
  "w-full rounded-none border bg-surface px-3 py-2.5 text-[12.5px] leading-none font-semibold text-encre outline-none transition-colors duration-150 placeholder:font-medium placeholder:text-encre-tenue focus:border-accent disabled:bg-surface-douce disabled:text-encre-tenue";

export function Etiqueteur({
  libelle,
  pour,
  erreur,
  aide,
  children,
  className = "",
}: {
  libelle: string;
  pour?: string;
  erreur?: string;
  aide?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-[7px] ${className}`}>
      <label htmlFor={pour} className="text-[11px] leading-none font-semibold text-encre-faible">
        {libelle}
      </label>
      {children}
      {erreur ? (
        <span className="text-[10.5px] leading-[1.4] font-semibold text-danger">{erreur}</span>
      ) : (
        aide && (
          <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">{aide}</span>
        )
      )}
    </div>
  );
}

type ChampProps = InputHTMLAttributes<HTMLInputElement> & {
  libelle: string;
  erreur?: string;
  aide?: string;
};

export function Champ({ libelle, erreur, aide, className, ...reste }: ChampProps) {
  const id = useId();
  return (
    <Etiqueteur libelle={libelle} pour={id} erreur={erreur} aide={aide} className={className}>
      <input
        id={id}
        aria-invalid={erreur ? true : undefined}
        {...reste}
        className={`${CONTOUR} ${erreur ? "border-danger-trait" : "border-bordure-forte"}`}
      />
    </Etiqueteur>
  );
}

type ListeProps = SelectHTMLAttributes<HTMLSelectElement> & {
  libelle: string;
  erreur?: string;
  aide?: string;
  options: { valeur: string; libelle: string }[];
  /** Ligne vide affichee tant que rien n'est choisi. */
  invite?: string;
};

export function Liste({ libelle, erreur, aide, options, invite, className, ...reste }: ListeProps) {
  const id = useId();
  return (
    <Etiqueteur libelle={libelle} pour={id} erreur={erreur} aide={aide} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={erreur ? true : undefined}
          {...reste}
          className={`${CONTOUR} appearance-none pr-9 ${erreur ? "border-danger-trait" : "border-bordure-forte"}`}
        >
          {invite && <option value="">{invite}</option>}
          {options.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>
        <Icone
          nom="chevronBas"
          taille={11}
          epaisseur={1.6}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-encre-faible"
        />
      </div>
    </Etiqueteur>
  );
}

/** Valeur calculee par le serveur, montree mais non modifiable. */
export function ChampLecture({ libelle, valeur }: { libelle: string; valeur: ReactNode }) {
  return (
    <Etiqueteur libelle={libelle}>
      <div className="rounded-none border border-bordure bg-surface-douce px-3 py-2.5 text-[12.5px] leading-none font-semibold text-encre-tenue tabular-nums">
        {valeur}
      </div>
    </Etiqueteur>
  );
}
