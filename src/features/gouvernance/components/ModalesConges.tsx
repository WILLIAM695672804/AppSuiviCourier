import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { SelecteurAgent } from "@/components/ui/SelecteurAgent";
import {
  useArbitrerConges,
  useOuvrirDroitConges,
  usePlanifierConges,
  type EtatConge,
} from "@/features/gouvernance/api";

/**
 * Les trois gestes du planning des congés — §3.3.
 *
 * **À ne pas confondre avec le registre de disponibilité** : celui-là
 * enregistre une absence décidée, celles-ci arbitrent des souhaits avant
 * qu'ils ne le deviennent.
 *
 * Qui planifie pour qui : le chef de structure, pour tout son sous-arbre. Le
 * serveur borne au périmètre — l'écran n'a rien à filtrer, et un agent d'une
 * autre direction se solde par un 404, jamais par une liste amputée en
 * silence.
 */
const ETATS: EtatConge[] = ["Souhaité", "Arbitré", "Validé", "Reporté"];

interface ChampsDroit {
  agentId: string;
  annee: string;
  droitsJours: string;
}

export function ModaleOuvrirDroit({
  ouverte,
  onFermer,
  annee,
}: {
  ouverte: boolean;
  onFermer: () => void;
  annee: number;
}) {
  const ouvrir = useOuvrirDroitConges();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsDroit>({
    defaultValues: { annee: String(annee), droitsJours: "30" },
  });

  function fermer() {
    reset({ annee: String(annee), droitsJours: "30" });
    ouvrir.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    ouvrir.mutate(
      {
        agentId: Number(valeurs.agentId),
        annee: Number(valeurs.annee),
        droitsJours: Number(valeurs.droitsJours),
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ouvrir un droit à congés"
      sousTitre="Le droit annuel d'un agent de votre structure"
      libelleEnvoi="Ouvrir"
      enCours={ouvrir.isPending}
      erreur={ouvrir.isError ? "Le droit n'a pas pu être ouvert." : null}
      consequence="Rouvrir un droit déjà posé le corrige, il ne le double pas."
      largeur={620}
    >
      <SelecteurAgent
        libelle="Agent"
        aide="Son poste et sa structure viennent de l'annuaire."
        erreur={errors.agentId?.message}
        {...register("agentId", { required: "Désignez l'agent concerné." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Exercice"
          type="number"
          erreur={errors.annee?.message}
          {...register("annee", { required: "Indiquez l'exercice." })}
        />
        <Champ
          libelle="Jours de droits"
          type="number"
          min={0}
          aide="Le nombre vient de la DRH : l'ancienneté et les reports sont son affaire."
          erreur={errors.droitsJours?.message}
          {...register("droitsJours", {
            required: "Indiquez le nombre de jours.",
            min: {
              value: 0,
              message: "Un droit à congés ne peut pas être négatif.",
            },
          })}
        />
      </div>
    </ModaleFormulaire>
  );
}

interface ChampsPeriode {
  du: string;
  au: string;
}

export function ModalePlanifierPeriode({
  ouverte,
  onFermer,
  droitId,
  agent,
}: {
  ouverte: boolean;
  onFermer: () => void;
  droitId: number | null;
  agent: string;
}) {
  const planifier = usePlanifierConges();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsPeriode>();

  // `useWatch` et non `watch` : voir `ModalesDecision`.
  const du = useWatch({ control, name: "du" });

  function fermer() {
    reset();
    planifier.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (droitId === null) return;
    planifier.mutate(
      { droitId, du: valeurs.du, au: valeurs.au },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Planifier une période"
      sousTitre={agent}
      libelleEnvoi="Planifier"
      enCours={planifier.isPending}
      erreur={
        planifier.isError
          ? "La période n'a pas pu être posée. Une absence est peut-être déjà prononcée sur ces dates."
          : null
      }
      consequence="La période est posée en « Souhaité » : elle attend un arbitrage."
      largeur={560}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Du"
          erreur={errors.du?.message}
          {...register("du", { required: "Indiquez le début de la période." })}
        />
        <ChampDate
          libelle="Au"
          erreur={errors.au?.message}
          {...register("au", {
            required: "Indiquez la fin de la période.",
            validate: (valeur) =>
              !du || valeur >= du || "La fin ne peut pas précéder le début.",
          })}
        />
      </div>

      <Encart ton="neutre" icone="cloche">
        Deux souhaits qui se chevauchent sont acceptés : c'est le conflit que la
        frise sert à montrer. Une absence déjà prononcée sur ces dates, elle,
        est refusée.
      </Encart>
    </ModaleFormulaire>
  );
}

interface ChampsArbitrage {
  etat: EtatConge;
  motif: string;
}

export function ModaleArbitrerPeriode({
  ouverte,
  onFermer,
  periodeId,
  periode,
}: {
  ouverte: boolean;
  onFermer: () => void;
  periodeId: number | null;
  periode: string;
}) {
  const arbitrer = useArbitrerConges();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsArbitrage>({ defaultValues: { etat: "Validé" } });

  const etat = useWatch({ control, name: "etat" });
  const reporte = etat === "Reporté";

  function fermer() {
    reset({ etat: "Validé", motif: "" });
    arbitrer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (periodeId === null) return;
    arbitrer.mutate(
      { periodeId, etat: valeurs.etat, motif: valeurs.motif || undefined },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Arbitrer la période"
      sousTitre={periode}
      libelleEnvoi="Arbitrer"
      enCours={arbitrer.isPending}
      erreur={
        arbitrer.isError ? "L'arbitrage n'a pas pu être enregistré." : null
      }
      consequence="L'arbitrage entame le solde ; un souhait, non."
      largeur={560}
    >
      <Liste
        libelle="État"
        options={ETATS.map((e) => ({ valeur: e, libelle: e }))}
        {...register("etat", { required: true })}
      />

      {/* Le motif est exigé ici et non découvert par un 409 : sans lui, l'agent
          resoumettra la même période. Même règle que le renvoi d'un plan
          d'actions. */}
      <Champ
        libelle={reporte ? "Motif du report" : "Motif (facultatif)"}
        aide={
          reporte
            ? "Sans motif, la même période sera resoumise à l'identique."
            : undefined
        }
        erreur={errors.motif?.message}
        {...register("motif", {
          validate: (valeur) =>
            !reporte ||
            (valeur ?? "").trim().length > 0 ||
            "Un report se motive.",
        })}
      />
    </ModaleFormulaire>
  );
}
