import { useState } from "react";
import { useForm } from "react-hook-form";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Champ } from "@/components/ui/Champ";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  useModifierRegleMetier,
  useTrancherRegleMetier,
  type RegleMetier,
} from "@/features/parametrage/api";
import { messageDErreur } from "@/lib/erreurApi";

/**
 * H-07 — les règles de gestion, et l'arbitrage des hypothèses.
 *
 * **C'est la sortie des questions ouvertes.** Une partie des règles que le
 * système applique n'a jamais été tranchée par le métier : la conception les a
 * inventées pour que le logiciel fonctionne, et les a marquées comme telles.
 * Jusqu'ici, y répondre demandait un `UPDATE` en SQL — c'est-à-dire de passer
 * par le développement, sans trace de qui avait décidé ni sur quel document.
 *
 * L'écran est construit autour de cette distinction, et pas autour de la valeur.
 * Un tableau qui aurait montré « 30 jours » sans dire que personne n'a validé
 * ces trente jours aurait transformé une invention en règle de l'institution le
 * jour où quelqu'un l'aurait lue.
 *
 * D'où : les hypothèses en tête, une bande d'alerte qui les compte, le nom de
 * qui doit trancher affiché en clair, et un bouton « Trancher » qui exige la
 * référence de la décision.
 */
const ENTETE = "text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase";

const GRILLE =
  "grid grid-cols-[minmax(0,1.9fr)_120px_minmax(120px,.9fr)_minmax(0,1.1fr)_96px] items-center gap-3";

