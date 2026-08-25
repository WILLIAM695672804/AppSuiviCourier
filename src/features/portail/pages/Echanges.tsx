import { useQuery } from "@tanstack/react-query";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { SqueletteCarte } from "@/components/ui/Squelette";
import { echangesQuery, type Echange } from "@/features/portail/api";
import { formaterDate } from "@/lib/format";

/**
 * Échanges dématérialisés — §3.13, troisième point.
 *
 * « Échanger de façon dématérialisée avec l'institution dans le cadre de
 * marchés publics, conventions ou reportings réglementaires, selon leur
 * statut. »
 *
 * Trois natures pour un seul mécanisme : un dossier ouvert, des pièces
 * attendues, une échéance. Les séparer aurait donné trois écrans identiques.
 *
 * La barre de complétude est ici plus qu'un ornement : dans un marché public,
 * un dossier incomplet à l'heure de la clôture est un dossier écarté, sans
 * recours. C'est pourquoi l'échéance passe au rouge dès qu'il manque une pièce
 * et qu'elle approche.
 */
const TONS_ETAT: Record<Echange["etat"], TonEtiquette> = {
  Ouvert: "accent",
  "En attente de votre dépôt": "danger",
  Clos: "neutre",
};

const TONS_NATURE: Record<Echange["nature"], TonEtiquette> = {
  "Marché public": "confidentiel",
  Convention: "accent",
  "Reporting réglementaire": "alerte",
};

export function Echanges() {
  const { data, isPending } = useQuery(echangesQuery());
  const echanges = data?.echanges ?? [];
  const aDeposer = echanges.filter(
    (e) => e.deposes < e.attendus && e.etat !== "Clos",
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-.5px] text-encre">
          Échanges
        </h1>
        <p className="text-[13px] leading-[1.55] font-medium text-encre-faible">
          Marchés publics, conventions et reportings réglementaires qui vous
          concernent.
        </p>
      </div>

      {aDeposer.length > 0 && (
        <Encart ton="danger" icone="cloche">
          {aDeposer.length === 1
            ? "Un dossier attend des pièces de votre part."
            : `${aDeposer.length} dossiers attendent des pièces de votre part.`}{" "}
          Dans un marché public, un dossier incomplet à la clôture est écarté
          sans recours.
        </Encart>
      )}

      {isPending ? (
        <div className="flex flex-col gap-3.5">
          <SqueletteCarte lignes={3} />
          <SqueletteCarte lignes={3} />
        </div>
      ) : echanges.length === 0 ? (
        <Carte>
          <p className="py-8 text-center text-[13px] font-medium text-encre-tenue">
            Aucun échange en cours.
          </p>
        </Carte>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {echanges.map((echange) => {
            const complet = echange.deposes >= echange.attendus;
            const urgent = !complet && echange.etat !== "Clos";

            return (
              <li key={echange.id}>
                <Carte>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-2">
                        <span className="flex flex-wrap items-center gap-2.5">
                          <Etiquette ton={TONS_NATURE[echange.nature]}>
                            {echange.nature}
                          </Etiquette>
                          <span className="text-[11.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                            {echange.reference}
                          </span>
                        </span>
                        <span className="text-[15px] leading-snug font-bold text-encre">
                          {echange.intitule}
                        </span>
                        <span className="text-[12px] leading-[1.5] font-medium text-encre-faible">
                          Ouvert le {formaterDate(echange.ouvertLe)}
                          {echange.echeance && (
                            <>
                              {" · "}
                              <span
                                className={
                                  urgent ? "font-bold text-danger" : undefined
                                }
                              >
                                clôture le {formaterDate(echange.echeance)}
                              </span>
                            </>
                          )}
                        </span>
                      </div>

                      <Etiquette ton={TONS_ETAT[echange.etat]}>
                        {echange.etat}
                      </Etiquette>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-separateur pt-3.5 md:flex-row md:items-center md:gap-5">
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <BarreProgression
                          taux={(echange.deposes / echange.attendus) * 100}
                          niveau={complet ? "vert" : "rouge"}
                          chiffre={false}
                        />
                        <span className="text-[11.5px] leading-none font-medium text-encre-tenue tabular-nums">
                          {echange.deposes} pièce
                          {echange.deposes > 1 ? "s" : ""} déposée
                          {echange.deposes > 1 ? "s" : ""} sur{" "}
                          {echange.attendus} attendue
                          {echange.attendus > 1 ? "s" : ""}
                        </span>
                      </span>

                      {echange.etat !== "Clos" && (
                        <Bouton
                          variante={complet ? "secondaire" : "principal"}
                          icone={complet ? "document" : "plus"}
                        >
                          {complet ? "Voir mes dépôts" : "Déposer une pièce"}
                        </Bouton>
                      )}
                    </div>
                  </div>
                </Carte>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
