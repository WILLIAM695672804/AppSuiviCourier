import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Anneau } from "@/components/ui/Anneau";
import { Bouton } from "@/components/ui/Bouton";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { GrapheBarres } from "@/components/ui/GrapheBarres";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { tableauDeBordQuery, type PerimetreVue } from "@/features/pilotage/api";
import { usePermission, useSession } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * D-01 — tableau de bord.
 *
 * Trois lectures d'une meme institution, choisies par le selecteur de
 * perimetre. Les vues offertes dependent de l'habilitation : un collaborateur
 * ne voit que « Mes dossiers », un responsable y ajoute sa structure, et seul
 * un poste de portee institution voit l'ensemble. Le selecteur n'affiche donc
 * que ce que l'agent a le droit de demander.
 */
const PERIODES = [
  { valeur: "30j", libelle: "30 derniers jours" },
  { valeur: "trimestre", libelle: "Trimestre" },
  { valeur: "annee", libelle: "Année" },
] as const;

export function TableauDeBord() {
  const session = useSession();
  const peutExporter = usePermission(PERMISSIONS.STAT, PERMISSIONS.IMP);

  // Le perimetre de la session borne les vues proposees.
  const portee = session.perimetre?.portee;
  const vues: { valeur: PerimetreVue; libelle: string }[] = [
    ...(portee === "institution"
      ? [{ valeur: "institution" as const, libelle: "Ensemble des structures" }]
      : []),
    ...(portee === "institution" || portee === "structure_et_descendants" || portee === "structure"
      ? [{ valeur: "structure" as const, libelle: "Ma structure et ses filles" }]
      : []),
    { valeur: "mesDossiers" as const, libelle: "Mes dossiers" },
  ];

  const [perimetre, setPerimetre] = useState<PerimetreVue>(vues[0].valeur);
  const [periode, setPeriode] = useState<string>("30j");

  const { data } = useQuery(tableauDeBordQuery(perimetre, periode));

  return (
    <>
      <EnTetePage
        titre="Tableau de bord"
        actions={
          <div className="flex items-center gap-2">
            <Bouton icone="plus">Ajouter un widget</Bouton>
            {peutExporter && (
              <Bouton variante="principal" icone="exporter">
                Exporter
              </Bouton>
            )}
          </div>
        }
      />

      <div className="flex flex-none flex-wrap items-center gap-4 border-b border-bordure px-[26px] py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] leading-none font-semibold text-encre-faible">Périmètre</span>
          {vues.length > 1 ? (
            <SelecteurSegments
              libelle="Périmètre"
              options={vues}
              valeur={perimetre}
              onChange={setPerimetre}
            />
          ) : (
            <span className="text-xs leading-none font-semibold text-encre">{vues[0].libelle}</span>
          )}
        </div>

        <div className="flex-1" />

        <SelecteurSegments
          libelle="Période"
          options={PERIODES}
          valeur={periode}
          onChange={setPeriode}
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
                  variation={
                    indicateur.variation
                      ? { texte: indicateur.variation, ton: indicateur.ton }
                      : undefined
                  }
                  note={indicateur.note ?? undefined}
                />
              ))}
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
              <div className="flex min-w-0 flex-col gap-4">
                <Carte
                  titre="Volume enregistré et clôturé"
                  aDroite={
                    <span className="flex items-baseline gap-2">
                      <span className="text-lg leading-none font-bold text-encre tabular-nums">
                        {data.volumeTotal.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-[11px] leading-none font-bold text-succes">
                        {data.volumeVariation}
                      </span>
                    </span>
                  }
                >
                  <div className="mt-4">
                    <GrapheBarres
                      categories={data.volume.map((v) => v.periode)}
                      series={[
                        {
                          libelle: "Enregistrés",
                          couleur: "var(--color-accent)",
                          valeurs: data.volume.map((v) => v.enregistres),
                        },
                        {
                          libelle: "Clôturés",
                          couleur: "var(--color-succes-vif)",
                          valeurs: data.volume.map((v) => v.clotures),
                        },
                      ]}
                    />
                  </div>

                  {/* Rappel du cadrage : la session confidentielle est comptee
                      mais jamais detaillee dans les restitutions a la DSR. */}
                  {data.confidentiels > 0 && (
                    <div className="mt-4">
                      <Encart ton="confidentiel" icone="bouclier">
                        {data.confidentiels} courriers confidentiels sur la période. La session
                        Confidentiel est exclue des restitutions destinées à la DSR.
                      </Encart>
                    </div>
                  )}
                </Carte>

                <Carte
                  titre="Courriers les plus en retard"
                  aDroite={
                    <span className="text-[11px] leading-none font-medium text-encre-tenue">
                      {data.totalRetards} en dépassement
                    </span>
                  }
                >
                  <div className="mt-3.5 overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-[minmax(200px,2fr)_140px_120px_70px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                        {["Objet", "Structure cotée", "Étape", "Retard"].map((t) => (
                          <span
                            key={t}
                            className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {data.retards.map((retard) => (
                        <Link
                          key={retard.id}
                          to={`/courriers/${retard.id}`}
                          className="grid grid-cols-[minmax(200px,2fr)_140px_120px_70px] items-center gap-2.5 border-b border-separateur py-2.5 transition-colors duration-150 hover:bg-[#fbfbfc]"
                        >
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="text-[10.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                              {retard.numero}
                            </span>
                            <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                              {retard.objet}
                            </span>
                          </span>
                          <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                            {retard.structure}
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                            {retard.etape}
                          </span>
                          <span className="text-[11.5px] leading-none font-bold text-danger tabular-nums">
                            + {retard.retardJours} j
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between">
                    <span className="text-[11px] leading-none font-medium text-encre-tenue">
                      {data.retards.length} des {data.totalRetards} courriers en dépassement
                    </span>
                    <Link
                      to="/suivi"
                      className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                    >
                      Ouvrir la relance →
                    </Link>
                  </div>
                </Carte>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <Carte titre="Jour le plus chargé">
                  <div className="mt-4">
                    <GrapheBarres
                      hauteur={120}
                      categories={data.chargeParJour.map((j) => j.jour)}
                      series={[
                        {
                          libelle: "Courriers reçus",
                          couleur: "var(--color-accent)",
                          valeurs: data.chargeParJour.map((j) => j.valeur),
                        },
                      ]}
                    />
                  </div>
                </Carte>

                <Carte titre="Respect des délais">
                  <div className="mt-4 flex justify-center">
                    <Anneau pourcentage={data.tauxRespect} objectif={data.objectifRespect} />
                  </div>
                </Carte>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
