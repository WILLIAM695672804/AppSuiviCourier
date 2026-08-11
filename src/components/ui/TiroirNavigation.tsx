import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router";
import { Icone } from "@/components/ui/Icone";
import { ContexteTiroir } from "@/lib/contexteTiroir";

/**
 * Barre latérale à demeure sur poste de bureau, tiroir sur téléphone.
 *
 * À 390 px de large, une barre de 238 px prend les deux tiers de l'écran :
 * elle doit disparaître. Le tiroir la restitue à la demande, par-dessus le
 * contenu, et se referme dès qu'on a choisi où aller.
 *
 * Cette fermeture automatique au changement de route est le détail qui compte.
 * Sans elle, on tape une entrée de menu, la page change derrière, et le tiroir
 * reste là à masquer ce qu'on vient d'ouvrir.
 */
export function TiroirNavigation({
  barre,
  children,
  className = "",
}: {
  /** La barre latérale de la charte concernée : espace de travail ou administration. */
  barre: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const emplacement = useLocation();

  /*
   * On a navigué : le tiroir a fait son office.
   *
   * L'ajustement se fait pendant le rendu et non dans un effet. React
   * réexécute alors ce composant avant de peindre : le tiroir n'apparaît
   * jamais ouvert sur la nouvelle page, même une image.
   */
  const [cheminPrecedent, setCheminPrecedent] = useState(emplacement.pathname);
  if (cheminPrecedent !== emplacement.pathname) {
    setCheminPrecedent(emplacement.pathname);
    setOuvert(false);
  }

  const fermer = useCallback(() => setOuvert(false), []);
  const ouvrir = useCallback(() => setOuvert(true), []);
  const etat = useMemo(() => ({ ouvert, ouvrir, fermer }), [ouvert, ouvrir, fermer]);

  useEffect(() => {
    if (!ouvert) return;

    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }

    document.addEventListener("keydown", surTouche);
    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = debordement;
    };
  }, [ouvert]);

  return (
    <ContexteTiroir value={etat}>
      <div className={`flex ${className}`}>
        {/* Poste de bureau : la barre est simplement là. */}
        <div className="hidden md:flex">{barre}</div>

        {children}
      </div>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.target === e.currentTarget && fermer()}
            className="fixed inset-0 z-50 bg-encre/45 md:hidden"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="flex h-full w-fit max-w-[86vw]"
            >
              {barre}

              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer la navigation"
                className="m-2 grid size-11 flex-none place-items-center self-start rounded-none bg-surface/90 text-encre-douce"
              >
                <Icone nom="croix" taille={15} epaisseur={1.7} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ContexteTiroir>
  );
}

/** Bouton d'ouverture, à poser dans l'en-tête d'écran. Absent sur bureau. */
export function BoutonTiroir({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ouvrir la navigation"
      className="-ml-2 grid size-11 flex-none cursor-pointer place-items-center rounded-none text-encre-douce transition-colors duration-150 hover:bg-surface-douce md:hidden"
    >
      <Icone nom="menu" taille={18} epaisseur={1.7} />
    </button>
  );
}
