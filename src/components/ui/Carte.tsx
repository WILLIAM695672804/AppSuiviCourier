import type { ReactNode } from "react";
import { Link } from "react-router";

/**
 * Bloc blanc pose sur le fond gris. C'est l'unite de composition des ecrans
 * de saisie et de consultation : un titre, un contenu, rien d'autre.
 *
 * `lien` rend la carte entiere cliquable, vers l'ecran qui porte le detail de
 * ce qu'elle montre (ADR 027). A n'employer que sur une carte de lecture : une
 * carte qui contient deja un lien ou un bouton ne doit pas en devenir un, sans
 * quoi le clic depend de l'endroit ou il tombe.
 */
export function Carte({
  titre,
  aDroite,
  lien,
  children,
  className = "",
}: {
  titre?: string;
  /** Contenu aligne a droite du titre : un compteur, un lien, une action. */
  aDroite?: ReactNode;
  /** Rend la carte entiere cliquable. Reserve aux cartes de lecture. */
  lien?: string;
  children: ReactNode;
  className?: string;
}) {
  const habillage = `rounded-none border border-[color:var(--color-bordure-carte)] bg-surface px-5 pt-[18px] pb-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`;

  const contenu = (
    <>
      {(titre || aDroite) && (
        <div className="flex items-center justify-between gap-3">
          {titre && <h2 className="text-[13.5px] leading-none font-bold text-encre">{titre}</h2>}
          {aDroite}
        </div>
      )}
      {children}
    </>
  );

  if (lien) {
    return (
      <Link
        to={lien}
        className={`block ${habillage} transition-colors duration-150 hover:border-accent hover:bg-surface-douce`}
      >
        {contenu}
      </Link>
    );
  }

  return <section className={habillage}>{contenu}</section>;
}