export function OngletReglesMetier({
  regles,
  recherche,
}: {
  regles: RegleMetier[];
  recherche: string;
}) {
  const [aModifier, setAModifier] = useState<RegleMetier | null>(null);
  const [aTrancher, setATrancher] = useState<RegleMetier | null>(null);

  const visibles = regles.filter(
    (regle) =>
      regle.libelle.toLowerCase().includes(recherche) ||
      // La clé aussi : c'est par elle que le code désigne la règle, et c'est
      // souvent elle qu'un ticket cite.
      regle.cle.toLowerCase().includes(recherche),
  );

  const hypotheses = regles.filter((regle) => regle.estHypothese).length;

  return (
    <>
      <Carte titre="Règles de gestion">
        {hypotheses > 0 ? (
          <Encart ton="alerte" icone="aide">
            {hypotheses} règle{hypotheses > 1 ? "s" : ""} sur {regles.length}{" "}
            {hypotheses > 1 ? "sont des hypothèses" : "est une hypothèse"} : le système les applique
            aujourd'hui, mais personne ne les a validées. Trancher une hypothèse suppose de citer la
            décision — note, compte rendu de réunion, article du règlement intérieur.
          </Encart>
        ) : (
          <Encart ton="succes" icone="coche">
            Toutes les règles sont arbitrées et portent leur source. Aucune valeur du système ne
            repose plus sur une supposition de la conception.
          </Encart>
        )}

        <div className="mt-3.5 overflow-x-auto">
          <div className="min-w-[860px]">
            <div className={`${GRILLE} border-y border-bordure bg-surface-tete py-2.5`}>
              {["Règle", "Valeur", "Statut", "Source ou arbitre", ""].map((t, i) => (
                <span key={t || i} className={ENTETE}>
                  {t}
                </span>
              ))}
            </div>

            {visibles.map((regle) => (
              <div key={regle.cle} className={`${GRILLE} border-b border-separateur py-3`}>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                    {regle.libelle}
                  </span>
                  <span className="truncate font-mono text-[10.5px] leading-none text-encre-tenue">
                    {regle.cle}
                  </span>
                </span>

                <span className="truncate text-[12px] leading-none font-bold text-encre tabular-nums">
                  {afficher(regle)}
                </span>

                <span>
                  <Etiquette ton={regle.estHypothese ? "alerte" : "succes"}>
                    {regle.estHypothese ? "hypothèse" : "acté"}
                  </Etiquette>
                </span>

                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {regle.estHypothese ? (
                    regle.aTrancherPar ? (
                      <>À trancher par {regle.aTrancherPar}</>
                    ) : (
                      "Personne n'est désigné pour trancher"
                    )
                  ) : (
                    (regle.source ?? "—")
                  )}
                </span>

                <span className="flex justify-end gap-1.5">
                  {regle.estHypothese ? (
                    <Bouton variante="doux" onClick={() => setATrancher(regle)}>
                      Trancher
                    </Bouton>
                  ) : (
                    <Bouton variante="doux" icone="reglages" onClick={() => setAModifier(regle)}>
                      Modifier
                    </Bouton>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
          Une valeur modifiée s'applique immédiatement, à tous les écrans et à tous les calculs en
          cours. Chaque changement est inscrit au journal avec son auteur et sa source.
        </p>
      </Carte>

      {aModifier && <ModaleModifierRegle regle={aModifier} onFermer={() => setAModifier(null)} />}
      {aTrancher && <ModaleTrancherRegle regle={aTrancher} onFermer={() => setATrancher(null)} />}
    </>
  );
}

/**
 * La valeur, lisible.
 *
 * `true` et `false` sont ce que la base stocke ; « Oui » et « Non » sont ce
 * qu'un administrateur fonctionnel lit. Une valeur vide s'affiche « non
 * renseignée » plutôt que par un blanc, qu'on prendrait pour un défaut
 * d'affichage.
 */
function afficher(regle: RegleMetier): string {
  if (regle.typeValeur === "booleen") return regle.valeur === "true" ? "Oui" : "Non";
  if (regle.valeur === "") return "non renseignée";
  return regle.valeur;
}

interface ChampsModification {
  valeur: string;
  source: string;
}

function ModaleModifierRegle({ regle, onFermer }: { regle: RegleMetier; onFermer: () => void }) {
  const modifier = useModifierRegleMetier(regle.cle);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChampsModification>({
    defaultValues: { valeur: regle.valeur, source: "" },
  });

  const envoyer = handleSubmit((valeurs) => {
    modifier.mutate(valeurs, { onSuccess: onFermer });
  });

  return (
    <ModaleFormulaire
      ouverte
      onFermer={onFermer}
      onEnvoyer={envoyer}
      titre="Modifier une règle arbitrée"
      sousTitre={regle.libelle}
      libelleEnvoi="Enregistrer la nouvelle valeur"
      enCours={modifier.isPending}
      erreur={
        modifier.isError
          ? messageDErreur(modifier.error, "La règle n'a pas pu être modifiée.")
          : null
      }
      consequence="La nouvelle valeur s'applique immédiatement, partout."
      largeur={600}
    >
      <Encart ton="alerte" icone="aide">
        Cette règle a été arbitrée : {regle.source}. La changer suppose une nouvelle décision, et
        c'est elle qu'il faut citer — sans quoi la règle redevient une supposition tout en gardant
        l'étiquette d'un arbitrage.
      </Encart>

      <Champ
        libelle="Nouvelle valeur"
        aide={aideDeType(regle)}
        erreur={errors.valeur?.message}
        {...register("valeur", {
          required: "Une règle ne peut pas être vide.",
        })}
      />

      <ChampTexteLong
        libelle="Décision qui la change"
        placeholder="Avenant n°2 au contrat d'infogérance, 14 août 2026"
        aide="La référence du document, pas un commentaire. C'est ce qui restera au journal quand le papier se sera perdu."
        erreur={errors.source?.message}
        {...register("source", {
          required: "Citez la décision qui change cette règle.",
        })}
      />
    </ModaleFormulaire>
  );
}

interface ChampsArbitrage {
  valeur: string;
  source: string;
}

function ModaleTrancherRegle({ regle, onFermer }: { regle: RegleMetier; onFermer: () => void }) {
  const trancher = useTrancherRegleMetier(regle.cle);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChampsArbitrage>({
    defaultValues: { valeur: regle.valeur, source: "" },
  });

  const envoyer = handleSubmit((valeurs) => {
    trancher.mutate(valeurs, { onSuccess: onFermer });
  });

  return (
    <ModaleFormulaire
      ouverte
      onFermer={onFermer}
      onEnvoyer={envoyer}
      titre="Trancher une hypothèse"
      sousTitre={regle.libelle}
      libelleEnvoi="Enregistrer l'arbitrage"
      enCours={trancher.isPending}
      erreur={
        trancher.isError
          ? messageDErreur(trancher.error, "L'arbitrage n'a pas pu être enregistré.")
          : null
      }
      consequence="La règle cesse d'être une hypothèse. Elle ne se retranchera pas."
      largeur={600}
    >
      <Encart ton="alerte" icone="aide">
        La valeur actuelle — {afficher(regle)} — a été posée par la conception, faute de réponse.
        {regle.aTrancherPar ? ` Elle revient à ${regle.aTrancherPar}.` : ""} Confirmez-la ou
        corrigez-la, puis citez la décision : c'est elle, et non le statut affiché, qui distingue
        une règle de l'institution d'une supposition.
      </Encart>

      <Champ
        libelle="Valeur retenue"
        aide={`${aideDeType(regle)} Laissez la valeur en place si le métier la confirme telle quelle.`}
        erreur={errors.valeur?.message}
        {...register("valeur", {
          required: "Une règle ne peut pas être vide.",
        })}
      />

      <ChampTexteLong
        libelle="Référence de la décision"
        placeholder="Note DG n°412 du 3 septembre 2026"
        aide="Obligatoire. Sans document cité, l'arbitrage ne fait que remplacer une invention par une autre."
        erreur={errors.source?.message}
        {...register("source", {
          required: "Sans référence, ce n'est pas un arbitrage.",
        })}
      />
    </ModaleFormulaire>
  );
}

/**
 * Ce que le champ attend, dit avant la saisie.
 *
 * Le serveur refuse une valeur qu'il ne saurait pas relire, mais un refus après
 * coup fait retaper ; l'annoncer coûte une ligne.
 */
function aideDeType(regle: RegleMetier): string {
  if (regle.typeValeur === "entier") return "Un nombre entier, sans unité ni espace.";
  if (regle.typeValeur === "decimal") return "Un nombre, le séparateur décimal étant le point.";
  if (regle.typeValeur === "booleen") return "true ou false.";
  return "Texte libre.";
}
