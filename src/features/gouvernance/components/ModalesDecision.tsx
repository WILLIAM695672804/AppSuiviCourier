import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { SelecteurStructure } from "@/components/ui/SelecteurStructure";
import {
  useConsignerAvancement,
  useCreerDecision,
  useRelancer,
  type DecisionDetail,
  type Instance,
} from "@/features/gouvernance/api";

/**
 * Les trois modales du registre des décisions.
 *
 * Elles partagent un fichier parce qu'elles partagent un objet : créer une
 * décision, déclarer son avancement, relancer la structure qui la porte sont
 * trois moments d'une même vie. Les séparer aurait multiplié les imports sans
 * rien clarifier.
 *
 * La validation est déclarée au fil des champs plutôt que dans un schéma zod
 * à part. Les schémas séparés (`schemaEnregistrement.ts`, `schemaConnexion.ts`)
 * servent des formulaires d'écran, longs et réutilisés ; pour quatre champs
 * dans une modale, un fichier de plus par formulaire coûterait plus qu'il
 * n'apporte.
 */
const INSTANCES: Instance[] = [
  "Conseil d'administration",
  "CODIR",
  "Directeur général",
  "Assemblée générale",
];

interface ChampsDecision {
  instance: Instance;
  seance: string;
  objet: string;
  contexte: string;
  dateDecision: string;
  echeance: string;
}

