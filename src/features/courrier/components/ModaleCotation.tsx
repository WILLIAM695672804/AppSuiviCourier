import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { MarqueCase } from "@/components/ui/CaseACocher";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Modale } from "@/components/ui/Modale";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { useCoter } from "@/features/courrier/api";
import { ErreurApi } from "@/lib/api";
import { usePermission, useSession } from "@/lib/contexteSession";
import { agentsQuery, structuresQuery } from "@/lib/referentiel";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * A-04 — cotation d'un courrier.
 *
 * Deux regles de l'institution sont portees ici, et nulle part ailleurs :
 *
 * 1. L'ordre des structures compte. La premiere cochee est le chef de file :
 *    c'est elle qui coordonne et centralise la reponse, et c'est a elle que
 *    les relances s'adressent. L'interface le montre au lieu de le supposer.
 *
 * 2. Celui qui decide n'est pas toujours celui qui saisit. Le DG cote sur le
 *    papier, l'agent de session enregistre. Quand l'agent agit par delegation,
 *    il doit designer l'autorite : les deux noms sont conserves.
 *
 * Trois commandes ont ete retirees le 19 aout 2026, et leur absence est une
 * information :
 *
 *  - **Le mode « cascade / parallele ».** La base connait `directe` et
 *    `cascade`, qui est une question de **hauteur** — qui cote sous qui — la ou
 *    l'ecran posait une question de **simultaneite**. Les deux vocabulaires ne
 *    se recouvrent pas, et traduire aurait invente la regle (ADR 011). Le
 *    serveur deduit le niveau de la cotation parente ; le rang affiche reste
 *    l'ordre de citation, et le rang 1 le chef de file.
 *  - **« Notifier les responsables ».** La cotation notifie desormais toujours
 *    (`services._prevenir_les_cotes`). Une cotation dont personne n'est
 *    prevenu est une cotation papier.
 *  - **« Inscrire au bordereau ».** Le bordereau de transmission releve du
 *    pilier depart, qui n'existe pas.
 */
const DELAIS = [
  { valeur: "3", libelle: "3 j" },
  { valeur: "5", libelle: "5 j" },
  { valeur: "10", libelle: "10 j" },
] as const;

/**
 * Ce qu'il faut d'un courrier pour le coter : son identifiant, et de quoi le
 * nommer a l'ecran. Le registre n'a pas de `CourrierDetail` sous la main, et
 * en charger un par ligne selectionnee pour afficher un titre serait payer
 * vingt-cinq requetes pour vingt-cinq phrases.
 */
export interface CourrierACoter {
  id: number;
  numero: string;
  objet: string;
}

