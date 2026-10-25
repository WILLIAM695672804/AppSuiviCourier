import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Icone } from "@/components/ui/Icone";

/**
 * Fenetre modale.
 *
 * Reservee aux decisions courtes qui portent sur un objet deja affiche —
 * coter, affecter, prolonger. Tout ce qui demande plus de trois champs
 * merite un ecran, pas une fenetre : l'agent doit pouvoir revenir en arriere
 * et retrouver son travail.
 */
export function Modale({
  ouverte,
  onFermer,
  titre,
  sousTitre,
  piedGauche,
  actions,
  largeur = 620,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: string;
  /** Texte d'information a gauche du pied : resume de ce qui va se passer. */
  piedGauche?: ReactNode;
  actions?: ReactNode;
  largeur?: number;
  children: ReactNode;
}) {
  const boite = useRef<HTMLDivElement>(null);

  /**
   * `onFermer` tenu dans une reference, et **hors** des dependances de l'effet.
   *
   * Les appelants passent une closure ecrite dans leur JSX : elle est donc
   * nouvelle a chaque rendu. En dependance, elle rejouait l'effet a chaque
   * frappe — et l'effet pose le focus sur la boite. L'agent tapait une lettre,
   * perdait le champ, devait recliquer, tapait la suivante.
   *
   * L'effet ne doit dependre que de l'ouverture : le focus se pose **une fois**,
   * a l'ouverture, ce qui est tout ce qu'on lui demande.
   */
  const fermer = useRef(onFermer);
  useEffect(() => {
    fermer.current = onFermer;
  }, [onFermer]);

  useEffect(() => {
    if (!ouverte) return;

    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") fermer.current();
    }

    document.addEventListener("keydown", surTouche);
    // Le fond ne doit pas defiler sous la fenetre.
    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    boite.current?.focus();

    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = debordement;
    };
  }, [ouverte]);

  /**
   * Rendue dans `document.body`, hors de l'arbre de l'ecran appelant.
   *
   * **Pourquoi c'est necessaire et pas cosmetique.** Une modale porte son propre
   * `<form>`. Ouverte depuis un ecran de saisie — l'enregistrement d'un courrier
   * est un `<form>` unique qui couvre tout l'ecran — elle produisait deux
   * formulaires imbriques, ce que le HTML interdit : le bouton d'envoi de la
   * modale ne trouvait pas fiablement le formulaire qu'il vise, et la creation
   * ne partait pas. Aucune erreur, aucune trace : un bouton qui ne fait rien.
   *
   * Le portail sort le contenu de l'arbre DOM du formulaire appelant. L'arbre
   * React, lui, ne change pas : le contexte, les evenements React et les etats
   * continuent de remonter a l'appelant.
   */
  return createPortal(
    <AnimatePresence>
      {ouverte && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.target === e.currentTarget && onFermer()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-encre/45 p-7"
        >
          <motion.div
            ref={boite}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={titre}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ maxWidth: largeur }}
            className="flex max-h-full w-full flex-col overflow-hidden rounded-none bg-surface shadow-[0_24px_48px_rgba(16,24,40,.28)] outline-none"
          >
            <header className="flex flex-none items-start gap-3.5 border-b border-bordure px-[22px] pt-5 pb-4">
              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <h2 className="text-base leading-tight font-extrabold tracking-[-.3px] text-encre">
                  {titre}
                </h2>
                {sousTitre && (
                  <p className="text-[11.5px] leading-[1.4] font-medium text-encre-faible">
                    {sousTitre}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onFermer}
                aria-label="Fermer"
                className="grid size-[30px] flex-none place-items-center rounded-none border border-bordure-forte text-encre-faible transition-colors duration-150 hover:bg-surface-douce"
              >
                <Icone nom="croix" taille={13} epaisseur={1.7} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-[22px] pt-[18px] pb-5">{children}</div>

            {actions && (
              <footer className="flex flex-none items-center gap-[9px] border-t border-bordure bg-surface-tete px-[22px] py-[15px]">
                <span className="flex-1 text-[11px] leading-[1.4] font-medium text-encre-tenue">
                  {piedGauche}
                </span>
                {actions}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
