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
import { TON_PAR_FEU } from "@/lib/feu";
import { usePermission, useSession } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * D-01 — tableau de bord.
 *
 * Trois lectures d'une même institution, choisies par le sélecteur de
 * périmètre. Le sélecteur ne propose que ce que la portée de la session
 * autorise, mais **c'est le serveur qui décide** : il ramène un périmètre trop
 * large à ce que la portée permet, et le dit dans `perimetreApplique`. Un
 * onglet resté ouvert après un changement d'habilitation n'est pas une
 * tentative d'intrusion — le refuser aurait cassé l'écran d'un agent qui n'a
 * rien fait de mal (ADR 009).
 *
 * L'écran décrivait auparavant le courrier : volumes enregistrés et clôturés,
 * jour le plus chargé, courriers en dépassement. Le pilier n'ayant pas de
 * clôture, ces chiffres n'existaient pas et ont cédé la place aux productions
 * du calendrier officiel et aux décisions d'instance. La clôture est en service
 * depuis le 27 août 2026, et « Courriers traités dans le délai » a rejoint les
 * indicateurs. Ce que l'application ne mesure pas est écrit en toutes lettres
 * au bas de l'écran, et non tu (ADR 011).
 */
const PERIODES = [
  { valeur: "mois", libelle: "Dernier mois clos" },
  { valeur: "trimestre", libelle: "Trimestre" },
  { valeur: "annee", libelle: "Année" },
] as const;

const LIBELLES_PERIMETRE: Record<PerimetreVue, string> = {
  institution: "Ensemble des structures",
  structure: "Ma structure et ses filles",
  mesDossiers: "Mes dossiers",
};

export function TableauDeBord() {
  const session = useSession();
  const peutExporter = usePermission(PERMISSIONS.STAT, PERMISSIONS.IMP);

  // La portée de la session borne les vues proposées. Le serveur revérifie :
  // ce sélecteur est un confort, pas une garantie.
  const portee = session.perimetre?.portee;
  const vues: { valeur: PerimetreVue; libelle: string }[] = [
    ...(portee === "institution"
      ? [{ valeur: "institution" as const, libelle: LIBELLES_PERIMETRE.institution }]
      : []),
    ...(portee === "institution" || portee === "structure_et_descendants" || portee === "structure"
      ? [{ valeur: "structure" as const, libelle: LIBELLES_PERIMETRE.structure }]
      : []),
    { valeur: "mesDossiers" as const, libelle: LIBELLES_PERIMETRE.mesDossiers },
  ];

  const [perimetre, setPerimetre] = useState<PerimetreVue>(vues[0].valeur);
  const [periode, setPeriode] = useState<string>("mois");

  const { data } = useQuery(tableauDeBordQuery(perimetre, periode));
  const ramene = data !== undefined && data.perimetreApplique !== perimetre;

  return (
    <>
      <EnTetePage
        titre="Tableau de bord"
        actions={
          <div className="flex items-center gap-2">
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
            {/* Le serveur a répondu sur un périmètre plus étroit que celui
                demandé. Le taire aurait laissé croire que l'institution
                entière tient dans ces chiffres. */}
            {ramene && (
              <Encart ton="alerte" icone="bouclier">
                Votre habilitation ne porte pas sur l'ensemble demandé. Les chiffres ci-dessous
                sont ceux de : {data.perimetreLibelle}.
              </Encart>
            )}

            <div className="grid grid-cols-2 divide-x divide-bordure overflow-hidden rounded-none border border-bordure bg-surface xl:grid-cols-4">
              {data.indicateurs.map((indicateur) => (
                <CarteIndicateur
                  key={indicateur.libelle}
                  libelle={indicateur.libelle}
                  valeur={indicateur.valeur}
                  variation={
                    indicateur.variation
                      ? { texte: indicateur.variation, ton: TON_PAR_FEU[indicateur.feu] }
                      : undefined
                  }
                  note={indicateur.note}
                />
              ))}
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
              <div className="flex min-w-0 flex-col gap-4">
                <Carte
                  titre="Productions attendues et décisions exécutées"
                  aDroite={
                    <span className="text-[11px] leading-none font-medium text-encre-tenue">
                      {data.perimetreLibelle} — {data.periode}
                    </span>
                  }
                >
                  <div className="mt-4">
                    <GrapheBarres
                      categories={data.serie.map((point) => point.periode)}
                      series={[
                        {
                          libelle: "Attendues",
                          couleur: "var(--color-accent)",
                          valeurs: data.serie.map((point) => point.attendues),
                        },
                        {
                          libelle: "Déposées",
                          couleur: "var(--color-succes-vif)",
                          valeurs: data.serie.map((point) => point.deposees),
                        },
                        {
                          libelle: "Décisions exécutées",
                          couleur: "var(--color-alerte-vif)",
                          valeurs: data.serie.map((point) => point.decisionsExecutees),
                        },
                      ]}
                    />
                  </div>
                </Carte>

                <Carte
                  titre="Ce qui est en retard"
                  aDroite={
                    <span className="text-[11px] leading-none font-medium text-encre-tenue">
                      {data.retards.length} en dépassement
                    </span>
                  }
                >
                  {data.retards.length === 0 ? (
                    <p className="mt-4 text-[11.5px] leading-relaxed text-encre-faible">
                      Aucune production ni décision en dépassement sur ce périmètre.
                    </p>
                  ) : (
                    <div className="mt-3.5 overflow-x-auto">
                      <div className="min-w-[600px]">
                        <div className="grid grid-cols-[minmax(200px,2fr)_140px_140px_70px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                          {["Objet", "Structure", "Nature", "Retard"].map((t) => (
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
                            key={`${retard.etape}-${retard.id}`}
                            to={retard.chemin ?? "#"}
                            className="grid grid-cols-[minmax(200px,2fr)_140px_140px_70px] items-center gap-2.5 border-b border-separateur py-2.5 transition-colors duration-150 hover:bg-[#fbfbfc]"
                          >
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="text-[10.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                                {retard.reference}
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
                  )}
                </Carte>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <Carte titre="Productions déposées à l'échéance">
                  {/* `null` et non zéro : aucune échéance n'est passée, il n'y
                      a rien à mesurer. Un anneau à 0 % aurait dit que rien
                      n'avait été déposé. */}
                  {data.tauxRespect === null ? (
                    <p className="mt-4 text-[11.5px] leading-relaxed text-encre-faible">
                      Non mesuré : aucune production échue sur ce périmètre.
                    </p>
                  ) : (
                    <div className="mt-4 flex justify-center">
                      <Anneau pourcentage={data.tauxRespect} objectif={data.objectifRespect} />
                    </div>
                  )}
                </Carte>

                <Carte titre="Ce que cet écran ne mesure pas">
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}
