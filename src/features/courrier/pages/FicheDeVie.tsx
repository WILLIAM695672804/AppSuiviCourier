import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { EtatChargement, EtatErreur } from "@/components/ui/EtatChargement";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { ficheDeVieQuery } from "@/features/courrier/api";

/**
 * A-13 — fiche de vie du courrier.
 *
 * Le journal complet, lisible par un agent et non par un administrateur :
 * chaque etape porte son auteur, sa duree et ce qui s'est passe. C'est la
 * piece qu'on imprime quand un courrier fait l'objet d'une contestation.
 *
 * Le filtre « Jalons » ne garde que les etapes qui engagent l'institution —
 * enregistrement, cotation, signature, depart. Les mouvements internes
 * disparaissent.
 */
export function FicheDeVie() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const courrierId = Number(id);
  const [jalonsSeuls, setJalonsSeuls] = useState(false);

  const { data, isPending, isError } = useQuery(ficheDeVieQuery(courrierId));

  if (isPending) {
    return (
      <>
        <EnTetePage
          titre="Fiche de vie"
          miettes={[{ libelle: "Registre des arrivées", chemin: "/courriers" }]}
        />
        <EtatChargement message="Chargement de la fiche…" />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <EnTetePage
          titre="Fiche de vie"
          miettes={[{ libelle: "Registre des arrivées", chemin: "/courriers" }]}
        />
        <EtatErreur message="Fiche de vie indisponible." />
      </>
    );
  }

  const etapes = jalonsSeuls ? data.etapes.filter((e) => e.jalon) : data.etapes;

  return (
    <>
      <EnTetePage
        titre={`Fiche de vie — ${data.objet}`}
        miettes={[
          { libelle: "Registre des arrivées", chemin: "/courriers" },
          { libelle: data.numero, chemin: `/courriers/${courrierId}` },
          { libelle: "Fiche de vie" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Bouton onClick={() => naviguer(`/courriers/${courrierId}`)}>Voir la fiche courrier</Bouton>
            <Bouton variante="principal" icone="exporter">
              Exporter la fiche de vie
            </Bouton>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <Carte
            titre="Parcours complet du courrier"
            aDroite={
              <div className="flex items-center gap-1.5">
                {[
                  { cle: false, libelle: "Toutes les étapes" },
                  { cle: true, libelle: "Jalons" },
                ].map((f) => (
                  <button
                    key={String(f.cle)}
                    type="button"
                    onClick={() => setJalonsSeuls(f.cle)}
                    className={`rounded-none px-[11px] py-[7px] text-[11.5px] leading-none font-semibold transition-colors duration-150 ${
                      jalonsSeuls === f.cle
                        ? "bg-encre text-white"
                        : "bg-[#f2f4f7] text-encre-moyenne hover:bg-bordure"
                    }`}
                  >
                    {f.libelle}
                  </button>
                ))}
              </div>
            }
          >
            <ol className="mt-4">
              {etapes.map((etape, i) => (
                <li key={etape.id} className="grid grid-cols-[64px_30px_minmax(0,1fr)] gap-3">
                  <div className="flex flex-col items-end pt-0.5">
                    <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
                      {etape.heure}
                    </span>
                    <span className="mt-1 text-[10.5px] leading-none font-medium text-encre-tenue">
                      {etape.date}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`grid size-[22px] flex-none place-items-center rounded-none ${
                        !etape.conforme
                          ? "bg-alerte-voile text-alerte"
                          : etape.jalon
                            ? "bg-accent-voile text-accent"
                            : "bg-neutre-voile text-encre-tenue"
                      }`}
                    >
                      <Icone nom={etape.conforme ? "coche" : "aide"} taille={12} epaisseur={2} />
                    </span>
                    {i < etapes.length - 1 && <div className="w-[1.5px] flex-1 bg-bordure" />}
                  </div>

                  <div className="flex flex-col gap-1.5 pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] leading-none font-bold text-encre">
                        {etape.titre}
                      </span>
                      {etape.jalon && <Etiquette ton="accent">Jalon</Etiquette>}
                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                        + {etape.marge}
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-[1.5] font-medium text-pretty text-encre-moyenne">
                      {etape.detail}
                    </p>
                    <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                      {etape.acteur}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </Carte>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="En un coup d'œil">
              <dl className="mt-3.5 flex flex-col gap-2.5">
                {data.resume.map((ligne) => (
                  <div
                    key={ligne.libelle}
                    className="flex items-center justify-between border-b border-separateur pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-[11.5px] leading-none font-medium text-encre-faible">
                      {ligne.libelle}
                    </dt>
                    <dd
                      className={`text-[12px] leading-none font-bold tabular-nums ${
                        ligne.ton === "succes"
                          ? "text-succes"
                          : ligne.ton === "alerte"
                            ? "text-alerte"
                            : "text-encre"
                      }`}
                    >
                      {ligne.valeur}
                    </dd>
                  </div>
                ))}
              </dl>
            </Carte>

            <Carte titre="Détenteurs successifs">
              {/* La duree de detention est ce que cherche un controleur :
                  elle designe ou le courrier a reellement attendu. */}
              <div className="mt-3.5 flex flex-col gap-3">
                {data.detenteurs.map((detenteur, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Avatar initiales={detenteur.initiales} titre={detenteur.nom} taille="petit" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                        {detenteur.nom}
                      </span>
                      <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                        {detenteur.structure}
                      </span>
                    </span>
                    <span className="flex-none text-[11px] leading-none font-bold text-encre-faible tabular-nums">
                      {detenteur.duree}
                    </span>
                  </div>
                ))}
              </div>
            </Carte>

            <Carte titre="Pièces et courriers liés">
              <div className="mt-3.5 flex flex-col gap-2">
                {data.lies.map((lie) => (
                  <Link
                    key={lie.reference}
                    to={lie.chemin}
                    className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5 transition-colors duration-150 hover:bg-surface-douce"
                  >
                    <Icone nom="document" taille={14} className="flex-none text-encre-tenue" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[10.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                        {lie.reference}
                      </span>
                      <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                        {lie.titre}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </>
  );
}
