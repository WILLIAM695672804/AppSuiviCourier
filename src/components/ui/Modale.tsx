import { useEffect, useRef, type ReactNode } from "react";
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

  useEffect(() => {
    if (!ouverte) return;

    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") onFermer();
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
  }, [ouverte, onFermer]);

  return (
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
    </AnimatePresence>
  );
}
