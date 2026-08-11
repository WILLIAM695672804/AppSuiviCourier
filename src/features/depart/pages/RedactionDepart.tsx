import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Champ, ChampLecture, Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { ficheQuery } from "@/features/courrier/api";
import { BlocNumerisation } from "@/features/courrier/components/BlocNumerisation";
import { useSession } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { naturesQuery, structuresQuery } from "@/lib/referentiel";

/**
 * B-01 — redaction d'un courrier depart.
 *
 * Le numero affiche est provisoire et le reste : il n'est attribue qu'a la
 * signature. Le circuit de validation se compose ici, avant soumission, parce
 * que c'est le redacteur qui sait qui doit viser — le modele de circuit ne
 * fait que proposer.
 */
const PRIORITES = [
  { valeur: "NORMALE", libelle: "Normal" },
  { valeur: "URGENTE", libelle: "Urgent" },
  { valeur: "TRES_URGENTE", libelle: "Très urgent" },
] as const;

const MODES_CIRCUIT = [
  { valeur: "CASCADE", libelle: "Cascade" },
  { valeur: "PARALLELE", libelle: "Parallèle" },
] as const;

const VISEURS = [
  { nom: "M. Diallo", initiales: "MD", role: "Rédacteur — DAF" },
  { nom: "S. Bamba", initiales: "SB", role: "Chef de service — Visa" },
  { nom: "A. Kouassi", initiales: "AK", role: "Directeur — Visa" },
  { nom: "N'Guessan Y.", initiales: "NY", role: "Signature — Directeur général" },
];

