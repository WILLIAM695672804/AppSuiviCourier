import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeReperes } from "@/components/ui/BandeReperes";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Feu } from "@/components/ui/Feu";
import { GrapheColonnes } from "@/components/ui/GrapheColonnes";
import { GrapheCourbe } from "@/components/ui/GrapheCourbe";
import { GrapheRepartition } from "@/components/ui/GrapheRepartition";
import { PanneauGraphe } from "@/components/ui/PanneauGraphe";
import { vueEnsembleDirectionQuery, type RepereDirection } from "@/features/direction/api";
import { feuDepuisTaux } from "@/lib/feu";
import { formaterDate, formaterDateHeure, formaterMontant } from "@/lib/format";

/**
 * Vue d'ensemble de la Direction générale — écran d'accueil du Directeur général.
 *
 * Le cockpit exécutif reste ce qu'il est — une liste d'arbitrages, partagée
 * avec le Comité de direction ; celui-ci répond à une autre question : où en
 * est l'institution, et depuis combien de temps va-t-elle dans ce sens.
 *
 * D'où une composition qui ne se retrouve que sur la vue du Comité : une bande
 * de repères en haut, puis cinq graphiques et aucun tableau. Rien n'y est
 * cliquable, rien n'y demande d'action. C'est une lecture, pas un poste de
 * travail — le Directeur général agit depuis le cockpit, il se situe depuis
 * ici.
 *
 * Les chiffres ne portent ni feu ni couleur d'alerte, à une exception près :
 * un mois d'exécution en recul. Colorer sept repères sur sept revient à n'en
 * signaler aucun.
 */
export function VueEnsembleDirection() {
  const { data } = useQuery(vueEnsembleDirectionQuery());

  // Sept cases vides tant que rien n'est arrive : la bande garde sa hauteur,
  // et la page ne saute pas au moment ou les chiffres tombent.
  const reperes: (RepereDirection | null)[] = data?.reperes ?? Array.from({ length: 7 }, () => null);

  return (
    <>
      <EnTetePage
        titre="Vue d'ensemble"
        sousTitre={data ? `${data.institution} — exercice ${data.exercice}` : undefined}
        mention={data ? `Actualisé le ${formaterDateHeure(data.actualiseLe)}` : undefined}
        actions={
          <Bouton variante="principal" icone="exporter" onClick={() => window.print()}>
            Exporter en PDF
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[22px]">
        <div className="flex flex-col gap-3.5">
          <BandeReperes reperes={reperes} />

          <div className="grid gap-3.5 xl:grid-cols-3">
            <PanneauGraphe titre="Écart d'exécution des activités, par mois">
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

            <PanneauGraphe titre="Cinq structures les plus chargées">
              {data && (
                <GrapheRepartition
                  parts={data.chargeParStructure}
                  libelleTotal="courriers en cours"
                />
              )}
            </PanneauGraphe>

            <PanneauGraphe titre="Cinq correspondants les plus émetteurs">
              {data && (
                <GrapheRepartition
                  parts={data.volumeParCorrespondant}
                  libelleTotal="courriers reçus"
                />
              )}
            </PanneauGraphe>
          </div>

          {/*
            L'état du port, demandé le 11 août 2026.

            Deux cartes plutôt que deux repères de plus dans la bande : ces
            chiffres ne sont pas de même nature que les autres. Un délai moyen
            se compare d'un mois sur l'autre ; une cote sous garantie est une
            contrainte d'exploitation immédiate, qui appelle une décision le
            jour même. Les noyer parmi sept pourcentages les aurait éteints.
          */}
          {(data?.chenal || data?.recouvrements) && (
            <div className="grid gap-3.5 xl:grid-cols-2">
              {data.chenal && (
                <Carte
                  titre="Cote du chenal"
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
                      {data.chenal.cote.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m
                    </span>
                    <Feu
                      niveau={data.chenal.feu}
                      libelle={`${data.chenal.ecart > 0 ? "+" : ""}${data.chenal.ecart.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m par rapport à la garantie de ${data.chenal.garantie.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m`}
                    />
                    {data.chenal.ecart < 0 && (
                      <Encart ton="danger" icone="aide">
                        Le point le plus contraint du chenal est sous sa garantie : l'accès au port
                        est limité tant qu'une campagne de dragage n'est pas conduite.
                      </Encart>
                    )}
                  </div>
                </Carte>
              )}

              {data.recouvrements && (
                <Carte
                  titre="Recouvrements"
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
                          {formaterMontant(data.recouvrements.totalExploitation)}
                        </span>
                      </span>
                      <span className="flex flex-col gap-1.5">
                        <span className="text-[10.5px] leading-none font-semibold text-encre-faible">
                          Autres recettes
                        </span>
                        <span className="text-[13px] leading-none font-bold text-encre tabular-nums">
                          {formaterMontant(data.recouvrements.totalAutresRecettes)}
                        </span>
                      </span>
                    </div>
                  </div>
                </Carte>
              )}
            </div>
          )}

          {data?.recouvrements && (
            <div className="grid gap-3.5 xl:grid-cols-2">
              <PanneauGraphe titre="Taux de recouvrement par secteur d'activité">
                <GrapheColonnes
                  points={data.recouvrements.parSecteur}
                  format={(valeur) => `${valeur.toLocaleString("fr-FR")} %`}
                  libelleAxe={data.recouvrements.periode}
                />
              </PanneauGraphe>

              {data.chenal && (
                <PanneauGraphe titre={`Cote du chenal — ${data.chenal.point}, par mois`}>
                  <GrapheCourbe
                    points={data.chenal.evolution.map((ligne) => ({
                      libelle: ligne.mois,
                      valeur: ligne.valeur,
                    }))}
                    format={(valeur) =>
                      `${valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m`
                    }
                    libelleAxe={`Garantie ${data.chenal.garantie.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} m`}
                  />
                </PanneauGraphe>
              )}
            </div>
          )}

          <div className="grid gap-3.5 xl:grid-cols-2">
            <PanneauGraphe titre="Respect des délais de traitement, par mois">
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

            <PanneauGraphe titre="Décisions d'instance exécutées, par mois">
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
      </div>
    </>
  );
}
