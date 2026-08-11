import { AnimatePresence, motion } from "motion/react";
import { Bouton } from "@/components/ui/Bouton";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

type Props = {
  nombre: number;
  onAnnuler: () => void;
  onCoter?: () => void;
  onAffecter?: () => void;
  onBordereau?: () => void;
};

/**
 * Actions de masse, posees au-dessus du tableau.
 *
 * Un des rares endroits ou Motion est justifie : la barre entre et sort,
 * et l'agent doit voir qu'elle repond a sa selection. Les lignes du tableau,
 * elles, ne sont jamais animees.
 */
export function BarreSelection({ nombre, onAnnuler, onCoter, onAffecter, onBordereau }: Props) {
  const peutCoter = usePermission(PERMISSIONS.COT, PERMISSIONS.COT_DEL);
  const peutAffecter = usePermission(PERMISSIONS.AFF);
  const peutTransmettre = usePermission(PERMISSIONS.TRANS);

  return (
    <AnimatePresence>
      {nombre > 0 && (
        <div className="pointer-events-none sticky bottom-[18px] left-0 z-3 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-1 rounded-none bg-encre p-2 px-2.5 shadow-[0_12px_28px_rgba(16,24,40,.28)]"
          >
            <span className="px-2.5 pr-2.5 pl-1.5 text-xs leading-none font-bold text-white">
              Sélection : {nombre}
            </span>
            <div className="h-5 w-px bg-white/15" />

            {peutCoter && (
              <Bouton variante="fantome" icone="document" onClick={onCoter}>
                Coter
              </Bouton>
            )}
            {peutAffecter && (
              <Bouton variante="fantome" icone="personneAjout" onClick={onAffecter}>
                Affecter
              </Bouton>
            )}
            {peutTransmettre && (
              <Bouton variante="fantome" icone="imprimante" onClick={onBordereau}>
                Bordereau
              </Bouton>
            )}

            <button
              type="button"
              onClick={onAnnuler}
              className="ml-1 rounded-none border border-white/30 px-3 py-[7px] text-xs leading-none font-bold text-[#fda29b] transition-colors duration-150 hover:bg-white/10"
            >
              Annuler
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
