import { AnimatePresence, motion } from "motion/react";
import { Bouton } from "@/components/ui/Bouton";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

type Props = {
  nombre: number;
  onAnnuler: () => void;
  onCoter?: () => void;
};

/**
 * Actions de masse, posees au-dessus du tableau.
 *
 * Un des rares endroits ou Motion est justifie : la barre entre et sort,
 * et l'agent doit voir qu'elle repond a sa selection. Les lignes du tableau,
 * elles, ne sont jamais animees.
 */
export function BarreSelection({ nombre, onAnnuler, onCoter }: Props) {
  const peutCoter = usePermission(PERMISSIONS.COT, PERMISSIONS.COT_DEL);

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
            {/*
              « Affecter » et « Bordereau » ont ete retires le 19 aout 2026.
              Les deux etaient montes sans gestionnaire : ils s'affichaient
              selon la permission et ne faisaient rien.

              Ce n'est pas un oubli de branchement, et c'est pour cela qu'ils ne
              reviennent pas tout de suite :

               - **Affecter en lot** suppose de connaitre, pour chaque courrier,
                 les structures cotees — l'affectation pend a la cotation
                 (`services.affecter`). Le registre ne porte que le *libelle* des
                 structures cotees, pas leur identifiant : la fenetre ne pourrait
                 proposer que l'annuaire entier, donc des agents que le serveur
                 refusera un par un.
               - **Bordereau** est un geste du pilier depart, qui n'existe pas.
            */}

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
