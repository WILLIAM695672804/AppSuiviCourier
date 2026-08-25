import { useQuery } from "@tanstack/react-query";
import { EnTeteDocument, PiedDocument } from "@/components/EnTeteDocument";
import { EnTetePage } from "@/components/EnTetePage";
import { Anneau } from "@/components/ui/Anneau";
import { BandeReperes } from "@/components/ui/BandeReperes";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { GrapheColonnes } from "@/components/ui/GrapheColonnes";
import { GrapheCourbe } from "@/components/ui/GrapheCourbe";
import { GrapheRepartition } from "@/components/ui/GrapheRepartition";
import { PanneauGraphe } from "@/components/ui/PanneauGraphe";
import {
  vueEnsembleComiteQuery,
  type PositionMembre,
  type RepereComite,
} from "@/features/comite/api";
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
 * Le Comité regarde ses directions.
 *
 * Il ne les regarde plus une colonne chacune. L'histogramme des scores tenait
 * tant que les directions se comptaient sur une main ; au-delà, les sigles se
 * chevauchent et le graphique ne se lit plus — le premier panneau montre donc
 * la position de la direction du membre, son score et son rang (ADR 026). La
 * comparaison n'est pas perdue pour autant : elle est passée dans les deux
 * mouvements d'ensemble, le score moyen et la dispersion, qui disent si le
 * collège progresse et s'il se resserre ou se disperse.
 */
export function VueEnsembleComite() {
  const { data } = useQuery(vueEnsembleComiteQuery());

  // Sept cases vides tant que rien n'est arrive : la bande garde sa hauteur,
  // et la page ne saute pas au moment ou les chiffres tombent.
  const reperes: (RepereComite | null)[] =
    data?.reperes ?? Array.from({ length: 7 }, () => null);

  return (
    <>
      <EnTetePage
        titre="Vue d'ensemble du Comité de direction"
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
            <PanneauGraphe titre="Position de votre direction">
              {data &&
                (data.positionMembre ? (
                  <PositionAuClassement position={data.positionMembre} />
                ) : (
                  <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                    Aucune direction ne vous est rattachée pour cette période,
                    ou la vôtre n'entre pas au classement du mois. Le mouvement
                    du collège se lit dans les deux graphiques du bas.
                  </p>
                ))}
            </PanneauGraphe>

            <PanneauGraphe titre="Décisions du Comité, par état">
              {data && (
                <GrapheRepartition
                  parts={data.decisionsParEtat}
                  libelleTotal="décisions suivies"
                />
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
                    Écart entre la direction la mieux notée et la moins bien
                    notée. Un écart qui se creuse signale un décrochage que la
                    moyenne ne montre pas.
                  </p>
                </>
              )}
            </PanneauGraphe>
          </div>

          {data && data.evolutionScoreMoyen.length === 0 && (
            <Encart icone="aide">
              Aucune direction n'est encore notée pour cet exercice. Le
              classement apparaîtra dès la première production de la matrice de
              scoring.
            </Encart>
          )}
        </div>

        <PiedDocument impressionSeule />
      </div>
    </>
  );
}

/**
 * Le score de la direction du membre, et son rang.
 *
 * Trois lignes sous l'anneau, et pas une de plus : le rang, son mouvement
 * depuis le mois dernier, et l'écart à la moyenne du collège. C'est ce qu'un
 * directeur vient chercher — où il est, et s'il monte ou descend.
 */
function PositionAuClassement({ position }: { position: PositionMembre }) {
  const evolutionRang =
    position.rangPrecedent === null
      ? null
      : position.rangPrecedent - position.rang;
  const ecartMoyenne =
    position.moyenneCollege === null
      ? null
      : Math.round((position.scoreGlobal - position.moyenneCollege) * 10) / 10;

  return (
    <div className="flex flex-col items-center gap-3.5">
      <Anneau pourcentage={position.scoreGlobal} objectif={85} taille={128} />

      <div className="flex w-full flex-col gap-2 border-t border-separateur pt-3.5">
        <Ligne
          libelle={position.structureLibelle}
          valeur={position.structureSigle}
        />

        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] leading-none font-semibold text-encre-tenue">
            Rang
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[13px] leading-none font-extrabold text-encre tabular-nums">
              {position.rang}
              <span className="font-semibold text-encre-tenue">
                {" "}
                / {position.totalStructures}
              </span>
            </span>
            {evolutionRang !== null && evolutionRang !== 0 && (
              <span
                className={`text-[10.5px] leading-none font-bold ${
                  evolutionRang > 0 ? "text-succes" : "text-danger"
                }`}
              >
                {evolutionRang > 0
                  ? `â² ${evolutionRang}`
                  : `â¼ ${-evolutionRang}`}
              </span>
            )}
          </span>
        </span>

        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] leading-none font-semibold text-encre-tenue">
            Écart à la moyenne du collège
          </span>
          <span
            className={`text-[12px] leading-none font-bold tabular-nums ${
              ecartMoyenne === null
                ? "text-encre-tenue"
                : ecartMoyenne >= 0
                  ? "text-succes"
                  : "text-danger"
            }`}
          >
            {ecartMoyenne === null
              ? "—"
              : `${ecartMoyenne >= 0 ? "+" : ""}${ecartMoyenne.toLocaleString("fr-FR")} pt`}
          </span>
        </span>
      </div>
    </div>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate text-[11px] leading-none font-semibold text-encre-tenue">
        {libelle}
      </span>
      <span className="flex-none text-[12px] leading-none font-bold text-encre">
        {valeur}
      </span>
    </span>
  );
}
