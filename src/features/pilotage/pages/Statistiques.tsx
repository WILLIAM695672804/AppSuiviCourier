import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { Carte } from "@/components/ui/Carte";
import { Liste } from "@/components/ui/Champ";
import { GrapheBarres } from "@/components/ui/GrapheBarres";
import { statistiquesQuery } from "@/features/pilotage/api";
import { structuresQuery } from "@/lib/referentiel";

/**
 * D-02 — statistiques annuelles.
 *
 * Le tableau de bord montre l'état du jour ; les statistiques montrent la
 * tendance de l'année. Le tableau « Respect des échéances par structure » est
 * celui qui sera lu en réunion de direction : chaque ligne engage un
 * responsable, d'où la barre comparée au seuil attendu plutôt qu'un chiffre nu.
 *
 * Trois choses ont changé avec le branchement au serveur.
 *
 * 1. **Les évolutions écrites en dur ont disparu.** La page affichait
 *    « ▲ 11,2 % » et « ▼ 12 pts » quelles que soient les données : des chiffres
 *    qu'aucune mesure ne soutenait, sur l'écran le plus susceptible d'être
 *    projeté en réunion.
 * 2. **Le seuil attendu vient du serveur** (`seuilAttendu`), où il est
 *    administré. Il valait 80 % en dur ici — voir A31.
 * 3. **Une structure sans obligation échue n'a pas un taux de 0 %.** Elle n'a
 *    pas de taux : la case affiche « Non mesuré » (ADR 011).
 */
const ANNEES = [
  { valeur: "2026", libelle: "Année 2026" },
  { valeur: "2025", libelle: "Année 2025" },
  { valeur: "2024", libelle: "Année 2024" },
];

export function Statistiques() {
  const [annee, setAnnee] = useState("2026");
  const [structureId, setStructureId] = useState("");

  const { data: structures = [] } = useQuery(structuresQuery());
  const { data } = useQuery(statistiquesQuery({ annee, structureId }));

  return (
    <>
      <EnTetePage
        titre="Statistiques"
        actions={
          <Bouton variante="principal" icone="exporter">
            Exporter
          </Bouton>
        }
      />

      <div className="flex flex-none flex-wrap items-end gap-3 border-b border-bordure px-[26px] py-3">
        <Liste
          libelle="Période"
          options={ANNEES}
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          className="w-44"
        />
        <Liste
          libelle="Structure"
          invite="Toutes structures"
          options={structures.map((s) => ({ valeur: s.sigle, libelle: s.libelle }))}
          value={structureId}
          onChange={(e) => setStructureId(e.target.value)}
          className="w-56"
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        {data && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 divide-x divide-bordure overflow-hidden rounded-none border border-bordure bg-surface xl:grid-cols-4">
              {data.indicateurs.map((indicateur) => (
                <CarteIndicateur
                  key={indicateur.libelle}
                  libelle={indicateur.libelle}
                  valeur={indicateur.valeur}
                  note={indicateur.note}
                />
              ))}
            </div>

            <Carte titre="Productions attendues et décisions exécutées, mois par mois">
              <div className="mt-4">
                <GrapheBarres
                  hauteur={200}
                  categories={data.parMois.map((m) => m.mois)}
                  series={[
                    {
                      libelle: "Attendues",
                      couleur: "var(--color-accent)",
                      valeurs: data.parMois.map((m) => m.attendues),
                    },
                    {
                      libelle: "Déposées",
                      couleur: "var(--color-succes-vif)",
                      valeurs: data.parMois.map((m) => m.deposees),
                    },
                    {
                      libelle: "Décisions exécutées",
                      couleur: "var(--color-alerte-vif)",
                      valeurs: data.parMois.map((m) => m.decisionsExecutees),
                    },
                  ]}
                />
              </div>
            </Carte>

            <Carte
              titre="Respect des échéances par structure"
              aDroite={
                <span className="text-[11px] leading-none font-medium text-encre-tenue">
                  Seuil attendu {data.seuilAttendu} %
                </span>
              }
            >
              <div className="mt-3.5 overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[minmax(180px,1.6fr)_100px_130px_minmax(160px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                    {["Structure", "Attendues", "Avance au dépôt", "Respect des échéances"].map(
                      (t) => (
                        <span
                          key={t}
                          className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                        >
                          {t}
                        </span>
                      ),
                    )}
                  </div>

                  {data.parStructure.map((ligne) => {
                    const atteint = ligne.respect !== null && ligne.respect >= data.seuilAttendu;
                    return (
                      <div
                        key={ligne.sigle}
                        className="grid grid-cols-[minmax(180px,1.6fr)_100px_130px_minmax(160px,1fr)] items-center gap-2.5 border-b border-separateur py-3"
                      >
                        <span className="truncate text-xs leading-none font-semibold text-encre">
                          {ligne.structure}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                          {ligne.volume.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                          {ligne.ecartMoyen === null
                            ? "—"
                            : `${ligne.ecartMoyen.toLocaleString("fr-FR")} j`}
                        </span>

                        {/* Aucune obligation échue : pas de taux, et surtout
                            pas une barre vide qui se lirait comme un zéro. */}
                        {ligne.respect === null ? (
                          <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                            Non mesuré
                          </span>
                        ) : (
                          <span className="flex items-center gap-2.5">
                            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-none bg-inerte">
                              <span
                                style={{ width: `${ligne.respect}%` }}
                                className={`block h-full rounded-none ${
                                  atteint
                                    ? "bg-succes-vif"
                                    : ligne.respect >= 60
                                      ? "bg-alerte-vif"
                                      : "bg-danger-vif"
                                }`}
                              />
                            </span>
                            <span
                              className={`w-9 flex-none text-right text-[11.5px] leading-none font-bold tabular-nums ${
                                atteint ? "text-succes" : "text-danger"
                              }`}
                            >
                              {ligne.respect} %
                            </span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Carte>

            <Carte titre="Ce que ces statistiques ne mesurent pas">
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {data.nonMesure.map((mesure) => (
                  <li key={mesure.libelle} className="flex flex-col gap-1">
                    <span className="text-[11.5px] leading-none font-semibold text-encre">
                      {mesure.libelle}
                    </span>
                    <span className="text-[11px] leading-snug text-encre-faible">
                      {mesure.raison}
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          </div>
        )}
      </div>
    </>
  );
}
