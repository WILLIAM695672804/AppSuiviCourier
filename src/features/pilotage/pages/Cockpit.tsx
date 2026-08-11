import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Icone } from "@/components/ui/Icone";
import { cockpitQuery, type Criticite } from "@/features/pilotage/apiCockpit";
import { formaterDate } from "@/lib/format";

/**
 * Cockpit exécutif de gouvernance — niveau 1, réservé à la Direction générale.
 *
 * « Vue unique tenant sur un seul écran, agrégeant automatiquement le taux
 * global d'exécution des activités, le nombre de décisions en retard, les
 * structures à risque, la disponibilité des hauts responsables et les alertes
 * actives classées par criticité » (§3.1).
 *
 * La contrainte « un seul écran » gouverne toute la mise en page : la hauteur
 * est fixée et chaque colonne défile pour son compte, plutôt que la page
 * entière. Un cockpit qu'il faut faire défiler n'est plus un cockpit — il
 * redevient un rapport, et le Directeur général en reçoit déjà.
 *
 * Sur téléphone, cette contrainte tombe : à 390 px, aucune vue d'ensemble ne
 * tient sans défilement, et s'y obstiner produirait des chiffres illisibles.
 *
 * Rien n'entre ici qui n'appelle une décision. Ce qui va bien n'occupe qu'un
 * chiffre ; ce qui ne va pas porte un lien vers l'écran où l'on agit.
 */
const TONS_CRITICITE: Record<Criticite, TonEtiquette> = {
  Critique: "danger",
  Élevée: "alerte",
  Modérée: "neutre",
};

const RANG_CRITICITE: Record<Criticite, number> = { Critique: 0, Élevée: 1, Modérée: 2 };

