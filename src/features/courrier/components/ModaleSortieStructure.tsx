import { useState } from "react";
import { Bouton } from "@/components/ui/Bouton";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Modale } from "@/components/ui/Modale";
import {
  LIBELLES_MOTIF_SORTIE,
  usePrononcerSortie,
  type LignePassage,
  type MotifSortie,
} from "@/features/courrier/api";
import { ErreurApi } from "@/lib/api";

/**
 * La sortie d'un courrier de la structure — le second geste du bureau d'ordre.
 *
 * **Le motif n'a pas de valeur par défaut**, et l'écran ne le pré-remplit pas :
 * une sortie sans motif se lirait « le courrier a disparu de nos écrans », alors
 * qu'un registre de bureau d'ordre existe précisément pour dire par où les
 * choses sont parties. Le serveur refuse, et le moteur aussi — la contrainte
 * `passage_sortie_motivee` tient la même règle en base.
 *
 * La note est facultative : « Autre » se précise, « Réponse transmise » se
 * suffit.
 */
const MOTIFS = (Object.keys(LIBELLES_MOTIF_SORTIE) as MotifSortie[]).map((valeur) => ({
  valeur,
  libelle: LIBELLES_MOTIF_SORTIE[valeur],
}));

export function ModaleSortieStructure({
  passage,
  onFermer,
}: {
  passage: LignePassage;
  onFermer: () => void;
}) {
  const sortir = usePrononcerSortie();

  const [motif, setMotif] = useState<MotifSortie | "">("");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const valide = motif !== "" && !sortir.isPending;

  async function valider() {
    setErreur(null);
    try {
      await sortir.mutateAsync({
        passageId: passage.id,
        motif,
        note: note.trim() || null,
      });
      onFermer();
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "La sortie n'a pas été enregistrée.");
    }
  }

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre="Sortie de la structure"
      sousTitre={`${passage.numero} · ${passage.objet}`}
      piedGauche={`Chez ${passage.structure} depuis ${passage.joursDansLaStructure} j`}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" onClick={valider} disabled={!valide}>
            {sortir.isPending ? "Enregistrement…" : "Enregistrer la sortie"}
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-[17px]">
        <Liste
          libelle="Par où le courrier sort"
          options={MOTIFS}
          invite="Choisir…"
          value={motif}
          onChange={(e) => setMotif(e.target.value as MotifSortie | "")}
          aide="Sans motif, la sortie est refusée : le registre doit dire par où les choses partent."
        />

        <Etiqueteur libelle="Précision (facultative)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Réponse signée le 24/08 et remise au bureau d'ordre central."
            className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
        </Etiqueteur>

        <Encart ton="neutre" icone="aide">
          L'entrée et la sortie sont des jalons publics : la DSR et les structures co-cotées les
          lisent, alors que le détail du traitement interne reste dans votre structure.
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
