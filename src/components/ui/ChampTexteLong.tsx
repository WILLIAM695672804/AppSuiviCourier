import { useId, type TextareaHTMLAttributes } from "react";
import { Etiqueteur } from "@/components/ui/Champ";

/**
 * Zone de saisie multi-lignes.
 *
 * Elle vit à côté de `Champ` plutôt que dedans : un `<textarea>` n'accepte pas
 * les mêmes attributs qu'un `<input>`, et forcer les deux dans un composant
 * unique aurait produit une signature illisible.
 *
 * Le compteur de caractères n'apparaît que si une limite est fixée. Un
 * compteur permanent transforme chaque champ libre en exercice de concision,
 * ce qui n'est pas l'effet recherché sur un motif de relance.
 */
type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  libelle: string;
  erreur?: string;
  aide?: string;
  /** Nombre de caractères déjà saisis, quand `maxLength` est fixé. */
  longueur?: number;
};

export function ChampTexteLong({
  libelle,
  erreur,
  aide,
  longueur,
  maxLength,
  rows = 4,
  className,
  ...reste
}: Props) {
  const id = useId();

  return (
    <Etiqueteur libelle={libelle} pour={id} erreur={erreur} aide={aide} className={className}>
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={erreur ? true : undefined}
          {...reste}
          className={`w-full resize-y rounded-none border bg-surface px-3 py-2.5 text-[12.5px] leading-[1.55] font-medium text-encre outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent disabled:bg-surface-douce disabled:text-encre-tenue ${
            erreur ? "border-danger-trait" : "border-bordure-forte"
          }`}
        />
        {maxLength !== undefined && longueur !== undefined && (
          <span className="absolute right-2.5 bottom-2 text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
            {longueur} / {maxLength}
          </span>
        )}
      </div>
    </Etiqueteur>
  );
}
