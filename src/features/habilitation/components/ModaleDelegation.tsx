import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  delegationPossibleQuery,
  mesDelegationsQuery,
  useDeclarerDelegation,
  useInterrompreDelegation,
  type SaisieDelegation,
} from "@/features/habilitation/api";
import { formaterDate } from "@/lib/format";

/**
 * Déléguer ses propres attributions le temps d'une absence — §3.4.
 *
 * Le responsable la pose lui-même, et c'est le point : une délégation qui
 * suppose une demande à l'administrateur n'est jamais posée le vendredi soir
 * pour le lundi. Les circuits s'arrêtent alors sur un poste vide, et personne
 * ne le découvre avant le retour du titulaire.
 *
 * Ce qu'il ne peut pas faire ici : déléguer au-delà de son propre périmètre,
 * ni à quelqu'un qui ne pourrait pas recevoir l'attribution. Les deux listes
 * viennent du serveur, qui revalide de toute façon à l'enregistrement.
 *
 * Les délégations en cours sont montrées au-dessus du formulaire, avec leur
 * interruption : celui qui rentre plus tôt que prévu doit pouvoir reprendre la
 * main sans passer par personne.
 */
const TONS = { active: "succes", programmee: "accent", close: "neutre" } as const;

export function ModaleDelegation({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const { data: possible } = useQuery({ ...delegationPossibleQuery(), enabled: ouverte });
  const { data: miennes = [] } = useQuery({ ...mesDelegationsQuery(), enabled: ouverte });
  const declarer = useDeclarerDelegation();
  const interrompre = useInterrompreDelegation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaisieDelegation>();

  function fermer() {
    reset();
    declarer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    declarer.mutate({ ...valeurs, delegataireId: Number(valeurs.delegataireId) }, { onSuccess: () => reset() });
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Déléguer mes attributions"
      sousTitre="Le temps d'une absence, et pour une période bornée"
      libelleEnvoi="Poser la délégation"
      enCours={declarer.isPending}
      erreur={declarer.isError ? "La délégation n'a pas pu être enregistrée." : null}
      consequence="Le délégataire agira en votre nom, et chaque acte portera la mention de la délégation."
      largeur={640}
    >
      {miennes.length > 0 && (
        <div className="flex flex-col gap-[7px]">
          <span className="text-[11px] leading-none font-semibold text-encre-faible">
            Délégations en cours
          </span>
          <ul className="flex flex-col gap-1.5">
            {miennes.map((delegation) => (
              <li
                key={delegation.id}
                className="flex items-center gap-3 rounded-none border border-bordure bg-surface-douce px-3.5 py-2.5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[12px] leading-none font-semibold text-encre">
                    {delegation.delegataire} — {delegation.etendue}
                  </span>
                  <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                    Du {formaterDate(delegation.debut)} au {formaterDate(delegation.fin)}
                  </span>
                </span>

                <Etiquette ton={TONS[delegation.etat]}>
                  {delegation.etat === "active" ? "En vigueur" : "Programmée"}
                </Etiquette>

                <button
                  type="button"
                  onClick={() => interrompre.mutate(delegation.id)}
                  disabled={interrompre.isPending}
                  className="flex flex-none items-center gap-1.5 text-[11px] leading-none font-bold text-danger transition-colors duration-150 hover:text-danger disabled:opacity-60"
                >
                  <Icone nom="croix" taille={12} epaisseur={1.8} />
                  Interrompre
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Encart ton="alerte" icone="bouclier">
        Une délégation ne transfère pas la responsabilité : les actes posés en votre nom restent les
        vôtres. Bornez-la à la durée réelle de votre absence.
      </Encart>

      <Liste
        libelle="Déléguer à"
        invite="Choisir un agent…"
        aide="Seuls les agents de votre périmètre pouvant recevoir l'attribution sont proposés."
        options={(possible?.delegataires ?? []).map((d) => ({
          valeur: String(d.id),
          libelle: `${d.nomComplet} — ${d.poste}`,
        }))}
        erreur={errors.delegataireId?.message}
        {...register("delegataireId", { required: "Choisissez le délégataire." })}
      />

      <Liste
        libelle="Étendue de la délégation"
        invite="Choisir l'étendue…"
        aide="Ce qui est délégué, et rien d'autre. Le reste de vos attributions ne bouge pas."
        options={(possible?.etendues ?? []).map((e) => ({ valeur: e, libelle: e }))}
        erreur={errors.etendue?.message}
        {...register("etendue", { required: "Précisez ce qui est délégué." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Du"
          erreur={errors.debut?.message}
          {...register("debut", { required: "Indiquez le début de l'absence." })}
        />
        <ChampDate
          libelle="Au"
          aide="La délégation s'éteint d'elle-même à cette date."
          erreur={errors.fin?.message}
          {...register("fin", {
            required: "Indiquez la fin de l'absence.",
            validate: (valeur, saisie) =>
              !saisie.debut || valeur >= saisie.debut || "La fin ne peut pas précéder le début.",
          })}
        />
      </div>

      <ChampTexteLong
        libelle="Motif"
        placeholder="Congé annuel, mission à l'extérieur, formation…"
        aide="Il figure au registre des habilitations : c'est ce qui justifie la délégation en cas de contrôle."
        erreur={errors.motif?.message}
        {...register("motif", { required: "Le motif est obligatoire." })}
      />
    </ModaleFormulaire>
  );
}