export function Cockpit() {
  const { data } = useQuery(cockpitQuery());

  const alertes = [...(data?.alertes ?? [])].sort(
    (a, b) => RANG_CRITICITE[a.criticite] - RANG_CRITICITE[b.criticite],
  );

  return (
    <>
      <EnTetePage
        titre="Cockpit exécutif"
        sousTitre={data ? `Gouvernance de l'institution — ${data.periode}` : undefined}
        actions={
          <Bouton variante="principal" icone="exporter" onClick={() => window.print()}>
            Exporter en PDF
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:overflow-hidden md:p-[22px]">
        <div className="flex h-auto flex-col gap-3 md:h-full">
          {/* Les quatre chiffres qui ouvrent la vue. */}
          <div className="grid flex-none grid-cols-2 gap-3 xl:grid-cols-4">
            <ChiffreClef
              libelle="Exécution des activités"
              valeur={`${data?.executionActivites ?? 0} %`}
              note="moyenne des plans d'actions"
              feu={
                (data?.executionActivites ?? 0) >= 85
                  ? "vert"
                  : (data?.executionActivites ?? 0) >= 60
                    ? "orange"
                    : "rouge"
              }
              chemin="/activites"
            />
            <ChiffreClef
              libelle="Décisions hors délai"
              valeur={String(data?.decisionsEnRetard ?? 0)}
              note="échéance dépassée"
              feu={(data?.decisionsEnRetard ?? 0) > 0 ? "rouge" : "vert"}
              chemin="/gouvernance/decisions"
            />
            <ChiffreClef
              libelle="Structures à risque"
              valeur={String(data?.structuresARisque ?? 0)}
              note="score sous 60"
              feu={(data?.structuresARisque ?? 0) > 0 ? "rouge" : "vert"}
              chemin="/performance/classement"
            />
            <ChiffreClef
              libelle="Absences sans intérim"
              valeur={String(data?.absencesSansInterim ?? 0)}
              note="responsables sans suppléance"
              feu={(data?.absencesSansInterim ?? 0) > 0 ? "rouge" : "vert"}
              chemin="/gouvernance/disponibilites"
            />
          </div>

          <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_300px]">
            {/* Alertes actives, classées par criticité. */}
            <Panneau titre="Alertes actives" compte={alertes.length}>
              {alertes.length === 0 ? (
                <p className="text-[12px] font-medium text-encre-tenue">
                  Aucune alerte active. Rien n'appelle d'arbitrage ce matin.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {alertes.map((alerte) => {
                    const contenu = (
                      <>
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="truncate text-[12px] leading-[1.3] font-semibold text-encre">
                            {alerte.libelle}
                          </span>
                          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                            {alerte.precision}
                          </span>
                        </span>
                        <Etiquette ton={TONS_CRITICITE[alerte.criticite]}>{alerte.criticite}</Etiquette>
                      </>
                    );

                    return (
                      <li key={alerte.id}>
                        {alerte.chemin ? (
                          <Link
                            to={alerte.chemin}
                            className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5 transition-colors duration-150 hover:bg-surface-douce"
                          >
                            {contenu}
                          </Link>
                        ) : (
                          <span className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5">
                            {contenu}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panneau>

            {/* Ce que le Directeur général a lui-même décidé. */}
            <Panneau titre="Mes instructions et les résolutions du Conseil">
              <ul className="flex flex-col gap-2.5">
                {data?.engagements.map((engagement) => (
                  <li key={engagement.id}>
                    <Link
                      to={`/gouvernance/decisions/${engagement.id}`}
                      className="flex flex-col gap-2 rounded-none border border-bordure px-3 py-2.5 transition-colors duration-150 hover:bg-surface-douce"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[10.5px] leading-none font-bold text-accent tabular-nums">
                          {engagement.reference}
                        </span>
                        {engagement.enRetard && <Etiquette ton="danger">Hors délai</Etiquette>}
                      </span>
                      <span className="line-clamp-2 text-[12px] leading-[1.35] font-semibold text-encre">
                        {engagement.objet}
                      </span>
                      <BarreProgression taux={engagement.avancement} niveau={engagement.feu} />
                      <span className="text-[10px] leading-none font-medium text-encre-tenue">
                        {engagement.origine} · échéance{" "}
                        {engagement.echeance ? formaterDate(engagement.echeance) : "non fixée"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panneau>

            {/* Indicateurs de pilotage et extrêmes du classement. */}
            <div className="flex min-h-0 flex-col gap-3">
              <Panneau titre="Indicateurs de pilotage">
                <ul className="flex flex-col gap-2.5">
                  {data?.indicateurs.map((indicateur) => (
                    <li
                      key={indicateur.libelle}
                      className="flex items-baseline justify-between gap-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[11px] leading-none font-medium text-encre-moyenne">
                        {indicateur.libelle}
                      </span>
                      <span className="flex flex-none items-baseline gap-1.5">
                        <span className="text-[12.5px] leading-none font-bold text-encre tabular-nums">
                          {indicateur.valeur}
                        </span>
                        {indicateur.variation && (
                          <span
                            className={`text-[10px] leading-none font-bold tabular-nums ${
                              indicateur.favorable ? "text-succes" : "text-danger"
                            }`}
                          >
                            {indicateur.variation}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panneau>

              <Panneau titre="Extrêmes du classement">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9.5px] leading-none font-bold tracking-[.5px] text-encre-tenue uppercase">
                      En tête
                    </span>
                    {data?.meilleures.map((s) => (
                      <LigneClassementBreve key={s.sigle} {...s} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 border-t border-separateur pt-3">
                    <span className="text-[9.5px] leading-none font-bold tracking-[.5px] text-encre-tenue uppercase">
                      Les plus fragiles
                    </span>
                    {data?.fragiles.map((s) => (
                      <LigneClassementBreve key={s.sigle} {...s} />
                    ))}
                  </div>
                </div>
              </Panneau>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ChiffreClef({
  libelle,
  valeur,
  note,
  feu,
  chemin,
}: {
  libelle: string;
  valeur: string;
  note: string;
  feu: "vert" | "orange" | "rouge";
  chemin: string;
}) {
  return (
    <Link
      to={chemin}
      className="flex flex-col gap-2 rounded-none border border-bordure bg-surface px-4 py-3.5 transition-colors duration-150 hover:bg-surface-douce"
    >
      <span className="truncate text-[11px] leading-none font-semibold text-encre-moyenne">
        {libelle}
      </span>
      <span className="text-[26px] leading-none font-extrabold tracking-[-.6px] text-encre tabular-nums">
        {valeur}
      </span>
      <Feu niveau={feu} libelle={note} />
    </Link>
  );
}

/** Colonne du cockpit : elle défile pour son compte, pas la page. */
function Panneau({
  titre,
  compte,
  children,
}: {
  titre: string;
  compte?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-none border border-bordure bg-surface">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-separateur px-4 py-3">
        <h2 className="truncate text-[12.5px] leading-none font-bold text-encre">{titre}</h2>
        {compte !== undefined && (
          <span className="flex-none text-[11px] leading-none font-bold text-encre-tenue tabular-nums">
            {compte}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
    </section>
  );
}

function LigneClassementBreve({
  sigle,
  score,
  feu,
}: {
  sigle: string;
  score: number;
  feu: "vert" | "orange" | "rouge" | "inconnu";
}) {
  return (
    <Link
      to={`/performance/classement/${sigle}`}
      className="flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-70"
    >
      <span className="w-10 flex-none text-[11.5px] leading-none font-bold text-encre">{sigle}</span>
      <span className="min-w-0 flex-1">
        <BarreProgression taux={score} niveau={feu} chiffre={false} />
      </span>
      <span className="w-7 flex-none text-right text-[11.5px] leading-none font-bold text-encre tabular-nums">
        {score}
      </span>
      <Icone nom="chevronDroite" taille={11} className="flex-none text-encre-tenue" />
    </Link>
  );
}
