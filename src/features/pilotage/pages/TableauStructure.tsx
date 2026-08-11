import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Anneau } from "@/components/ui/Anneau";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Feu } from "@/components/ui/Feu";
import { Icone } from "@/components/ui/Icone";
import { Pastilles } from "@/components/ui/Pastilles";
import { tableauStructureQuery, type BlocTableauStructure } from "@/features/pilotage/apiCockpit";

/**
 * Tableau de bord d'une structure — niveaux 2 et 3 du descriptif fonctionnel.
 *
 * Le descriptif distingue les deux niveaux par le périmètre, jamais par le
 * contenu : le point focal voit sa seule structure (§3.5, niveau 3), le
 * responsable voit sa branche et la DSR toutes (§3.4, niveau 2). C'est donc un
 * seul écran, dont le sélecteur de structure n'apparaît qu'à qui peut en
 * changer — la liste des structures accessibles vient du serveur, qui la
 * calcule d'après le périmètre de la session.
 *
 * Un écran « niveau 2 » distinct d'un écran « niveau 3 » aurait signifié deux
 * pages à maintenir pour la même mesure, avec la certitude qu'elles finiraient
 * par afficher deux chiffres différents.
 *
 * Les trois blocs — activités, courrier, rituels — reprennent les critères de
 * la matrice de scoring. C'est voulu : un responsable doit reconnaître ici ce
 * qui le classe là-bas.
 */
export function TableauStructure() {
  const [sigle, setSigle] = useState("");

  const { data } = useQuery(tableauStructureQuery(sigle));
  const accessibles = data?.structuresAccessibles ?? [];
  const choix = accessibles.map((s) => s.sigle);

  return (
    <>
      <EnTetePage
        titre="Tableau de bord de structure"
        sousTitre={data ? `${data.structureLibelle} — ${data.periode}` : undefined}
        actions={<Bouton icone="exporter">Exporter</Bouton>}
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          {/* Le sélecteur n'existe que pour qui a plus d'une structure à voir. */}
          {choix.length > 1 && (
            <Pastilles
              options={choix}
              actif={data?.structureSigle ?? choix[0]}
              onChange={setSigle}
              libelle="Choisir la structure observée"
            />
          )}

          <div className="grid items-start gap-3.5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Carte titre="Position au classement">
              {data?.scoreGlobal === null || data?.scoreGlobal === undefined ? (
                <p className="mt-3.5 text-[12px] leading-[1.5] font-medium text-encre-tenue">
                  Structure non évaluée sur cette période : ses registres n'ont pas été alimentés.
                </p>
              ) : (
                <div className="mt-3.5 flex flex-col items-center gap-3.5">
                  <Anneau pourcentage={data.scoreGlobal} objectif={85} taille={132} />
                  <div className="flex w-full items-baseline justify-between gap-3 border-t border-separateur pt-3.5">
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      Rang
                    </span>
                    <span className="text-[13px] leading-none font-extrabold text-encre tabular-nums">
                      {data.rang}
                      <span className="font-semibold text-encre-tenue"> / {data.totalStructures}</span>
                    </span>
                  </div>
                  <Link
                    to={`/performance/classement/${data.structureSigle}`}
                    className="text-[11px] leading-none font-bold text-accent hover:underline"
                  >
                    Voir la décomposition du score
                  </Link>
                </div>
              )}
            </Carte>

            <Carte
              titre="Ce qui appelle une action"
              aDroite={
                <span className="text-[11px] leading-none font-semibold text-encre-tenue tabular-nums">
                  {data?.aTraiter.length ?? 0}
                </span>
              }
            >
              {(data?.aTraiter.length ?? 0) === 0 ? (
                <p className="mt-3.5 text-[12px] leading-[1.5] font-medium text-encre-tenue">
                  Rien en souffrance dans cette structure. Les activités suivent leur rythme, les
                  obligations sont déposées et les responsables sont couverts.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col gap-2">
                  {data?.aTraiter.map((point) => {
                    const contenu = (
                      <>
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="truncate text-[12.5px] leading-[1.3] font-semibold text-encre">
                            {point.libelle}
                          </span>
                          <Feu niveau={point.feu} libelle={point.precision} />
                        </span>
                        {point.chemin && (
                          <Icone nom="chevronDroite" taille={13} className="flex-none text-encre-tenue" />
                        )}
                      </>
                    );

                    return (
                      <li key={point.libelle}>
                        {point.chemin ? (
                          <Link
                            to={point.chemin}
                            className="flex items-center gap-2.5 rounded-none border border-bordure px-3.5 py-3 transition-colors duration-150 hover:bg-surface-douce"
                          >
                            {contenu}
                          </Link>
                        ) : (
                          <span className="flex items-center gap-2.5 rounded-none border border-bordure px-3.5 py-3">
                            {contenu}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Carte>
          </div>

          <div className="grid gap-3.5 xl:grid-cols-3">
            <BlocMesure titre="Exécution des activités" blocs={data?.activites ?? []} />
            <BlocMesure titre="Traitement du courrier" blocs={data?.courrier ?? []} />
            <BlocMesure titre="Conformité aux rituels" blocs={data?.rituels ?? []} />
          </div>

          <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            Ces trois blocs reprennent les critères de la matrice de scoring : ce qui est mesuré ici
            est exactement ce qui détermine le rang de la structure au classement mensuel.
          </p>
        </div>
      </div>
    </>
  );
}

function BlocMesure({ titre, blocs }: { titre: string; blocs: BlocTableauStructure[] }) {
  return (
    <Carte titre={titre}>
      <ul className="mt-3.5 flex flex-col">
        {blocs.map((bloc, index) => (
          <li
            key={bloc.libelle}
            className={`flex items-center justify-between gap-3 py-3 ${
              index > 0 ? "border-t border-separateur" : ""
            }`}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-[12px] leading-none font-semibold text-encre">
                {bloc.libelle}
              </span>
              {bloc.feu === "inconnu" ? (
                <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                  {bloc.note}
                </span>
              ) : (
                <Feu niveau={bloc.feu} libelle={bloc.note} />
              )}
            </span>
            <span className="flex-none text-[17px] leading-none font-extrabold text-encre tabular-nums">
              {bloc.valeur}
            </span>
          </li>
        ))}
      </ul>
    </Carte>
  );
}
