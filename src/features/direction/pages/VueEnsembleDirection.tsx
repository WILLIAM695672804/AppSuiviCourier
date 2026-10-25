import { useQuery } from "@tanstack/react-query";
import { EnTeteDocument, PiedDocument } from "@/components/EnTeteDocument";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeReperes, type Repere } from "@/components/ui/BandeReperes";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Feu } from "@/components/ui/Feu";
import { GrapheColonnes } from "@/components/ui/GrapheColonnes";
import { GrapheCourbe } from "@/components/ui/GrapheCourbe";
import { GrapheRepartition } from "@/components/ui/GrapheRepartition";
import { PanneauGraphe } from "@/components/ui/PanneauGraphe";
import { vueEnsembleDirectionQuery } from "@/features/direction/api";
import { usePermission } from "@/lib/contexteSession";
import { feuDepuisTaux } from "@/lib/feu";
import { formaterDate, formaterDateHeure, formaterMontant } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Vue d'ensemble de la Direction générale — écran d'accueil du Directeur général.
 *
 * Le cockpit exécutif reste ce qu'il est — une liste d'arbitrages, partagée
 * avec le Comité de direction ; celui-ci répond à une autre question : où en
 * est l'institution, et depuis combien de temps va-t-elle dans ce sens.
 *
 * D'où une composition qui ne se retrouve que sur la vue du Comité : une bande
 * de repères en haut, puis cinq graphiques et aucun tableau. C'est une lecture,
 * pas un poste de saisie — rien n'y demande d'action.
 *
 * **Tout y est cliquable, et c'est ce qui remplace le menu** (ADR 027). Cette
 * session n'a plus de barre latérale : chaque repère, chaque graphique et
 * chaque carte ouvre l'écran qui porte la matière de ce qu'il montre, et le fil
 * de retour ramène ici. Un chiffre dont on ne peut pas voir ce qu'il recouvre
 * n'est pas un chiffre de pilotage, c'est une affiche.
 *
 * Les destinations sont posées ici et non servies par l'API : la mesure est une
 * affaire de serveur, l'écran où elle se détaille est une affaire de front. Un
 * lien absent — parce que la session n'ouvre pas l'écran visé — laisse le bloc
 * non cliquable, il ne le masque pas.
 *
 * Les chiffres ne portent ni feu ni couleur d'alerte, à une exception près :
 * un mois d'exécution en recul. Colorer sept repères sur sept revient à n'en
 * signaler aucun.
 */
