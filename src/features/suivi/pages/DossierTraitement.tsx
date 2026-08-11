import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { MarqueCase } from "@/components/ui/CaseACocher";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { JaugeDelai } from "@/features/courrier/components/JaugeDelai";
import { dossierQuery, useAjouterNote, useBasculerTache } from "@/features/suivi/api";
import { formaterDate, formaterDateHeure } from "@/lib/format";

/**
 * C-01 — poste de traitement de l'agent.
 *
 * Le meme courrier, vu du cote de celui qui doit le traiter. L'ecran repond a
 * trois questions dans cet ordre : qu'est-ce qu'on me demande, ou en suis-je,
 * combien de temps me reste-t-il. Tout le reste est secondaire et passe a
 * droite ou derriere « la fiche complete ».
 */
export function DossierTraitement() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const dossierId = Number(id);

  const { data, isPending, isError, error } = useQuery(dossierQuery(dossierId));
  const basculer = useBasculerTache(dossierId);
  const ajouterNote = useAjouterNote(dossierId);
  const [note, setNote] = useState("");

  if (isPending) {
    return <p className="px-[26px] py-10 text-[13px] text-encre-tenue">Chargement du dossier…</p>;
  }

  if (isError || !data) {
    return (
      <p className="px-[26px] py-10 text-[13px] text-danger">
        {error instanceof Error ? error.message : "Dossier introuvable."}
      </p>
    );
  }

  const { courrier, instruction, taches, notes, autresDossiers } = data;
  const faites = taches.filter((t) => t.faite).length;

  function publierNote() {
    const propre = note.trim();
    if (!propre) return;
    ajouterNote.mutate({ texte: propre, privee: true });
    setNote("");
  }

  return (
    <>
      <EnTetePage
        titre={courrier.objet}
        miettes={[{ libelle: "Mes dossiers", chemin: "/suivi" }, { libelle: courrier.numero }]}
        actions={
          <div className="flex items-center gap-2">
            <Etiquette ton="accent">Affecté à moi</Etiquette>
            <span className="mx-1 h-5 w-px bg-bordure" />
            {data.actionsPossibles.includes("demanderDelai") && (
              <Bouton icone="horloge">Demander un délai</Bouton>
            )}
            <Bouton onClick={() => naviguer(`/courriers/${courrier.id}`)}>
              Voir la fiche complète
            </Bouton>
            {data.actionsPossibles.includes("traiter") && (
              <Bouton variante="principal" icone="coche">
                Soumettre un projet de réponse
              </Bouton>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Carte
              titre="Ce qui m'est demandé"
              aDroite={
                <span className="rounded-none bg-[#fef4e6] px-2 py-[5px] text-[11px] leading-none font-bold text-alerte">
                  À rendre avant le {formaterDate(data.echeance)}
                </span>
              }
            >
              {instruction ? (
                <div className="mt-4 flex gap-[11px]">
                  <Avatar initiales={instruction.initiales} titre={instruction.auteur} />
                  <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs leading-none font-bold text-encre">
                        {instruction.auteur}
                      </span>
                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                        {instruction.fonction} · {formaterDateHeure(instruction.horodatage)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-[1.6] font-medium text-pretty text-encre-moyenne">
                      {instruction.texte}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] font-medium text-encre-tenue">
                  Aucune instruction particulière n'accompagne ce dossier.
                </p>
              )}
            </Carte>

            <Carte
              titre="Étapes de mon traitement"
              aDroite={
                <span className="text-[11px] leading-none font-medium text-encre-tenue">
                  {faites} sur {taches.length}
                </span>
              }
            >
              {/* Ces etapes ne sont pas le circuit du courrier : ce sont les
                  taches que l'agent se donne. Elles n'engagent que lui. */}
              <ul className="mt-3.5 flex flex-col">
                {taches.map((tache) => (
                  <li key={tache.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={tache.faite}
                      onClick={() => basculer.mutate({ tacheId: tache.id, faite: !tache.faite })}
                      className="flex w-full items-center gap-2.5 border-b border-separateur py-2.5 text-left last:border-b-0 hover:bg-surface-douce"
                    >
                      <MarqueCase cochee={tache.faite} />
                      <span
                        className={`flex-1 text-xs leading-none font-semibold ${
                          tache.faite ? "text-encre-tenue line-through" : "text-encre-douce"
                        }`}
                      >
                        {tache.libelle}
                      </span>
                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                        {tache.faiteLe ? formaterDate(tache.faiteLe) : "à faire"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Carte>

            <Carte
              titre="Mes notes de traitement"
              aDroite={
                <span className="text-[11px] leading-none font-medium text-encre-tenue">
                  Note privée · visible par ma hiérarchie
                </span>
              }
            >
              <div className="mt-3.5 flex flex-col gap-3">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-none border border-bordure px-3 py-2.5">
                    <p className="text-xs leading-[1.6] font-medium text-encre-moyenne">{n.texte}</p>
                    <span className="mt-1.5 block text-[10.5px] leading-none font-medium text-encre-tenue">
                      {formaterDateHeure(n.horodatage)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && publierNote()}
                    placeholder="Ajouter une note…"
                    className="min-w-0 flex-1 rounded-none border border-bordure-forte px-3 py-2.5 text-xs leading-none font-medium text-encre outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
                  />
                  <Bouton variante="doux" onClick={publierNote} disabled={!note.trim()}>
                    Ajouter
                  </Bouton>
                </div>
              </div>
            </Carte>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Temps restant">
              <div className="mt-3 flex flex-col gap-2.5">
                <JaugeDelai delai={data.delai} />
                <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  Délai imparti de {data.delai?.joursAlloues ?? 0} jours à compter de la cotation.
                </p>
              </div>
            </Carte>

            <Carte
              titre="Le courrier"
              aDroite={
                <Link
                  to={`/courriers/${courrier.id}`}
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Ouvrir
                </Link>
              }
            >
              <div className="mt-3 flex flex-col gap-1.5 rounded-none border border-bordure bg-neutre-voile p-3">
                <span className="text-[11.5px] leading-none font-semibold text-encre tabular-nums">
                  {courrier.numero}
                </span>
                <span className="text-[11px] leading-[1.4] font-medium text-encre-faible">
                  {courrier.correspondant} · {courrier.nature}
                </span>
              </div>
            </Carte>

            <Carte titre="Mes autres dossiers">
              <div className="mt-3 flex flex-col gap-2">
                {autresDossiers.map((autre) => (
                  <Link
                    key={autre.id}
                    to={`/suivi/${autre.id}`}
                    className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5 transition-colors duration-150 hover:bg-surface-douce"
                  >
                    <Icone nom="courrier" taille={14} className="flex-none text-encre-tenue" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[10.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                        {autre.numero}
                      </span>
                      <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                        {autre.objet}
                      </span>
                    </span>
                    <span
                      className={`flex-none text-[10.5px] leading-none font-bold tabular-nums ${
                        (autre.delai?.joursDepassement ?? 0) > 0 ? "text-danger" : "text-encre-faible"
                      }`}
                    >
                      {(autre.delai?.joursDepassement ?? 0) > 0
                        ? `+ ${autre.delai?.joursDepassement} j`
                        : `${(autre.delai?.joursAlloues ?? 0) - (autre.delai?.joursEcoules ?? 0)} j`}
                    </span>
                  </Link>
                ))}

                {autresDossiers.length === 0 && (
                  <p className="text-[11.5px] font-medium text-encre-tenue">
                    Vous n'avez pas d'autre dossier en cours.
                  </p>
                )}
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </>
  );
}
