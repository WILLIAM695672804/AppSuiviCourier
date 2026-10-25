import { useState } from "react";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { useDemanderDelai } from "@/features/suivi/api";
import { ErreurApi } from "@/lib/api";
import { formaterDate } from "@/lib/format";

/**
 * C-01 — l'agent demande un report a son responsable.
 *
 * **A ne pas confondre avec la prolongation.** `ModaleProlongation` est le geste
 * de celui qui **accorde**, sous permission de cotation ; celle-ci est celui de
 * celui qui **demande**, et elle ne deplace aucune echeance. C'est precisement
 * ce qui manquait : l'agent sans droit de cotation n'avait aucun moyen de faire
 * savoir qu'il ne tiendrait pas le delai, sinon le telephone — sans trace, et
 * pendant que le delai courait contre lui.
 *
 * Le motif est exige comme il l'est pour la prolongation : c'est sur lui que le
 * responsable tranche, et « j'ai besoin de plus de temps » ne se tranche pas.
 */
const REPORTS = [
  { valeur: "3", libelle: "3 jours ouvrés" },
  { valeur: "5", libelle: "5 jours ouvrés" },
  { valeur: "10", libelle: "10 jours ouvrés" },
  { valeur: "15", libelle: "15 jours ouvrés" },
];

export function ModaleDemandeDelai({
  dossierId,
  numero,
  objet,
  echeance,
  ouverte,
  onFermer,
}: {
  dossierId: number;
  numero: string;
  objet: string;
  echeance: string | null;
  ouverte: boolean;
  onFermer: () => void;
}) {
  const demander = useDemanderDelai(dossierId);

  const [jours, setJours] = useState("5");
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    setErreur(null);
    try {
      await demander.mutateAsync({ joursDemandes: Number(jours), motif });
      setMotif("");
      onFermer();
    } catch (e) {
      // Le serveur sait ce que l'ecran ignore : courrier clos, sans echeance,
      // ou demande deja en attente. Trois refus qui appellent trois gestes.
      setErreur(
        e instanceof ErreurApi ? e.message : "La demande n'a pas abouti.",
      );
    }
  }

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={onFermer}
      onEnvoyer={envoyer}
      titre="Demander un délai supplémentaire"
      sousTitre={`${numero} · ${objet}`}
      libelleEnvoi="Envoyer la demande"
      consequence={
        echeance ? `Échéance actuelle : ${formaterDate(echeance)}` : undefined
      }
      enCours={demander.isPending}
      erreur={erreur}
    >
      <div className="flex flex-col gap-[17px]">
        <Liste
          libelle="Report demandé"
          options={REPORTS}
          value={jours}
          onChange={(e) => setJours(e.target.value)}
          aide="Compté en jours ouvrés à partir de l'échéance actuelle, pas d'aujourd'hui."
        />

        <Etiqueteur libelle="Motif de la demande">
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            placeholder="Les pièces techniques demandées à la DAMP ne sont pas parvenues ; le projet de réponse ne peut être arrêté sans elles."
            className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
        </Etiqueteur>

        <Encart ton="neutre" icone="aide">
          Votre responsable est prévenu et décide. Tant qu'il n'a pas répondu,
          l'échéance ne bouge pas et le délai continue de courir : la demande
          est tracée, elle n'est pas un report.
        </Encart>
      </div>
    </ModaleFormulaire>
  );
}