export function RedactionDepart() {
  const naviguer = useNavigate();
  const session = useSession();
  const [parametres] = useSearchParams();
  const reponseAId = Number(parametres.get("reponseA") ?? 0);

  const { data: natures = [] } = useQuery(naturesQuery());
  const { data: structures = [] } = useQuery(structuresQuery());
  const { data: courrierLie } = useQuery({
    ...ficheQuery(reponseAId),
    enabled: reponseAId > 0,
  });

  const [priorite, setPriorite] = useState<(typeof PRIORITES)[number]["valeur"]>("NORMALE");
  const [confidentiel, setConfidentiel] = useState(false);
  const [modeCircuit, setModeCircuit] = useState<"CASCADE" | "PARALLELE">("CASCADE");
  const [objet, setObjet] = useState("");
  const [corps, setCorps] = useState("");

  return (
    <>
      <EnTetePage
        titre="Projet de réponse"
        miettes={[
          { libelle: "Courriers départ", chemin: "/courriers/departs" },
          { libelle: "Nouveau courrier" },
        ]}
        mention="Enregistré automatiquement"
        actions={
          <div className="flex items-center gap-2">
            <Etiquette ton="neutre">Brouillon</Etiquette>
            <Bouton icone="document">Aperçu</Bouton>
            <Bouton onClick={() => naviguer("/courriers/departs")}>Enregistrer</Bouton>
            <Bouton variante="principal" icone="chevronDroite" disabled={!objet.trim()}>
              Soumettre au visa
            </Bouton>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Identification">
              <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
                <ChampLecture
                  libelle="N° d'enregistrement"
                  valeur="D-2026-0187 · attribué à la signature"
                />
                <ChampLecture libelle="Session" valeur="Départ" />
                <Liste
                  libelle="Nature"
                  invite="Choisir…"
                  options={natures.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
                />
                <Liste
                  libelle="Structure émettrice"
                  invite="Choisir…"
                  options={structures.map((s) => ({ valeur: String(s.id), libelle: s.sigle }))}
                />
              </div>

              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                <Etiqueteur libelle="Priorité">
                  <SelecteurSegments
                    libelle="Priorité"
                    pleineLargeur
                    options={PRIORITES}
                    valeur={priorite}
                    onChange={setPriorite}
                  />
                </Etiqueteur>

                <Etiqueteur libelle="Confidentialité">
                  <div className="py-2.5">
                    <CaseLibellee
                      cochee={confidentiel}
                      onChange={setConfidentiel}
                      libelle="Courrier confidentiel"
                    />
                  </div>
                </Etiqueteur>
              </div>

              {/* Le lien au courrier arrive n'est pas decoratif : c'est lui qui
                  permettra de cloturer l'arrivee quand la reponse partira. */}
              {courrierLie && (
                <div className="mt-3.5">
                  <Etiqueteur libelle="Courrier arrivé lié">
                    <div className="flex items-center gap-2.5 rounded-none border border-accent-trait bg-[#f8faff] px-3 py-2.5">
                      <Icone nom="courrier" taille={14} className="flex-none text-accent" />
                      <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
                        {courrierLie.numero}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                        {courrierLie.objet}
                      </span>
                    </div>
                  </Etiqueteur>
                </div>
              )}
            </Carte>

            <Carte
              titre="Destinataires"
              aDroite={
                <button
                  type="button"
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Choisir dans le référentiel
                </button>
              }
            >
              <div className="mt-3.5 flex flex-col gap-2.5">
                <Etiqueteur libelle="Destinataire principal">
                  <div className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5">
                    <Avatar initiales="TP" taille="petit" />
                    <span className="text-[12px] leading-none font-semibold text-encre">
                      {courrierLie?.correspondant ?? "Trésor public — Direction régionale"}
                    </span>
                  </div>
                </Etiqueteur>

                <Etiqueteur libelle="Copies">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiquette ton="neutre">DCG</Etiquette>
                    <button
                      type="button"
                      className="rounded-none border border-dashed border-bordure-champ px-2.5 py-1.5 text-[11px] leading-none font-semibold text-encre-faible hover:bg-surface-douce"
                    >
                      Ajouter une copie…
                    </button>
                  </div>
                </Etiqueteur>
              </div>
            </Carte>

            <Carte
              titre="Objet et corps du courrier"
              aDroite={
                <button
                  type="button"
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Insérer un modèle
                </button>
              }
            >
              <div className="mt-3.5 flex flex-col gap-3.5">
                <Champ
                  libelle="Objet"
                  value={objet}
                  onChange={(e) => setObjet(e.target.value)}
                  placeholder="Règlement de la facture n° 214 du prestataire de maintenance"
                />

                <Etiqueteur libelle="Corps" aide={`${corps.length} caractères`}>
                  <textarea
                    value={corps}
                    onChange={(e) => setCorps(e.target.value)}
                    rows={10}
                    placeholder="Monsieur le Directeur régional,"
                    className="w-full resize-y rounded-none border border-bordure-forte px-3.5 py-3 text-xs leading-[1.7] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
                  />
                </Etiqueteur>
              </div>
            </Carte>

            <BlocNumerisation pages={[]} />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Circuit de validation">
              <div className="mt-3.5 flex flex-col gap-3">
                <SelecteurSegments
                  libelle="Mode du circuit"
                  pleineLargeur
                  options={MODES_CIRCUIT}
                  valeur={modeCircuit}
                  onChange={setModeCircuit}
                />

                <ol className="flex flex-col">
                  {VISEURS.map((viseur, i) => (
                    <li key={viseur.nom} className="grid grid-cols-[30px_minmax(0,1fr)] gap-2.5">
                      <div className="flex flex-col items-center gap-1">
                        <Avatar initiales={viseur.initiales} taille="petit" />
                        {i < VISEURS.length - 1 && <div className="w-[1.5px] flex-1 bg-bordure" />}
                      </div>
                      <div className="flex flex-col gap-1 pb-3.5">
                        <span className="text-[11.5px] leading-none font-bold text-encre">
                          {viseur.nom}
                        </span>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          {viseur.role}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>

                <Bouton icone="personneAjout" className="w-full justify-center">
                  Ajouter un visa
                </Bouton>
              </div>
            </Carte>

            <Carte titre="Échéance et transmission">
              <div className="mt-3.5 flex flex-col gap-3.5">
                <Champ libelle="Date limite de départ" type="date" />
                <Liste
                  libelle="Mode de transmission"
                  options={[
                    { valeur: "COURSIER", libelle: "Coursier — bordereau" },
                    { valeur: "POSTE", libelle: "Voie postale" },
                    { valeur: "MAIN", libelle: "Remise en main propre" },
                  ]}
                />
              </div>
            </Carte>

            {confidentiel && (
              <Carte>
                <Encart ton="confidentiel" icone="bouclier">
                  Ce courrier départ sera exclu des restitutions destinées à la DSR et son objet
                  restera masqué hors du circuit désigné.
                </Encart>
              </Carte>
            )}

            <Carte titre="Rédaction">
              <div className="mt-3.5 flex flex-col gap-2 text-[11.5px] leading-[1.5] font-medium text-encre-faible">
                <span>
                  Rédacteur : <strong className="font-bold text-encre">{session.nomComplet}</strong>
                </span>
                <span>Ouvert le {formaterDate(new Date().toISOString())}</span>
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </>
  );
}
