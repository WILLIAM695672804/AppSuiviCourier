import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import {
  ficheQuery,
  signalementsQuery,
  useAvancerSignalement,
  useSignalerEcart,
} from "@/features/courrier/api";
import { formaterDate } from "@/lib/format";
import { structuresQuery } from "@/lib/referentiel";

/**
 * A-12 — signalement d'un ecart.
 *
 * Le circuit du papier produit des incidents que le logiciel doit savoir
 * enregistrer : pli incomplet, mal dirige, jamais recu. Sans cet ecran,
 * l'ecart se regle par telephone et le delai continue de courir contre une
 * structure qui n'a rien recu.
 */
const TYPES = [
  { code: "PIECE_MANQUANTE", nom: "Pièce manquante", aide: "Le pli ne contient pas toutes les pièces annoncées" },
  { code: "PLI_ENDOMMAGE", nom: "Pli endommagé", aide: "Enveloppe ouverte, document déchiré ou illisible" },
  { code: "DESTINATAIRE_ERRONE", nom: "Destinataire erroné", aide: "Le courrier ne relève pas de la structure cotée" },
  { code: "PLI_NON_RECU", nom: "Pli non reçu", aide: "Inscrit au bordereau mais jamais remis" },
  { code: "DOUBLON", nom: "Doublon d'enregistrement", aide: "Le même courrier porte déjà un numéro" },
];

/** Les trois etats, dans l'ordre ou ils se succedent. Rien ne revient en arriere. */
const TONS_ETAT: Record<string, TonEtiquette> = {
  ouvert: "alerte",
  pris_en_compte: "accent",
  clos: "succes",
};

const GRAVITES = [
  { valeur: "MINEURE", libelle: "Mineure" },
  { valeur: "NOTABLE", libelle: "Notable" },
  { valeur: "BLOQUANTE", libelle: "Bloquante" },
] as const;

