import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { formaterDate } from "@/lib/format";
import type { DelaiCourrier } from "@/types/courrier";

/**
 * Delai de traitement du courrier, vu depuis la fiche.
 *
 * La barre porte un segment par jour alloue : l'agent compte les jours qui
 * lui restent, il ne lit pas un pourcentage. Au-dela de l'echeance, toute la
 * barre passe au rouge et le compteur bascule en jours de retard.
 */
export function BlocDelai({
  delai,
  echeance,
  peutProlonger,
  onProlonger,
}: {
  delai: DelaiCourrier | null;
  echeance: string | null;
  peutProlonger: boolean;
  onProlonger?: () => void;
}) {
  if (!delai) {
    return (
      <Carte titre="Délai de traitement">
        <p className="mt-3 text-[11.5px] font-medium text-encre-tenue">
          Aucun délai n'a été fixé pour ce courrier.
        </p>
      </Carte>
    );
  }

  const { joursEcoules, joursAlloues, joursDepassement } = delai;
  const depasse = joursDepassement > 0;
  const restants = Math.max(0, joursAlloues - joursEcoules);

  return (
    <Carte
      titre="Délai de traitement"
      aDroite={
        <span
          className={`rounded-none px-[7px] py-1 text-[11px] leading-none font-bold ${
            depasse
              ? "bg-danger-voile text-danger"
              : restants <= 1
                ? "bg-[#fef4e6] text-alerte"
                : "bg-[#e7f8f0] text-succes"
          }`}
        >
          {depasse ? `+ ${joursDepassement} j` : `${restants} j restants`}
        </span>
      }
    >
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: joursAlloues }, (_, i) => {
            const consomme = i < Math.min(joursEcoules, joursAlloues);
            const teinte = depasse
              ? "bg-danger-vif"
              : !consomme
                ? "bg-inerte"
                : i < joursAlloues / 2
                  ? "bg-succes-vif"
                  : "bg-alerte-vif";
            return <div key={i} className={`h-2 flex-1 rounded-none ${teinte}`} />;
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] leading-none font-medium text-encre-tenue">
            {joursEcoules} jour{joursEcoules > 1 ? "s" : ""} consommé
            {joursEcoules > 1 ? "s" : ""} sur {joursAlloues}
          </span>
          <span className="text-[11px] leading-none font-semibold text-encre-moyenne">
            Limite {formaterDate(echeance)}
          </span>
        </div>

        {peutProlonger && (
          <Bouton onClick={onProlonger} className="w-full justify-center py-2.5">
            Prolonger le délai
          </Bouton>
        )}
      </div>
    </Carte>
  );
}