export function ModaleNouvelleDecision({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const [structures, setStructures] = useState<number[]>([]);
  const [erreurStructures, setErreurStructures] = useState<string>();
  const creer = useCreerDecision();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsDecision>({
    defaultValues: {
      instance: "Directeur général",
      dateDecision: new Date().toISOString().slice(0, 10),
    },
  });

  function fermer() {
    reset();
    setStructures([]);
    setErreurStructures(undefined);
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (structures.length === 0) {
      setErreurStructures("Désignez au moins une structure chargée de l'exécution.");
      return;
    }
    setErreurStructures(undefined);

    creer.mutate(
      {
        instance: valeurs.instance,
        seance: valeurs.seance,
        objet: valeurs.objet,
        contexte: valeurs.contexte,
        dateDecision: valeurs.dateDecision,
        echeance: valeurs.echeance || null,
        structures,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Enregistrer une décision"
      sousTitre="Une décision d'instance engage les structures désignées jusqu'à son exécution complète."
      libelleEnvoi="Enregistrer la décision"
      enCours={creer.isPending}
      erreur={creer.isError ? "La décision n'a pas pu être enregistrée." : null}
      consequence="La référence sera attribuée automatiquement à l'enregistrement."
      largeur={680}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Liste
          libelle="Instance"
          options={INSTANCES.map((i) => ({ valeur: i, libelle: i }))}
          erreur={errors.instance?.message}
          {...register("instance", { required: "Choisissez l'instance." })}
        />
        <Champ
          libelle="Séance d'origine"
          placeholder="CODIR du 12 août 2026"
          erreur={errors.seance?.message}
          {...register("seance", { required: "Indiquez la séance ou l'instruction d'origine." })}
        />
      </div>

      <Champ
        libelle="Objet de la décision"
        placeholder="Ce qui a été décidé, en une phrase"
        erreur={errors.objet?.message}
        {...register("objet", {
          required: "L'objet est obligatoire.",
          minLength: { value: 12, message: "Soyez plus explicite : douze caractères au minimum." },
        })}
      />

      <ChampTexteLong
        libelle="Contexte"
        placeholder="Ce qui a motivé la décision, et ce qui est attendu."
        aide="Ce texte figure en tête de la fiche de suivi. Il sert à qui reprendra le dossier dans six mois."
        erreur={errors.contexte?.message}
        {...register("contexte", { required: "Le contexte est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Prise le"
          erreur={errors.dateDecision?.message}
          {...register("dateDecision", { required: "Indiquez la date de la décision." })}
        />
        <ChampDate
          libelle="Échéance d'exécution"
          aide="Laissez vide si aucune échéance n'a été fixée."
          {...register("echeance")}
        />
      </div>

      <SelecteurStructure choisies={structures} onChange={setStructures} erreur={erreurStructures} />
    </ModaleFormulaire>
  );
}

interface ChampsAvancement {
  avancement: number;
  observation: string;
}

export function ModaleAvancement({
  ouverte,
  onFermer,
  decision,
}: {
  ouverte: boolean;
  onFermer: () => void;
  decision: DecisionDetail;
}) {
  const [jalons, setJalons] = useState<number[]>(
    decision.jalons.filter((j) => j.fait).map((j) => j.id),
  );
  const consigner = useConsignerAvancement();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsAvancement>({
    defaultValues: { avancement: decision.avancement },
  });

  // `useWatch` et non `watch` : le compilateur React ne sait pas memoiser la
  // fonction rendue par `watch`, et renonce alors a optimiser tout le composant.
  const avancement = useWatch({ control, name: "avancement" });

  function fermer() {
    reset();
    consigner.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    consigner.mutate(
      {
        decisionId: decision.id,
        avancement: Number(valeurs.avancement),
        observation: valeurs.observation,
        jalonsFaits: jalons,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Consigner un avancement"
      sousTitre={decision.reference}
      libelleEnvoi="Consigner"
      enCours={consigner.isPending}
      erreur={consigner.isError ? "L'avancement n'a pas pu être consigné." : null}
      consequence="L'observation est ajoutée au fil de suivi et reste consultable."
    >
      <Champ
        libelle="Avancement déclaré (%)"
        type="number"
        min={0}
        max={100}
        erreur={errors.avancement?.message}
        {...register("avancement", {
          required: "Indiquez l'avancement.",
          min: { value: 0, message: "L'avancement ne peut pas être négatif." },
          max: { value: 100, message: "L'avancement ne dépasse pas 100 %." },
        })}
      />

      {Number(avancement) < decision.avancement && (
        <Encart ton="alerte" icone="horloge">
          L'avancement déclaré est inférieur au précédent ({decision.avancement} %). Une régression
          est possible, mais elle mérite d'être expliquée dans l'observation.
        </Encart>
      )}

      {decision.jalons.length > 0 && (
        <div className="flex flex-col gap-[7px]">
          <span className="text-[11px] leading-none font-semibold text-encre-faible">
            Jalons réalisés
          </span>
          <div className="flex flex-col rounded-none border border-bordure-forte">
            {decision.jalons.map((jalon, index) => (
              <label
                key={jalon.id}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 ${
                  index > 0 ? "border-t border-separateur" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={jalons.includes(jalon.id)}
                  onChange={() =>
                    setJalons((actuels) =>
                      actuels.includes(jalon.id)
                        ? actuels.filter((i) => i !== jalon.id)
                        : [...actuels, jalon.id],
                    )
                  }
                  className="size-4 flex-none accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {jalon.libelle}
                </span>
                <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue">
                  {jalon.structure}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <ChampTexteLong
        libelle="Observation"
        placeholder="Ce qui a avancé, ce qui bloque."
        erreur={errors.observation?.message}
        {...register("observation", { required: "Une observation est obligatoire." })}
      />
    </ModaleFormulaire>
  );
}

export function ModaleRelance({
  ouverte,
  onFermer,
  decision,
}: {
  ouverte: boolean;
  onFermer: () => void;
  decision: DecisionDetail;
}) {
  const relancer = useRelancer();
  const pilote = decision.structures.find((s) => s.pilote);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ motif: string }>();

  function fermer() {
    reset();
    relancer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    relancer.mutate(
      { decisionId: decision.id, motif: valeurs.motif, structureId: pilote?.id ?? null },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Relancer"
      sousTitre={decision.reference}
      libelleEnvoi="Envoyer la relance"
      enCours={relancer.isPending}
      erreur={relancer.isError ? "La relance n'a pas pu être envoyée." : null}
      consequence="La relance est inscrite au fil de suivi et compte au registre."
      largeur={560}
    >
      <Encart ton="accent" icone="personnes">
        La relance est adressée à <strong>{pilote?.libelle ?? "la structure chargée"}</strong>,
        structure pilote de cette décision. C'est elle qui rend compte pour l'ensemble.
      </Encart>

      {decision.relances >= 2 && (
        <Encart ton="danger" icone="cloche">
          Cette décision a déjà fait l'objet de {decision.relances} relances. Au-delà de trois, la
          grille de cotation prévoit une inscription à l'ordre du jour du comité de direction.
        </Encart>
      )}

      <ChampTexteLong
        libelle="Motif de la relance"
        placeholder="Ce qui est attendu, et sous quel délai."
        aide="Le motif part avec la relance et reste visible au dossier."
        erreur={errors.motif?.message}
        {...register("motif", {
          required: "Le motif est obligatoire : une relance sans motif ne produit rien.",
        })}
      />
    </ModaleFormulaire>
  );
}