export function ModaleCotation({
  courriers,
  ouverte,
  onFermer,
  structureInitiale = null,
}: {
  /**
   * Un courrier, ou la selection du registre. **La meme fenetre pour les deux**
   * cas : la cotation d'un lot n'est pas un autre acte, c'est le meme acte
   * repete — meme structures, meme delai, meme instruction, une decision par
   * courrier cote serveur.
   */
  courriers: CourrierACoter[];
  ouverte: boolean;
  onFermer: () => void;
  /** Structure pre-cochee — « Enregistrer et coter » la transmet par l'URL. */
  structureInitiale?: number | null;
}) {
  const session = useSession();
  const { data: structures = [] } = useQuery(structuresQuery());
  const { data: agents = [] } = useQuery(agentsQuery());
  const coter = useCoter();

  // Cote de plein droit, ou pour le compte d'une autorite ?
  const coteEnPropre = usePermission(PERMISSIONS.COT);

  const [choisies, setChoisies] = useState<number[]>(
    structureInitiale ? [structureInitiale] : [],
  );
  const [delaiJours, setDelaiJours] = useState(5);
  const [instruction, setInstruction] = useState("");
  const [decideParId, setDecideParId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  // Les courriers que le serveur a refuses, avec sa raison. Un lot peut echouer
  // par le milieu — un courrier clos, un autre deja cote a la meme structure —
  // et « la cotation a echoue » ne dirait pas lequel.
  const [refus, setRefus] = useState<{ numero: string; message: string }[]>([]);

  function basculer(id: number) {
    // L'ordre de selection fait foi : on ajoute a la fin, on retire en place.
    setChoisies((precedentes) =>
      precedentes.includes(id) ? precedentes.filter((x) => x !== id) : [...precedentes, id],
    );
  }

  const lot = courriers.length > 1;
  const chefDeFile = structures.find((s) => s.id === choisies[0]);
  const decideurManquant = !coteEnPropre && !decideParId;
  const valide = courriers.length > 0 && choisies.length > 0 && !decideurManquant && !coter.isPending;

  async function valider() {
    setErreur(null);
    setRefus([]);

    const saisie = {
      mentionTypeId: null,
      annotation: instruction,
      // Le delai part en **jours** : la date, elle, se compte en jours ouvres,
      // et ce compte est une regle metier que le serveur seul tient.
      delaiFixe: null,
      delaiJours,
      // **L'autorite, jamais zero.** Cette ligne envoyait `0` quand l'agent
      // cotait de plein droit, et le serveur refusait la cotation : aucun
      // compte ne porte l'identifiant 0. Coter en propre, c'est se designer
      // soi-meme comme autorite.
      decideParId: coteEnPropre ? session.id : Number(decideParId),
      decideLe: new Date().toISOString(),
      structureIds: choisies,
    };

    // Une requete par courrier, **l'une apres l'autre**. Il n'existe pas de
    // route de cotation en lot, et il ne doit pas en exister une qui masquerait
    // un refus partiel : chaque cotation est une decision distincte, inscrite au
    // journal sous son propre evenement.
    const echecs: { numero: string; message: string }[] = [];
    for (const courrier of courriers) {
      try {
        await coter.mutateAsync({ courrierId: courrier.id, saisie });
      } catch (e) {
        echecs.push({
          numero: courrier.numero,
          message: e instanceof ErreurApi ? e.message : "Refus du serveur.",
        });
      }
    }

    if (echecs.length === 0) {
      onFermer();
      return;
    }
    setRefus(echecs);
    if (echecs.length === courriers.length && courriers.length === 1) {
      setErreur(echecs[0].message);
      setRefus([]);
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre={lot ? `Coter ${courriers.length} courriers` : "Coter le courrier"}
      sousTitre={
        lot
          ? courriers.map((c) => c.numero).join(", ")
          : `${courriers[0]?.numero ?? ""} · ${courriers[0]?.objet ?? ""}`
      }
      piedGauche={
        choisies.length === 0
          ? "Choisissez au moins une structure."
          : `${choisies.length} structure${choisies.length > 1 ? "s" : ""} · chef de file ${chefDeFile?.sigle ?? "—"} · délai ${delaiJours} jours`
      }
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" onClick={valider} disabled={!valide}>
            {coter.isPending
              ? "Cotation…"
              : lot
                ? `Coter les ${courriers.length} courriers`
                : "Coter le courrier"}
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-[17px]">
        {lot && (
          <Encart ton="accent" icone="document">
            La même décision est portée sur les {courriers.length} courriers sélectionnés : mêmes
            structures, même délai, même instruction. Chacun reçoit sa propre cotation, inscrite au
            journal sous son propre événement.
          </Encart>
        )}

        <div className="flex flex-col gap-[9px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-none font-semibold text-encre-faible">
              Structures destinataires
            </span>
            <span className="text-[11px] leading-none font-semibold text-encre-tenue">
              {choisies.length} sélectionnée{choisies.length > 1 ? "s" : ""}
            </span>
          </div>

          {structures.map((structure) => {
            const rang = choisies.indexOf(structure.id);
            const cochee = rang >= 0;

            return (
              <button
                key={structure.id}
                type="button"
                role="checkbox"
                aria-checked={cochee}
                aria-label={`Coter à ${structure.libelle}`}
                onClick={() => basculer(structure.id)}
                className={`flex items-center gap-[11px] rounded-none border px-3 py-[11px] text-left transition-colors duration-150 ${
                  cochee
                    ? "border-accent-trait bg-[#f8faff]"
                    : "border-bordure hover:bg-surface-douce"
                }`}
              >
                <MarqueCase cochee={cochee} />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                      {structure.libelle}
                    </span>
                    {rang === 0 && <Etiquette ton="accent">Chef de file</Etiquette>}
                  </span>
                  <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                    {[
                      structure.responsable,
                      structure.delaiMoyenJours &&
                        `délai moyen ${structure.delaiMoyenJours.toLocaleString("fr-FR")} j`,
                      `${structure.courriersEnCours} courriers en cours`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {/* Le rang est l'ordre de citation, et le rang 1 designe le chef
                    de file. Il s'affiche toujours : c'est lui qui part en base,
                    quel que soit le mode — que la base, elle, ne connait pas
                    sous ce nom (ADR 011). */}
                {cochee && (
                  <span className="grid size-5 flex-none place-items-center rounded-none bg-accent-voile text-[10px] leading-none font-bold text-accent-fonce">
                    {rang + 1}
                  </span>
                )}
              </button>
            );
          })}

          {choisies.length > 1 && (
            <Encart ton="accent" icone="personnes">
              <strong className="font-bold">{chefDeFile?.libelle}</strong> est chef de file : elle
              coordonne et centralise la réponse. Les relances lui seront adressées.
            </Encart>
          )}
        </div>

        <Etiqueteur
          libelle="Délai imparti"
          aide={`Échéance calculée en jours ouvrés : ${delaiJours} jours après la cotation.`}
        >
          <SelecteurSegments
            libelle="Délai imparti"
            options={DELAIS}
            valeur={String(delaiJours)}
            onChange={(v) => setDelaiJours(Number(v))}
          />
        </Etiqueteur>

        <Etiqueteur libelle="Instruction portée sur la cotation">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="Vérifier la conformité des pièces avant admission au paiement."
            className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
        </Etiqueteur>

        {!coteEnPropre && (
          <Liste
            libelle="Cotation décidée par"
            invite="Désigner l'autorité…"
            // **L'annuaire des agents, et non les structures.** Cette liste
            // proposait le nom du responsable mais envoyait l'identifiant de
            // sa *structure* : le serveur cherchait un compte sous ce numero et
            // en trouvait un autre, ou aucun. Un identifiant ne se lit pas, et
            // deux referentiels numerotes a partir de 1 se confondent en
            // silence (ADR 020).
            options={agents.map((agent) => ({
              valeur: String(agent.id),
              libelle: [agent.nomComplet, agent.poste, agent.structure]
                .filter(Boolean)
                .join(" — "),
            }))}
            value={decideParId}
            onChange={(e) => setDecideParId(e.target.value)}
            erreur={decideurManquant ? "La cotation engage une autorité : désignez-la." : undefined}
            aide="Vous saisissez pour le compte de cette autorité. Les deux noms sont conservés."
          />
        )}

        <Encart ton="neutre" icone="personnes">
          Les responsables des structures cotées sont prévenus dès la validation, et la personne
          désignée au suivi avec eux. Ce n'est pas une option : une cotation que nul n'apprend est
          une cotation papier.
        </Encart>

        {erreur && (
          <Encart ton="danger" icone="aide">
            {erreur}
          </Encart>
        )}

        {/* Le refus est nominatif : les autres courriers du lot, eux, sont
            cotés. Une erreur globale aurait laissé croire que rien n'est
            passé, et l'agent aurait recommencé le lot entier. */}
        {refus.length > 0 && (
          <Encart ton="danger" icone="aide">
            {courriers.length - refus.length} courrier
            {courriers.length - refus.length > 1 ? "s ont" : " a"} été coté
            {courriers.length - refus.length > 1 ? "s" : ""}.{" "}
            {refus.length === 1 ? "Un refus" : `${refus.length} refus`} :{" "}
            {refus.map((r) => `${r.numero} — ${r.message}`).join(" · ")}
          </Encart>
        )}
      </div>
    </Modale>
  );
}
