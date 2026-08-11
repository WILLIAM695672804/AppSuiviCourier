import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { EnTeteAdmin } from "@/components/EnTeteAdmin";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { Encart } from "@/components/ui/Encart";
import { GrapheBarres } from "@/components/ui/GrapheBarres";
import { Icone } from "@/components/ui/Icone";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import {
  tableauDeBordAdminQuery,
  type AnomalieReferentiel,
  type LigneAdoption,
  type PeriodeAdmin,
  type RepartitionType,
} from "@/features/administration/api";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Accueil de l'administration.
 *
 * L'administrateur fonctionnel n'a pas de courrier a traiter : lui presenter
 * le tableau de bord metier revenait a lui montrer le travail des autres. Cet
 * ecran repond a ses quatre questions : combien d'operations l'application
 * a-t-elle portees, mon referentiel est-il sain, qui s'en sert reellement,
 * et faut-il que je regarde un acces de plus pres.
 *
 * Chaque bloc est cadenasse par la permission de l'ecran vers lequel il mene.
 * Un poste d'audit voit l'activite et les acces sans voir l'annuaire, un
 * administrateur de l'organisation voit les structures sans voir les journaux.
 * Le compte qui porte les quatre permissions voit les quatre blocs — mais rien
 * dans ce fichier ne suppose que c'est le cas.
 */
const PERIODES = [
  { valeur: "30j", libelle: "30 derniers jours" },
  { valeur: "trimestre", libelle: "Trimestre" },
  { valeur: "annee", libelle: "Année" },
] as const satisfies readonly { valeur: PeriodeAdmin; libelle: string }[];

/** Barre de repartition : la part d'un type d'operation dans le total. */
function Repartition({ ligne }: { ligne: RepartitionType }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[11.5px] leading-none font-semibold text-encre-moyenne">
          {ligne.libelle}
        </span>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
            {ligne.valeur.toLocaleString("fr-FR")}
          </span>
          <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
            {ligne.part} %
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-none bg-surface-douce">
        <div
          className="h-full rounded-none bg-accent"
          style={{ width: `${Math.max(ligne.part, 1.5)}%` }}
        />
      </div>
    </div>
  );
}

