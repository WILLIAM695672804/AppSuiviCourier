import { useState } from "react";
import { Bouton } from "@/components/ui/Bouton";
import { Champ, Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Modale } from "@/components/ui/Modale";
import { useProlonger } from "@/features/courrier/api";
import { ErreurApi } from "@/lib/api";
import { formaterDate } from "@/lib/format";
import type { CourrierDetail } from "@/types/courrier";

/**
 * A-03 — report de l'echeance d'un courrier.
 *
 * **Le report part de l'echeance en vigueur, pas d'aujourd'hui.** Accorder
 * « trois jours de plus » a un courrier en retard de huit en le replacant a
 * trois jours d'aujourd'hui effacerait le retard : la prolongation deviendrait
 * un moyen d'assainir un indicateur. Le calcul est fait par le serveur — les
 * jours ouvres supposent le calendrier des feries, qui est en base.
 *
 * Le motif est exige ici comme il l'est la-bas : un report sans raison ne se
 * defend pas devant un controle, et l'echeance initiale ne survit que dans
 * l'evenement inscrit au journal.
 */
const DELAIS = [
  { valeur: "3", libelle: "3 jours ouvrés" },
  { valeur: "5", libelle: "5 jours ouvrés" },
  { valeur: "10", libelle: "10 jours ouvrés" },
  { valeur: "date", libelle: "Une date précise…" },
];

export function ModaleProlongation({
  courrier,
  ouverte,
  onFermer,
}: {
  courrier: CourrierDetail;
  ouverte: boolean;
  onFermer: () => void;
}) {
  const prolonger = useProlonger(courrier.id);

  const [choix, setChoix] = useState("5");
  const [date, setDate] = useState("");
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const surDate = choix === "date";
  const valide = motif.trim().length > 0 && (!surDate || date !== "") && !prolonger.isPending;

  async function valider() {
    setErreur(null);
    try {
      await prolonger.mutateAsync({
        nouvelleEcheance: surDate ? date : null,
        delaiJours: surDate ? null : Number(choix),
        motif,
      });
      onFermer();
      setMotif("");
      setDate("");
    } catch (e) {
      // Le serveur sait ce que l'ecran ignore : courrier clos, sans echeance,
      // ou date anterieure a l'echeance actuelle. Trois refus, trois gestes.
      setErreur(e instanceof ErreurApi ? e.message : "La prolongation n'a pas abouti.");
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre="Prolonger le délai"
      sousTitre={`${courrier.numero} · ${courrier.objet}`}
      piedGauche={`Échéance actuelle : ${formaterDate(courrier.echeance)}`}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" onClick={valider} disabled={!valide}>
            {prolonger.isPending ? "Report…" : "Prolonger"}
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-[17px]">
        {courrier.echeance === null ? (
          <Encart ton="alerte" icone="aide">
            Ce courrier n'a pas d'échéance : il n'y a rien à prolonger. Un délai se fixe en cotant.
          </Encart>
        ) : (
          <>
            <Liste
              libelle="Report accordé"
              options={DELAIS}
              value={choix}
              onChange={(e) => setChoix(e.target.value)}
              aide="Compté en jours ouvrés à partir de l'échéance actuelle, pas d'aujourd'hui."
            />

            {surDate && (
              <Champ
                libelle="Nouvelle échéance"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            )}

            <Etiqueteur libelle="Motif du report">
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Pièces complémentaires demandées à l'expéditeur le 18/08, sans réponse à ce jour."
                className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
              />
            </Etiqueteur>

            <Encart ton="neutre" icone="aide">
              Le report est inscrit au journal du courrier avec son motif, et l'échéance d'origine y
              reste lisible. Les agents affectés en sont prévenus.
            </Encart>
          </>
        )}

        {erreur && (
          <Encart ton="danger" icone="aide">
            {erreur}
          </Encart>
        )}
      </div>
    </Modale>
  );
}