export function SignalementEcart() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const courrierId = Number(id);

  const { data: courrier } = useQuery(ficheQuery(courrierId));
  const { data: structures = [] } = useQuery(structuresQuery());
  const { data: recents = [] } = useQuery(signalementsQuery());
  const signaler = useSignalerEcart(courrierId);
  const avancer = useAvancerSignalement();
  //: La suite donnee, saisie ligne par ligne. Un seul champ partage aurait fait
  //: clore un ecart avec le texte tape pour un autre.
  const [suites, setSuites] = useState<Record<number, string>>({});

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [gravite, setGravite] = useState<(typeof GRAVITES)[number]["valeur"]>("NOTABLE");
  const [destinataireId, setDestinataireId] = useState("");

  const valide = type && description.trim().length >= 10 && destinataireId;

  async function transmettre() {
    await signaler.mutateAsync({
      type,
      description: description.trim(),
      gravite,
      destinataireStructureId: Number(destinataireId),
    });
    naviguer(`/courriers/${courrierId}`);
  }

  return (
    <>
      <EnTetePage
        titre="Signaler un écart"
        miettes={[
          { libelle: "Registre des arrivées", chemin: "/courriers" },
          { libelle: courrier?.numero ?? "…", chemin: `/courriers/${courrierId}` },
          { libelle: "Signalement" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Bouton onClick={() => naviguer(`/courriers/${courrierId}`)}>Annuler</Bouton>
            <Bouton
              variante="principal"
              icone="chevronDroite"
              onClick={transmettre}
              disabled={!valide || signaler.isPending}
            >
              {signaler.isPending ? "Transmission…" : "Transmettre le signalement"}
            </Bouton>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Nature de l'écart constaté">
              <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
                {TYPES.map((t) => {
                  const actif = t.code === type;
                  return (
                    <button
                      key={t.code}
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      onClick={() => setType(t.code)}
                      className={`flex flex-col gap-1.5 rounded-none border px-3 py-3 text-left transition-colors duration-150 ${
                        actif
                          ? "border-accent-trait bg-[#f8faff]"
                          : "border-bordure hover:bg-surface-douce"
                      }`}
                    >
                      <span className="text-[12.5px] leading-none font-bold text-encre">{t.nom}</span>
                      <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">
                        {t.aide}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Carte>

            <Carte
              titre="Courrier concerné"
              aDroite={
                <button
                  type="button"
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Changer
                </button>
              }
            >
              {courrier && (
                <div className="mt-3.5 flex items-center gap-3 rounded-none border border-accent-trait bg-[#f8faff] p-3">
                  <span className="grid size-8 flex-none place-items-center rounded-none bg-accent-voile-fort text-accent-fonce">
                    <Icone nom="courrier" taille={15} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[12.5px] leading-none font-bold text-encre">
                      {courrier.numero} · {courrier.objet}
                    </span>
                    <span className="truncate text-[11px] leading-none font-medium text-encre-faible">
                      {courrier.correspondant} · reçu le {formaterDate(courrier.dateReception)}
                      {courrier.structuresCotees[0] && ` · coté à ${courrier.structuresCotees[0]}`}
                    </span>
                  </span>
                </div>
              )}
            </Carte>

            <Carte titre="Description de l'écart">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez précisément ce qui a été constaté, et ce qui manque ou ne correspond pas."
                className="mt-3.5 w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Etiqueteur libelle="Gravité">
                  <SelecteurSegments
                    libelle="Gravité"
                    pleineLargeur
                    options={GRAVITES}
                    valeur={gravite}
                    onChange={setGravite}
                  />
                </Etiqueteur>

                <Liste
                  libelle="Transmis à"
                  invite="Choisir la structure…"
                  options={structures.map((s) => ({ valeur: String(s.id), libelle: s.libelle }))}
                  value={destinataireId}
                  onChange={(e) => setDestinataireId(e.target.value)}
                />
              </div>
            </Carte>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Ce que déclenche le signalement">
              <div className="mt-3.5 flex flex-col gap-2.5">
                <Encart ton="accent" icone="document">
                  Le signalement est joint à la fiche de vie du courrier et reste visible de tous les
                  intervenants.
                </Encart>

                {/* Une gravite bloquante suspend le decompte : c'est la seule
                    facon d'eviter qu'une structure soit tenue d'un retard
                    qu'elle n'a pas cause. */}
                {/*
                  Deux affirmations ont été retirées ici le 26 août 2026 : « le
                  décompte du délai est suspendu » et « le destinataire doit se
                  prononcer sous 24 heures ». Ni l'une ni l'autre n'était vraie —
                  aucun code ne suspend un délai, aucun ne compte 24 heures.
                  Un écran qui promet une règle que le serveur n'applique pas
                  vaut moins qu'un écran qui se tait.
                */}
                <Encart ton="alerte" icone="horloge">
                  Le décompte du délai de traitement se poursuit pendant l'examen du
                  signalement.
                </Encart>

                <Encart ton="succes" icone="cloche">
                  Le responsable de la structure visée est prévenu. C'est lui qui prend
                  l'écart en charge, puis le clôt en disant ce qui a été fait.
                </Encart>
              </div>
            </Carte>

            <Carte titre="Signalements récents">
              <div className="mt-3.5 flex flex-col gap-2.5">
                {recents.length === 0 && (
                  <p className="text-[12.5px] font-medium text-encre-tenue">
                    Aucun écart signalé qui vous concerne.
                  </p>
                )}
                {recents.map((ecart) => (
                  <div
                    key={ecart.id}
                    className="flex flex-col gap-1.5 rounded-none border border-bordure px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] leading-none font-bold text-encre-faible tabular-nums">
                        {ecart.reference}
                      </span>
                      <Etiquette ton={TONS_ETAT[ecart.etatCode]}>{ecart.etat}</Etiquette>
                    </div>
                    <span className="text-[11.5px] leading-none font-semibold text-encre">
                      {ecart.type}
                    </span>
                    <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">
                      {ecart.detail}
                    </span>
                    {ecart.suiteDonnee && (
                      <span className="text-[10.5px] leading-[1.4] font-medium text-succes">
                        Suite donnée : {ecart.suiteDonnee}
                      </span>
                    )}
                    {/*
                      L'avancement n'apparaît qu'à la structure visée, et le
                      serveur le dit lui-même (`peutAvancer`) : le front ne
                      rejoue pas la règle, il l'affiche.
                    */}
                    {ecart.peutAvancer && (
                      <div className="mt-1 flex flex-col gap-2">
                        {ecart.etatCode === "clos" ? null : ecart.etatCode === "ouvert" ? (
                          <Bouton
                            className="justify-center py-2"
                            onClick={() =>
                              avancer.mutate({
                                signalementId: ecart.id,
                                etat: "pris_en_compte",
                              })
                            }
                            disabled={avancer.isPending}
                          >
                            Prendre en compte
                          </Bouton>
                        ) : (
                          <>
                            <input
                              value={suites[ecart.id] ?? ""}
                              onChange={(e) =>
                                setSuites({ ...suites, [ecart.id]: e.target.value })
                              }
                              placeholder="Ce qui a été fait…"
                              className="w-full rounded-none border border-bordure-forte px-3 py-2 text-[11.5px] leading-none font-medium text-encre outline-none placeholder:text-encre-tenue focus:border-accent"
                            />
                            <Bouton
                              variante="principal"
                              className="justify-center py-2"
                              onClick={() =>
                                avancer.mutate({
                                  signalementId: ecart.id,
                                  etat: "clos",
                                  suiteDonnee: suites[ecart.id],
                                })
                              }
                              disabled={
                                avancer.isPending || !(suites[ecart.id] ?? "").trim()
                              }
                            >
                              Clore l'écart
                            </Bouton>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </>
  );
}
