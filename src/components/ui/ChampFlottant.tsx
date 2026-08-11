import { useId, useState, type InputHTMLAttributes } from "react";
import { Icone } from "@/components/ui/Icone";

/**
 * Champ a libelle interieur, reserve a l'ecran de connexion.
 *
 * Ce n'est pas une variante de `Champ` : les formulaires de l'application
 * portent leur libelle au-dessus du cadre, ce qui permet de balayer une
 * colonne de vingt champs. Ici il n'y en a que deux, et la maquette demande un
 * cadre plus haut, plus arrondi, avec le libelle a l'interieur.
 *
 * L'erreur se signale deux fois — contour rouge et message ecrit — parce
 * qu'une couleur seule n'est pas lisible par tout le monde.
 */
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  libelle: string;
  erreur?: string;
  /** Ajoute le bouton de revelation de la saisie. */
  motDePasse?: boolean;
};

export function ChampFlottant({ libelle, erreur, motDePasse = false, className, ...reste }: Props) {
  const id = useId();
  const [revele, setRevele] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div
        className={`relative rounded-none border bg-surface px-4 pt-2.5 pb-2 transition-colors duration-150 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-voile ${
          erreur ? "border-danger" : "border-bordure-forte"
        }`}
      >
        <label
          htmlFor={id}
          className="block text-[11px] leading-none font-medium text-encre-tenue"
        >
          {libelle}
        </label>

        <input
          id={id}
          type={motDePasse && !revele ? "password" : "text"}
          aria-invalid={erreur ? true : undefined}
          {...reste}
          className={`mt-1.5 w-full bg-transparent text-[13.5px] leading-none font-semibold text-encre outline-none placeholder:font-medium placeholder:text-encre-tenue ${
            motDePasse ? "pr-8" : ""
          }`}
        />

        {motDePasse && (
          <button
            type="button"
            onClick={() => setRevele((v) => !v)}
            aria-label={revele ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-encre-tenue transition-colors duration-150 hover:text-encre-faible"
          >
            <Icone nom={revele ? "oeilBarre" : "oeil"} taille={15} />
          </button>
        )}
      </div>

      {erreur && (
        <span className="px-1 text-[11px] leading-[1.4] font-semibold text-danger">{erreur}</span>
      )}
    </div>
  );
}
