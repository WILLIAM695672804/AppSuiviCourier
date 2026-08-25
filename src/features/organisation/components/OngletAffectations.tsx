import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Champ, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  affectationsQuery,
  useAffecter,
  useTerminerAffectation,
  type Affectation,
  type PosteTravail,
} from "@/features/organisation/api";
import { utilisateursQuery } from "@/features/habilitation/api";
import { usePermission } from "@/lib/contexteSession";
import { messageDErreur } from "@/lib/erreurApi";
import { formaterDate } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * F-04 — qui occupe quel poste, et depuis quand.
 *
 * L'onglet manquant : créer une structure ouvre son poste responsable **vacant**
 * ([ADR 015](../../../../../backend/docs/architecture/015-l-affectation-a-un-poste-est-datee.md)),
 * et jusqu'ici le seul moyen de le pourvoir était de créer un compte — donc de
 * ne jamais pouvoir y nommer un agent déjà en place.
 *
 * Une affectation ne se corrige pas, elle se **date**. Affecter quelqu'un sur un
 * poste déjà tenu n'écrase rien : le serveur clôt l'occupation en cours la
 * veille du nouveau début, dans la même transaction. Sur un poste qui signe,
 * une journée à deux titulaires est une journée où deux personnes ont pu signer
 * au même titre.
 *
 * **Affecter demande `ADM_HAB` en plus de `ADM_ORG`.** Non par choix d'écran :
 * l'annuaire des agents (`GET /habilitations/utilisateurs`) est servi sous
 * `ADM_HAB`, et sans lui il n'y a personne à proposer. L'administrateur de
 * l'organigramme seul lit donc l'histoire des postes sans pouvoir la modifier —
 * les deux mains sont volontairement distinctes (§3.9).
 */