export function VueEnsembleDirection() {
  const { data } = useQuery(vueEnsembleDirectionQuery());

  // Les ecrans que la session ouvre. Un lien vers un ecran qu'elle n'ouvre pas
  // renverrait sur le garde de permission, ce qui est une impasse : on ne pose
  // pas le lien.
  const litLesActivites = usePermission(PERMISSIONS.ACT_LEC);
  const litLesDecisions = usePermission(PERMISSIONS.DEC);
  const litLExploitation = usePermission(PERMISSIONS.EXP_LEC);
  const litLesStatistiques = usePermission(PERMISSIONS.STAT);
  const litLeClassement = usePermission(PERMISSIONS.SCORE);
  const litLesDisponibilites = usePermission(PERMISSIONS.DISPO);

  const cartesDeLEtat = [
    data?.chenal,
    data?.recouvrements,
    data?.disponibilite,
  ].filter(Boolean).length;

  const chemin = (autorise: boolean, route: string) =>
    autorise ? route : undefined;

  /*
   * Ou se detaille chaque repere.
   *
   * Le rapprochement se fait par le libelle servi par `pilotage/vue_direction`.
   * Un libelle qui changerait cote serveur ferait tomber le lien, pas l'ecran —
   * et c'est le bon sens de la panne : la mesure reste lisible, seule la porte
   * disparait.
   *
   * « Responsables absents sans interim » n'y figure pas : le detail vit dans
   * les disponibilites, que `DISPO` ouvre et que ce poste ne porte pas.
   */
  const CHEMIN_PAR_REPERE: Record<string, string | undefined> = {
    "Exécution des activités": chemin(litLesActivites, "/activites"),
    "Score moyen des structures": chemin(
      litLeClassement,
      "/performance/classement",
    ),
    "Productions à l'échéance": chemin(
      litLesActivites,
      "/activites/obligations",
    ),
    "Décisions en retard": chemin(
      litLesDecisions,
      `/gouvernance/decisions?etat=${encodeURIComponent("En retard")}`,
    ),
    "Activités critiques": chemin(
      litLesActivites,
      `/activites?etat=${encodeURIComponent("En retard")}`,
    ),
    "Traitement du courrier": chemin(litLesStatistiques, "/statistiques"),
  };

  // Sept cases vides tant que rien n'est arrive : la bande garde sa hauteur,
  // et la page ne saute pas au moment ou les chiffres tombent.
  const reperes: (Repere | null)[] = (
    data?.reperes ?? Array.from({ length: 7 }, () => null)
  ).map((repere) =>
    repere
      ? { ...repere, chemin: CHEMIN_PAR_REPERE[repere.libelle] ?? null }
      : null,
  );

  return (
    <>
      <EnTetePage
        titre="Vue d'ensemble"
        sousTitre={
          data ? `${data.institution} — exercice ${data.exercice}` : undefined
        }
        mention={
          data
            ? `Actualisé le ${formaterDateHeure(data.actualiseLe)}`
            : undefined
        }
        actions={
          <Bouton
            variante="principal"
            icone="exporter"
            onClick={() => window.print()}
          >
            Exporter en PDF
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[22px]">
        {/* L'en-tete institutionnel n'apparait qu'a l'impression : a l'ecran,
            la barre de titre dit deja ou l'on est. */}
        <EnTeteDocument impressionSeule />

        <div className="flex flex-col gap-3.5">
          <BandeReperes reperes={reperes} />

          <div className="grid gap-3.5 xl:grid-cols-3">
            <PanneauGraphe
              titre="Écart d'exécution des activités, par mois"
              lien={chemin(litLesActivites, "/activites")}
              libelleLien="Voir les activités"
            >
              {data && (
                <GrapheColonnes
                  points={data.ecartExecution.map((ligne) => ({
                    libelle: ligne.mois,
                    valeur: ligne.valeur,
                  }))}
                  format={(valeur) => `${valeur.toLocaleString("fr-FR")} pt`}
                  libelleAxe={`Exercice ${data.exercice}`}
                />
              )}
            </PanneauGraphe>

            <PanneauGraphe
              titre="Cinq structures les plus avancées"
              lien={chemin(litLesActivites, "/activites")}
              libelleLien="Voir les activités"
            >
              {data && (
                <GrapheRepartition
                  parts={data.executionParStructure}
                  libelleTotal="points d'exécution"
                />
              )}
            </PanneauGraphe>

            {/* Les structures sans retard n'y figurent pas : un histogramme de
                retards ne se lit que par ce qu'il montre. */}
            <PanneauGraphe
              titre="Cinq structures les plus en retard"
              lien={chemin(
                litLesActivites,
                `/activites?etat=${encodeURIComponent("En retard")}`,
              )}
              libelleLien="Voir les activités en retard"
            >
              {data && (
                <GrapheRepartition
                  parts={data.retardsParStructure}
                  libelleTotal="productions en retard"
                />
              )}
            </PanneauGraphe>
          </div>

          {/*
            L'état du port, demandé le 11 août 2026.

            Des cartes plutôt que des repères de plus dans la bande : ces
            chiffres ne sont pas de même nature que les autres. Un délai moyen
            se compare d'un mois sur l'autre ; une cote sous garantie est une
            contrainte d'exploitation immédiate, qui appelle une décision le
            jour même. Les noyer parmi sept pourcentages les aurait éteints.

            La disponibilité des agents les a rejoints le 31 août 2026, et pour
            la même raison : les activités en retard et les décisions non
            exécutées ont souvent une cause unique, qui tient en une ligne —
            le responsable n'était pas là, et personne ne le remplaçait.
          */}
          {(data?.chenal || data?.recouvrements || data?.disponibilite) && (
            /* Deux ou trois colonnes selon ce que la session ouvre : une carte
               seule sur une grille de trois laisse deux tiers de vide, et ce
               vide se lit comme une donnee manquante. */
            <div
              className={`grid gap-3.5 ${
                cartesDeLEtat > 2
                  ? "md:grid-cols-2 xl:grid-cols-3"
                  : cartesDeLEtat > 1
                    ? "xl:grid-cols-2"
                    : ""
              }`}
            >
              {data.chenal && (
                <Carte
                  titre="Cote du chenal"
                  lien={chemin(litLExploitation, "/exploitation")}
                  aDroite={
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      DDLM · relevé le {formaterDate(data.chenal.releveLe)}
                    </span>
                  }
                >
                  <div className="mt-3 flex flex-col gap-2.5">
                    <span className="text-[11px] leading-none font-semibold text-encre-faible">
                      {data.chenal.point}
                    </span>
                    <span className="text-[28px] leading-none font-extrabold tracking-[-1px] text-encre tabular-nums">
                      {data.chenal.cote.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      m
                    </span>
                    <Feu
                      niveau={data.chenal.feu}
                      libelle={`${data.chenal.ecart > 0 ? "+" : ""}${data.chenal.ecart.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m par rapport à la garantie de ${data.chenal.garantie.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m`}
                    />
                    {data.chenal.ecart < 0 && (
                      <Encart ton="danger" icone="aide">
                        Le point le plus contraint du chenal est sous sa
                        garantie : l'accès au port est limité tant qu'une
                        campagne de dragage n'est pas conduite.
                      </Encart>
                    )}
                  </div>
                </Carte>
              )}

              {data.recouvrements && (
                <Carte
                  titre="Recouvrements"
                  lien={chemin(litLExploitation, "/exploitation")}
                  aDroite={
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      DEX et DFC · {data.recouvrements.periode}
                    </span>
                  }
                >
                  <div className="mt-3 flex flex-col gap-2.5">
                    <span className="text-[28px] leading-none font-extrabold tracking-[-1px] text-encre tabular-nums">
                      {formaterMontant(data.recouvrements.totalRecouvre)}
                    </span>
                    <Feu
                      niveau={feuDepuisTaux(data.recouvrements.tauxGlobal)}
                      libelle={`${data.recouvrements.tauxGlobal.toLocaleString("fr-FR")} % de l'émis recouvré`}
                    />
                    <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                      <span className="flex flex-col gap-1.5">
                        <span className="text-[10.5px] leading-none font-semibold text-encre-faible">
                          Secteurs portuaires
                        </span>
                        <span className="text-[13px] leading-none font-bold text-encre tabular-nums">
                          {formaterMontant(
                            data.recouvrements.totalExploitation,
                          )}
                        </span>
                      </span>
                      <span className="flex flex-col gap-1.5">
                        <span className="text-[10.5px] leading-none font-semibold text-encre-faible">
                          Autres recettes
                        </span>
                        <span className="text-[13px] leading-none font-bold text-encre tabular-nums">
                          {formaterMontant(
                            data.recouvrements.totalAutresRecettes,
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                </Carte>
              )}

              {data.disponibilite && (
                <Carte
                  titre="Disponibilité des agents"
                  lien={chemin(
                    litLesDisponibilites,
                    "/gouvernance/disponibilites",
                  )}
                  aDroite={
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      Au {formaterDate(data.disponibilite.aLaDate)}
                    </span>
                  }
                >
                  <div className="mt-3 flex flex-col gap-2.5">
                    <span className="text-[11px] leading-none font-semibold text-encre-faible">
                      Sur {data.disponibilite.effectif.toLocaleString("fr-FR")}{" "}
                      agents du périmètre
                    </span>
                    <span className="text-[28px] leading-none font-extrabold tracking-[-1px] text-encre tabular-nums">
                      {data.disponibilite.presents.toLocaleString("fr-FR")}{" "}
                      présents
                    </span>
                    {/* Le feu juge la suppleance et non l'absence : une mission
                        de trois semaines avec interimaire designe n'arrete
                        rien ; deux jours sans interimaire arretent une
                        direction. */}
                    <Feu
                      niveau={
                        data.disponibilite.sansInterim > 0
                          ? "rouge"
                          : feuDepuisTaux(data.disponibilite.tauxPresence)
                      }
                      libelle={
                        data.disponibilite.sansInterim > 0
                          ? `${data.disponibilite.sansInterim} absence${data.disponibilite.sansInterim > 1 ? "s" : ""} sans intérimaire`
                          : `${data.disponibilite.tauxPresence.toLocaleString("fr-FR")} % de présence, toutes les absences sont suppléées`
                      }
                    />
                    {/* Les motifs, et non le seul total d'absents : trois
                        agents en formation ne se remplacent pas comme trois
                        agents en conge. `parts` commence par « Présents ». */}
                    {data.disponibilite.parts.length > 1 && (
                      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                        {data.disponibilite.parts.slice(1).map((part) => (
                          <span
                            key={part.libelle}
                            className="flex flex-col gap-1.5"
                          >
                            <span className="text-[10.5px] leading-none font-semibold text-encre-faible">
                              {part.libelle}
                            </span>
                            <span className="text-[13px] leading-none font-bold text-encre tabular-nums">
                              {part.valeur.toLocaleString("fr-FR")}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Carte>
              )}
            </div>
          )}

          {data?.recouvrements && (
            <div className="grid gap-3.5">
              <PanneauGraphe
                titre="Taux de recouvrement par secteur d'activité"
                lien={chemin(litLExploitation, "/exploitation")}
                libelleLien="Voir les relevés"
              >
                <GrapheColonnes
                  points={data.recouvrements.parSecteur}
                  format={(valeur) => `${valeur.toLocaleString("fr-FR")} %`}
                  libelleAxe={data.recouvrements.periode}
                />
              </PanneauGraphe>
            </div>
          )}

          <div className="grid gap-3.5 xl:grid-cols-2">
            <PanneauGraphe
              titre="Respect des délais de traitement, par mois"
              lien={chemin(litLesStatistiques, "/statistiques")}
              libelleLien="Voir les statistiques"
            >
              {data && (
                <GrapheCourbe
                  points={data.respectDelais.map((ligne) => ({
                    libelle: ligne.mois,
                    valeur: ligne.valeur,
                  }))}
                  format={(valeur) => `${valeur.toLocaleString("fr-FR")} %`}
                  libelleAxe={`Exercice ${data.exercice}`}
                />
              )}
            </PanneauGraphe>

            <PanneauGraphe
              titre="Décisions d'instance exécutées, par mois"
              lien={chemin(
                litLesDecisions,
                `/gouvernance/decisions?etat=${encodeURIComponent("Exécutée")}`,
              )}
              libelleLien="Voir les décisions"
            >
              {data && (
                <GrapheColonnes
                  points={data.decisionsExecutees.map((ligne) => ({
                    libelle: ligne.mois,
                    valeur: ligne.valeur,
                  }))}
                  libelleAxe={`Exercice ${data.exercice}`}
                />
              )}
            </PanneauGraphe>
          </div>
        </div>

        <PiedDocument impressionSeule />
      </div>
    </>
  );
}
