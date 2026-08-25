import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Champ, Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Modale } from "@/components/ui/Modale";
import { useCorriger, type SaisieCorrection } from "@/features/courrier/api";
import { SelecteurCorrespondant } from "@/features/courrier/components/SelecteurCorrespondant";
import { ErreurApi } from "@/lib/api";
import { naturesQuery, type Correspondant } from "@/lib/referentiel";
import type { CourrierDetail } from "@/types/courrier";

/**
 * A-03 — correction d'une erreur de saisie.
 *
 * Sans ce geste, une faute a l'enregistrement est definitive : l'agent n'a que
 * le reenregistrement, qui consomme un second numero et fait deux courriers
 * d'un seul.
 *
 * **Les mentions du registre ne sont pas ici** — ni le numero, ni le registre,
 * ni le sens, ni la confidentialite, ni la date de reception. Les corriger
 * apres coup reviendrait a reecrire le cahier, ce qui lui ote sa valeur
 * probante ; le serveur les refuse de toute facon (`CHAMPS_CORRIGEABLES`).
 *
 * Seuls les champs **modifies** partent : la route est un `PATCH`, et envoyer
 * la fiche entiere aurait reinscrit des valeurs que l'agent n'a pas touchees,
 * en les datant de sa correction.
 */
export function ModaleCorrection({
  courrier,
  ouverte,
  onFermer,
}: {
  courrier: CourrierDetail;
  ouverte: boolean;
  onFermer: () => void;
}) {
  const { data: natures = [] } = useQuery(naturesQuery());
  const corriger = useCorriger(courrier.id);

  const [objet, setObjet] = useState(courrier.objet);
  const [reference, setReference] = useState(courrier.referenceExpediteur ?? "");
  const [nombrePages, setNombrePages] = useState(String(courrier.nombrePages));
  const [natureId, setNatureId] = useState("");
  const [urgent, setUrgent] = useState(courrier.priorite === "URGENTE");
  const [expediteur, setExpediteur] = useState<Correspondant | null>(null);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  // Ce que l'agent a reellement change. Comparer aux valeurs d'origine plutot
  // que tout envoyer evite d'inscrire au journal des « corrections » qui ne
  // corrigent rien : le serveur y verrait des differences vides, l'auditeur
  // une modification.
  const saisie: SaisieCorrection = {};
  if (objet !== courrier.objet) saisie.objet = objet;
  if (reference !== (courrier.referenceExpediteur ?? "")) saisie.referenceExpediteur = reference;
  if (Number(nombrePages) !== courrier.nombrePages) saisie.nombrePages = Number(nombrePages);
  if (natureId !== "") saisie.natureId = Number(natureId);
  if (urgent !== (courrier.priorite === "URGENTE")) saisie.urgent = urgent;
  if (expediteur) saisie.correspondantId = expediteur.id;

  const nombreChangements = Object.keys(saisie).length;
  const valide = nombreChangements > 0 && !corriger.isPending;

  async function valider() {
    setErreur(null);
    try {
      await corriger.mutateAsync({ ...saisie, motif });
      onFermer();
      setMotif("");
      setExpediteur(null);
      setNatureId("");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "La correction n'a pas abouti.");
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre="Corriger la saisie"
      sousTitre={`${courrier.numero} · ${courrier.objet}`}
      piedGauche={
        nombreChangements === 0
          ? "Aucune modification."
          : `${nombreChangements} champ${nombreChangements > 1 ? "s" : ""} modifié${nombreChangements > 1 ? "s" : ""}.`
      }
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" onClick={valider} disabled={!valide}>
            {corriger.isPending ? "Correction…" : "Corriger"}
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-[17px]">
        <Champ libelle="Objet" value={objet} onChange={(e) => setObjet(e.target.value)} />

        <Etiqueteur
          libelle="Expéditeur"
          aide={`Actuellement : ${courrier.correspondant}. Laisser vide pour ne pas y toucher.`}
        >
          <SelecteurCorrespondant choisi={expediteur} onChoisir={setExpediteur} />
        </Etiqueteur>

        <div className="grid grid-cols-2 gap-[17px]">
          <Liste
            libelle="Nature"
            invite={`Inchangée — ${courrier.nature}`}
            options={natures.map((nature) => ({
              valeur: String(nature.id),
              libelle: nature.libelle,
            }))}
            value={natureId}
            onChange={(e) => setNatureId(e.target.value)}
          />
          <Champ
            libelle="Référence de l'expéditeur"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 items-end gap-[17px]">
          <Champ
            libelle="Nombre de pages"
            type="number"
            min={1}
            value={nombrePages}
            onChange={(e) => setNombrePages(e.target.value)}
          />
          <label className="flex items-center gap-2 py-2 text-xs leading-none font-semibold text-encre-moyenne">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            Courrier urgent
          </label>
        </div>

        <Etiqueteur libelle="Motif de la correction">
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={2}
            placeholder="Expéditeur saisi à tort : la lettre émane de la DGD, non de la DGI."
            className="min-h-[54px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
        </Etiqueteur>

        <Encart ton="neutre" icone="aide">
          Le numéro, le registre et la date de réception ne se corrigent pas : ce sont les mentions
          du cahier. Chaque champ modifié laisse son avant et son après au journal.
        </Encart>

        {erreur && (
          <Encart ton="danger" icone="aide">
            {erreur}
          </Encart>
        )}
      </div>
    </Modale>
  );
}
