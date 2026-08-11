import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { Carte } from "@/components/ui/Carte";
import { Liste } from "@/components/ui/Champ";
import { GrapheBarres } from "@/components/ui/GrapheBarres";
import { statistiquesQuery } from "@/features/pilotage/api";
import { naturesQuery, structuresQuery } from "@/lib/referentiel";

/**
 * D-02 — statistiques.
 *
 * Le tableau de bord montre l'etat du jour ; les statistiques montrent la
 * tendance de l'annee. Le tableau « Delais par structure » est celui qui sera
 * lu en reunion de direction : chaque ligne engage un responsable, d'ou la
 * barre de progression comparee au seuil attendu plutot qu'un simple chiffre.
 */
const ANNEES = [
  { valeur: "2026", libelle: "Année 2026" },
  { valeur: "2025", libelle: "Année 2025" },
  { valeur: "2024", libelle: "Année 2024" },
];

export function Statistiques() {
  const [annee, setAnnee] = useState("2026");
  const [structureId, setStructureId] = useState("");
  const [natureId, setNatureId] = useState("");

  const { data: structures = [] } = useQuery(structuresQuery());
  const { data: natures = [] } = useQuery(naturesQuery());
  const { data } = useQuery(statistiquesQuery({ annee, structureId, natureId }));

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
          options={structures.map((s) => ({ valeur: String(s.id), libelle: s.libelle }))}
          value={structureId}
          onChange={(e) => setStructureId(e.target.value)}
          className="w-56"
        />
        <Liste
          libelle="Nature"
          invite="Toutes natures"
          options={natures.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
          value={natureId}
          onChange={(e) => setNatureId(e.target.value)}
          className="w-48"
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        {data && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 divide-x divide-bordure overflow-hidden rounded-none border border-bordure bg-surface xl:grid-cols-4">
              <CarteIndicateur
                libelle={`Volume enregistré (${annee})`}
                valeur={data.volumeAnnuel.toLocaleString("fr-FR")}
                variation={{ texte: "▲ 11,2 %", ton: "succes" }}
                note={`vs. ${data.volumeAnneePrecedente.toLocaleString("fr-FR")} en ${Number(annee) - 1}`}
              />
              <CarteIndicateur
                libelle="Taux de respect des délais"
                valeur={`${data.tauxRespect} %`}
                variation={{ texte: "▼ 12 pts", ton: "danger" }}
                note="seuil attendu 80 %"
              />
              <CarteIndicateur
                libelle="Délai moyen de traitement"
                valeur={`${data.delaiMoyen.toLocaleString("fr-FR")} j`}
                variation={{ texte: "▼ 0,2 j", ton: "succes" }}
                note="de l'enregistrement à la clôture"
              />
              <CarteIndicateur
                libelle="Expéditeurs distincts"
                valeur={String(data.expediteursDistincts)}
                variation={{ texte: "+ 38", ton: "accent" }}
                note="référentiel des correspondants"
              />
            </div>

            <Carte titre="Volumes par mois">
              <div className="mt-4">
                <GrapheBarres
                  hauteur={200}
                  categories={data.parMois.map((m) => m.mois)}
                  series={[
                    {
                      libelle: "Arrivés",
                      couleur: "var(--color-accent)",
                      valeurs: data.parMois.map((m) => m.arrives),
                    },
                    {
                      libelle: "Départs",
                      couleur: "var(--color-succes-vif)",
                      valeurs: data.parMois.map((m) => m.departs),
                    },
                  ]}
                />
              </div>
            </Carte>

            <Carte
              titre="Délais par structure"
              aDroite={
                <span className="text-[11px] leading-none font-medium text-encre-tenue">
                  Seuil attendu {data.seuilAttendu} %
                </span>
              }
            >
              <div className="mt-3.5 overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[minmax(180px,1.6fr)_100px_110px_minmax(160px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                    {["Structure", "Volume", "Délai moyen", "Respect des délais"].map((t) => (
                      <span
                        key={t}
                        className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {data.parStructure.map((ligne) => {
                    const atteint = ligne.respect >= data.seuilAttendu;
                    return (
                      <div
                        key={ligne.structure}
                        className="grid grid-cols-[minmax(180px,1.6fr)_100px_110px_minmax(160px,1fr)] items-center gap-2.5 border-b border-separateur py-3"
                      >
                        <span className="truncate text-xs leading-none font-semibold text-encre">
                          {ligne.structure}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                          {ligne.volume.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                          {ligne.delaiMoyen.toLocaleString("fr-FR")} j
                        </span>
                        <span className="flex items-center gap-2.5">
                          <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-none bg-inerte">
                            <span
                              style={{ width: `${ligne.respect}%` }}
                              className={`block h-full rounded-none ${
                                atteint ? "bg-succes-vif" : ligne.respect >= 60 ? "bg-alerte-vif" : "bg-danger-vif"
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </Carte>
          </div>
        )}
      </div>
    </>
  );
}