export function OngletAffectations({ postes }: { postes: readonly PosteTravail[] }) {
  const voitLesAgents = usePermission(PERMISSIONS.ADM_HAB);
  const [posteId, setPosteId] = useState<number | null>(null);
  const [affecterOuvert, setAffecterOuvert] = useState(false);
  const [aClore, setAClore] = useState<Affectation | null>(null);

  const { data: affectations = [], isPending } = useQuery(affectationsQuery(posteId));
  const poste = postes.find((p) => p.id === posteId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Carte
        titre="Affectations"
        aDroite={
          voitLesAgents ? (
            <Bouton icone="plus" variante="principal" onClick={() => setAffecterOuvert(true)}>
              Affecter un agent
            </Bouton>
          ) : null
        }
      >
        <div className="mt-3.5 flex flex-col gap-3.5">
          {!voitLesAgents && (
            <Encart ton="neutre" icone="bouclier">
              Lecture seule : nommer un agent sur un poste relève de l'administrateur des
              habilitations.
            </Encart>
          )}

          <Liste
            libelle="Poste"
            invite="Tous les postes"
            aide="Sans filtre, c'est l'histoire de tout l'organigramme."
            options={postes.map((p) => ({
              valeur: String(p.id),
              libelle: `${p.structure} · ${p.libelle}`,
            }))}
            value={posteId === null ? "" : String(posteId)}
            onChange={(e) => setPosteId(e.target.value === "" ? null : Number(e.target.value))}
            className="max-w-md"
          />

          {poste && poste.titulaires < poste.postesPrevus && (
            <Encart ton="alerte" icone="aide">
              Ce poste est pourvu à {poste.titulaires} sur {poste.postesPrevus}. Tant qu'il est
              vacant, ce qui lui est coté n'a personne pour le traiter.
            </Encart>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[minmax(160px,1.3fr)_minmax(170px,1.3fr)_100px_110px_110px_minmax(140px,1fr)_92px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                {[
                  "Agent",
                  "Poste",
                  "Structure",
                  "Début",
                  "Fin",
                  "Motif",
                  "État",
                ].map((t) => (
                  <span
                    key={t}
                    className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {affectations.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[minmax(160px,1.3fr)_minmax(170px,1.3fr)_100px_110px_110px_minmax(140px,1fr)_92px] items-center gap-2.5 border-b border-separateur py-3"
                >
                  <span className="truncate text-xs leading-none font-semibold text-encre">
                    {a.agent}
                  </span>
                  <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                    {a.poste}
                  </span>
                  <span className="truncate text-[11.5px] leading-none font-medium text-encre-faible">
                    {a.structure}
                  </span>
                  <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                    {formaterDate(a.debut)}
                  </span>
                  <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                    {a.fin ? formaterDate(a.fin) : "—"}
                  </span>
                  <span className="truncate text-[11.5px] leading-none font-medium text-encre-tenue">
                    {a.motif ?? "—"}
                  </span>
                  {/* Une occupation close reste lisible : on ne supprime pas une
                      ligne qui explique qui a signé quoi. */}
                  <span className="justify-self-start">
                    {a.enCours ? (
                      voitLesAgents ? (
                        <Bouton onClick={() => setAClore(a)}>Mettre fin</Bouton>
                      ) : (
                        <Etiquette ton="accent">En cours</Etiquette>
                      )
                    ) : (
                      <Etiquette ton="neutre">Close</Etiquette>
                    )}
                  </span>
                </div>
              ))}

              {!isPending && affectations.length === 0 && (
                <p className="py-6 text-center text-[11.5px] font-medium text-encre-tenue">
                  {poste
                    ? "Personne n'a jamais occupé ce poste."
                    : "Aucune affectation enregistrée."}
                </p>
              )}
            </div>
          </div>
        </div>
      </Carte>

      {voitLesAgents && (
        <>
          <ModaleAffectation
            ouverte={affecterOuvert}
            postes={postes}
            posteInitial={posteId}
            onFermer={() => setAffecterOuvert(false)}
          />
          <ModaleFinAffectation affectation={aClore} onFermer={() => setAClore(null)} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Affecter
 * ------------------------------------------------------------------ */

/**
 * `debut` laissé vide vaut aujourd'hui, côté serveur.
 *
 * Obliger à retaper la date du jour est le meilleur moyen d'en obtenir une
 * fausse. Le champ n'est là que pour la nomination qui prend effet plus tard,
 * ou pour la régularisation d'une prise de poste déjà ancienne.
 */
function ModaleAffectation({
  ouverte,
  postes,
  posteInitial,
  onFermer,
}: {
  ouverte: boolean;
  postes: readonly PosteTravail[];
  posteInitial: number | null;
  onFermer: () => void;
}) {
  const { data: agents = [] } = useQuery({ ...utilisateursQuery("actifs"), enabled: ouverte });
  const affecter = useAffecter();

  const [utilisateurId, setUtilisateurId] = useState("");
  const [posteId, setPosteId] = useState(posteInitial === null ? "" : String(posteInitial));
  const [debut, setDebut] = useState("");
  const [motif, setMotif] = useState("");

  // Le poste filtré dans le tableau est celui qu'on veut pourvoir neuf fois sur
  // dix : la modale s'ouvre dessus, sans figer le choix.
  const [dernierPoste, setDernierPoste] = useState(posteInitial);
  if (posteInitial !== dernierPoste) {
    setDernierPoste(posteInitial);
    setPosteId(posteInitial === null ? "" : String(posteInitial));
  }

  const choisi = postes.find((p) => String(p.id) === posteId) ?? null;

  function fermer() {
    affecter.reset();
    setUtilisateurId("");
    setDebut("");
    setMotif("");
    onFermer();
  }

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={() =>
        affecter.mutate(
          {
            utilisateurId: Number(utilisateurId),
            posteId: Number(posteId),
            debut: debut === "" ? null : debut,
            motif: motif.trim() === "" ? null : motif.trim(),
          },
          { onSuccess: fermer },
        )
      }
      titre="Affecter un agent à un poste"
      sousTitre="L'affectation est datée : elle n'écrase pas l'occupation en cours, elle lui succède."
      libelleEnvoi="Affecter"
      enCours={affecter.isPending}
      erreur={affecter.error ? messageDErreur(affecter.error, "L'affectation a échoué.") : null}
      consequence={
        choisi && choisi.titulaires > 0
          ? "Le titulaire actuel verra son occupation close la veille du début saisi."
          : "L'agent prendra les attributions du poste dès la date de début."
      }
    >
      <Liste
        libelle="Agent"
        invite="Choisir un agent"
        aide="Seuls les comptes actifs sont proposés : un compte suspendu n'occupe pas un poste."
        options={agents.map((a) => ({
          valeur: String(a.id),
          libelle: `${a.nomComplet} — ${a.poste}`,
        }))}
        value={utilisateurId}
        onChange={(e) => setUtilisateurId(e.target.value)}
      />

      <Liste
        libelle="Poste"
        invite="Choisir un poste"
        options={postes.map((p) => ({
          valeur: String(p.id),
          libelle: `${p.structure} · ${p.libelle} (${p.titulaires}/${p.postesPrevus})`,
        }))}
        value={posteId}
        onChange={(e) => setPosteId(e.target.value)}
      />

      <Champ
        libelle="Début de l'affectation"
        type="date"
        aide="Vide : à compter d'aujourd'hui."
        value={debut}
        onChange={(e) => setDebut(e.target.value)}
      />

      <Champ
        libelle="Motif"
        placeholder="Nomination, mutation, intérim…"
        aide="Facultatif, mais c'est lui qu'on relira dans deux ans."
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
      />
    </ModaleFormulaire>
  );
}

/* ------------------------------------------------------------------ *
 *  Mettre fin
 * ------------------------------------------------------------------ */

/**
 * Fin d'occupation **sans suite** : départ, retraite, mise à disposition.
 *
 * Une mutation ne passe pas par ici mais par une nouvelle affectation, qui
 * enchaîne les deux lignes sans laisser le poste vacant une journée. Le motif
 * est exigé — c'est ce qui distingue un départ d'une fausse manœuvre.
 */
function ModaleFinAffectation({
  affectation,
  onFermer,
}: {
  affectation: Affectation | null;
  onFermer: () => void;
}) {
  const terminer = useTerminerAffectation();
  const [fin, setFin] = useState("");
  const [motif, setMotif] = useState("");

  function fermer() {
    terminer.reset();
    setFin("");
    setMotif("");
    onFermer();
  }

  return (
    <ModaleFormulaire
      ouverte={affectation !== null}
      onFermer={fermer}
      onEnvoyer={() => {
        if (!affectation) return;
        terminer.mutate(
          {
            affectationId: affectation.id,
            fin: fin === "" ? null : fin,
            motif: motif.trim(),
          },
          { onSuccess: fermer },
        );
      }}
      titre="Mettre fin à une affectation"
      sousTitre={
        affectation
          ? `${affectation.agent} — ${affectation.poste}, depuis le ${formaterDate(affectation.debut)}.`
          : undefined
      }
      libelleEnvoi="Mettre fin"
      enCours={terminer.isPending}
      erreur={terminer.error ? messageDErreur(terminer.error, "La clôture a échoué.") : null}
      consequence="Le poste redevient vacant : ce qui lui sera coté n'aura personne pour le traiter."
    >
      <Champ
        libelle="Date de fin"
        type="date"
        aide="Vide : à compter d'aujourd'hui."
        value={fin}
        onChange={(e) => setFin(e.target.value)}
      />
      <Champ
        libelle="Motif"
        placeholder="Départ à la retraite, fin de mise à disposition…"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
      />
    </ModaleFormulaire>
  );
}