/** Ligne du referentiel : un chiffre, son libelle, rien de plus. */
function LigneCompteur({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-separateur py-2.5 last:border-b-0">
      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne">{libelle}</span>
      <span className="text-[13px] leading-none font-bold text-encre tabular-nums">
        {valeur.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

/** Une anomalie mene toujours a l'ecran qui permet de la corriger. */
function LigneAnomalie({ anomalie }: { anomalie: AnomalieReferentiel }) {
  const teinte = anomalie.ton === "danger" ? "text-danger" : "text-alerte";

  return (
    <Link
      to={anomalie.chemin}
      className="flex items-center gap-2.5 rounded-none px-2 py-2 transition-colors duration-150 hover:bg-surface-douce"
    >
      <span className={`flex-none ${teinte}`}>
        <Icone nom="aide" taille={15} epaisseur={1.7} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
        {anomalie.libelle}
      </span>
      <span className={`text-[12px] leading-none font-bold tabular-nums ${teinte}`}>
        {anomalie.nombre}
      </span>
    </Link>
  );
}

function LigneStructure({ ligne }: { ligne: LigneAdoption }) {
  const inactive = ligne.derniereActivite === null;

  return (
    <div className="grid grid-cols-[minmax(160px,2fr)_110px_100px_minmax(110px,1fr)] items-center gap-2.5 border-b border-separateur py-2.5 last:border-b-0">
      <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
        {ligne.structure}
      </span>
      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
        {ligne.actifs} / {ligne.habilites}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
          {ligne.operations.toLocaleString("fr-FR")}
        </span>
        <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
          {ligne.part} %
        </span>
      </span>
      <span
        className={`truncate text-[11.5px] leading-none font-medium tabular-nums ${
          inactive ? "text-danger" : "text-encre-faible"
        }`}
      >
        {ligne.derniereActivite ?? "Aucune activité"}
      </span>
    </div>
  );
}

export function TableauDeBordAdmin() {
  const naviguer = useNavigate();
  const [periode, setPeriode] = useState<PeriodeAdmin>("30j");
  const { data } = useQuery(tableauDeBordAdminQuery(periode));

  const voitJournaux = usePermission(PERMISSIONS.AUDIT);
  const voitReferentiel = usePermission(PERMISSIONS.ADM_HAB, PERMISSIONS.ADM_ORG);
  const voitStructures = usePermission(PERMISSIONS.ADM_ORG);
  const peutHabiliter = usePermission(PERMISSIONS.ADM_HAB);
  const peutOrganiser = usePermission(PERMISSIONS.ADM_ORG);

  return (
    <>
      <EnTeteAdmin
        titre="Administration"
        sousTitre="Activité de l'application, référentiel et accès"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {peutHabiliter && (
              <>
                <Bouton
                  variante="principal"
                  icone="personneAjout"
                  onClick={() => naviguer("/habilitations")}
                >
                  Nouvel utilisateur
                </Bouton>
                <Bouton icone="bouclier" onClick={() => naviguer("/habilitations")}>
                  Nouveau profil
                </Bouton>
              </>
            )}
            {peutOrganiser && (
              <Bouton icone="organisation" onClick={() => naviguer("/organisation")}>
                Nouvelle structure
              </Bouton>
            )}
          </div>
        }
      />

      <div className="flex flex-none flex-wrap items-center gap-3">
        <span className="text-[11px] leading-none font-semibold text-encre-faible">Période</span>
        <SelecteurSegments
          libelle="Période"
          options={PERIODES}
          valeur={periode}
          onChange={setPeriode}
        />
      </div>

      {data && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 divide-x divide-bordure overflow-hidden rounded-none bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)] xl:grid-cols-4">
            {data.indicateurs.map((indicateur) => (
              <CarteIndicateur
                key={indicateur.libelle}
                libelle={indicateur.libelle}
                valeur={indicateur.valeur}
                ton={indicateur.ton}
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
              {voitJournaux && (
                <Carte
                  titre="Opérations enregistrées"
                  aDroite={
                    <span className="flex items-baseline gap-2">
                      <span className="text-lg leading-none font-bold text-encre tabular-nums">
                        {data.operationsTotal.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-[11px] leading-none font-bold text-succes">
                        {data.operationsVariation}
                      </span>
                    </span>
                  }
                >
                  <div className="mt-4">
                    <GrapheBarres
                      categories={data.activite.map((p) => p.periode)}
                      series={[
                        {
                          libelle: "Opérations",
                          couleur: "var(--color-accent)",
                          valeurs: data.activite.map((p) => p.operations),
                        },
                      ]}
                    />
                  </div>

                  {/* Le detail par type est ce qui distingue une volumetrie
                      d'un simple total : 300 cotations et 300 corrections de
                      parametrage ne racontent pas la meme institution. */}
                  <div className="mt-5 grid gap-x-8 gap-y-3.5 border-t border-separateur pt-4 sm:grid-cols-2">
                    {data.parType.map((ligne) => (
                      <Repartition key={ligne.libelle} ligne={ligne} />
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to="/tracabilite"
                      className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                    >
                      Ouvrir la traçabilité →
                    </Link>
                  </div>
                </Carte>
              )}

              {voitStructures && (
                <Carte
                  titre="Adoption par structure"
                  aDroite={
                    <span className="text-[11px] leading-none font-medium text-encre-tenue">
                      {data.adoption.length} structures de premier niveau
                    </span>
                  }
                >
                  <div className="mt-3.5 overflow-x-auto">
                    <div className="min-w-[520px]">
                      <div className="grid grid-cols-[minmax(160px,2fr)_110px_100px_minmax(110px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                        {["Structure", "Actifs", "Opérations", "Dernière activité"].map((t) => (
                          <span
                            key={t}
                            className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {data.adoption.map((ligne) => (
                        <LigneStructure key={ligne.structure} ligne={ligne} />
                      ))}
                    </div>
                  </div>

                  {data.structuresInactives > 0 && (
                    <div className="mt-4">
                      <Encart ton="alerte" icone="aide">
                        {data.structuresInactives === 1
                          ? "Une structure n'a enregistré aucune opération sur la période."
                          : `${data.structuresInactives} structures n'ont enregistré aucune opération sur la période.`}{" "}
                        Un déploiement inachevé se lit ici avant de se lire dans les réclamations.
                      </Encart>
                    </div>
                  )}

                  <div className="mt-3.5 flex justify-end">
                    <Link
                      to="/organisation"
                      className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                    >
                      Ouvrir l'organisation →
                    </Link>
                  </div>
                </Carte>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              {voitReferentiel && (
                <Carte titre="Santé du référentiel">
                  <div className="mt-2">
                    {data.referentiel.map((compteur) => (
                      <LigneCompteur
                        key={compteur.libelle}
                        libelle={compteur.libelle}
                        valeur={compteur.valeur}
                      />
                    ))}
                  </div>

                  {data.anomalies.length > 0 && (
                    <div className="mt-3.5 border-t border-separateur pt-3">
                      <p className="px-2 text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase">
                        À corriger
                      </p>
                      <div className="mt-1.5 flex flex-col">
                        {data.anomalies.map((anomalie) => (
                          <LigneAnomalie key={anomalie.libelle} anomalie={anomalie} />
                        ))}
                      </div>
                    </div>
                  )}
                </Carte>
              )}

              {voitJournaux && (
                <Carte titre="Supervision des accès">
                  <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                    {[
                      { libelle: "Signalés", valeur: data.acces.signales, ton: "text-danger" },
                      { libelle: "Refusés", valeur: data.acces.refuses, ton: "text-alerte" },
                      {
                        libelle: "Confidentiels",
                        valeur: data.acces.confidentiels,
                        ton: "text-confidentiel",
                      },
                    ].map((bloc) => (
                      <div
                        key={bloc.libelle}
                        className="flex flex-col gap-2 rounded-none bg-surface-douce px-3 py-2.5"
                      >
                        <span className={`text-lg leading-none font-bold tabular-nums ${bloc.ton}`}>
                          {bloc.valeur}
                        </span>
                        <span className="text-[10.5px] leading-none font-semibold text-encre-tenue">
                          {bloc.libelle}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5 border-t border-separateur pt-3.5">
                    {data.acces.dernieres.map((alerte) => (
                      <div key={alerte.id} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                            {alerte.agent}
                          </span>
                          <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                            {alerte.horodatage}
                          </span>
                        </div>
                        <span className="truncate text-[11px] leading-none font-medium text-encre-faible">
                          {alerte.action} · {alerte.objet}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to="/tracabilite"
                      className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                    >
                      Voir le journal des accès →
                    </Link>
                  </div>
                </Carte>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
