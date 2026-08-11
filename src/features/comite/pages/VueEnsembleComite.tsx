import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeReperes } from "@/components/ui/BandeReperes";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { GrapheColonnes } from "@/components/ui/GrapheColonnes";
import { GrapheCourbe } from "@/components/ui/GrapheCourbe";
import { GrapheRepartition } from "@/components/ui/GrapheRepartition";
import { PanneauGraphe } from "@/components/ui/PanneauGraphe";
import { vueEnsembleComiteQuery, type RepereComite } from "@/features/comite/api";
import { formaterDateHeure } from "@/lib/format";

/**
 * Vue d'ensemble du Comité de direction — le conseil des directeurs.
 *
 * Même appareil que celle du Directeur général : une bande de repères, puis
 * cinq graphiques et aucun tableau. Rien n'y est cliquable, rien n'y demande
 * d'action — le §3.2 donne au Comité une consultation, pas un poste de travail.
 * Il arbitre depuis le cockpit, qui reste partagé ; il se situe depuis ici.
 *
 * Ce que la composition change, c'est l'objet. Le Directeur général regarde une
 * institution — son courrier, ses délais, ses correspondants, l'état du port.
 * Le Comité regarde ses directions, les unes en face des autres. D'où l'ordre
 * des graphiques : le classement d'abord, parce que c'est la matière de la
 * délibération, puis ce qui l'explique, puis les deux mouvements d'ensemble —
 * le collège progresse-t-il, et se resserre-t-il ou se disperse-t-il.
 *
 * Le membre connecté retrouve sa direction mise en évidence au classement, et
 * nulle part ailleurs. Il siège comme directeur sans que la page devienne la
 * sienne : un conseil délibère sur l'ensemble, pas sur le cas de chacun de ses
 * membres à tour de rôle.
 */
export function VueEnsembleComite() {
  const { data } = useQuery(vueEnsembleComiteQuery());

  // Sept cases vides tant que rien n'est arrive : la bande garde sa hauteur,
  // et la page ne saute pas au moment ou les chiffres tombent.
  const reperes: (RepereComite | null)[] = data?.reperes ?? Array.from({ length: 7 }, () => null);

  return (
    <>
      <EnTetePage
        titre="Vue d'ensemble du Comité de direction"
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
            <PanneauGraphe titre="Score global des directions">
              {data && (
                <>
                  <GrapheColonnes
                    points={data.scoreParStructure.map((part) => ({
                      libelle: part.libelle,
                      valeur: part.valeur,
                    }))}
                    format={(valeur) => `${valeur.toLocaleString("fr-FR")} pt`}
                    libelleAxe={`Matrice de scoring — exercice ${data.exercice}`}
                  />
                  {data.structureSigle && (
                    <p className="mt-2 text-[10.5px] leading-[1.45] font-medium text-encre-tenue">
                      Votre direction, {data.structureSigle}, figure au classement au même titre que
                      les autres.
                    </p>
                  )}
                </>
              )}
            </PanneauGraphe>

            <PanneauGraphe titre="Décisions du Comité, par état">
              {data && (
                <GrapheRepartition parts={data.decisionsParEtat} libelleTotal="décisions suivies" />
              )}
            </PanneauGraphe>

            <PanneauGraphe titre="Activités des directions, par état">
              {data && (
                <GrapheRepartition
                  parts={data.activitesParEtat}
                  libelleTotal="activités inscrites"
                />
              )}
            </PanneauGraphe>
          </div>

          <div className="grid gap-3.5 xl:grid-cols-2">
            <PanneauGraphe titre="Score moyen des directions, par mois">
              {data && (
                <GrapheCourbe
                  points={data.evolutionScoreMoyen.map((ligne) => ({
                    libelle: ligne.mois,
                    valeur: ligne.valeur,
                  }))}
                  format={(valeur) => `${valeur.toLocaleString("fr-FR")} pt`}
                  libelleAxe={`Exercice ${data.exercice}`}
                />
              )}
            </PanneauGraphe>

            <PanneauGraphe titre="Dispersion du collège, par mois">
              {data && (
                <>
                  <GrapheColonnes
                    points={data.dispersion.map((ligne) => ({
                      libelle: ligne.mois,
                      valeur: ligne.valeur,
                    }))}
                    format={(valeur) => `${valeur.toLocaleString("fr-FR")} pt`}
                    libelleAxe={`Exercice ${data.exercice}`}
                  />
                  <p className="mt-2 text-[10.5px] leading-[1.45] font-medium text-encre-tenue">
                    Écart entre la direction la mieux notée et la moins bien notée. Un écart qui se
                    creuse signale un décrochage que la moyenne ne montre pas.
                  </p>
                </>
              )}
            </PanneauGraphe>
          </div>

          {data && data.scoreParStructure.length === 0 && (
            <Encart icone="aide">
              Aucune direction n'est encore notée pour cet exercice. Le classement apparaîtra dès la
              première production de la matrice de scoring.
            </Encart>
          )}
        </div>
      </div>
    </>
  );
}
