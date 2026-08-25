import { useState } from "react";
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { SelecteurAgent } from "@/components/ui/SelecteurAgent";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import { OPTIONS_AXES, type LibelleAxe } from "@/lib/axesStrategiques";
import { formaterDate } from "@/lib/format";
import {
  useAjouterIndicateur,
  useAjouterTache,
  useChangerEtatPlan,
  useCreerActivite,
  useDeclarerAvancement,
  useDeposerObligation,
  useLeverInstruction,
  useModifierActivite,
  useRattacherInstruction,
  useRelancerActivite,
  useReleverIndicateur,
  useSuspendreActivite,
  type ActiviteDetail,
  type IndicateurActivite,
  type InstructionActivite,
  type Obligation,
} from "@/features/activite/api";
import { useDeposerPiece } from "@/features/pieces/api";

/**
 * Modales du pilier « activités ».
 *
 * Elles se répartissent en trois familles, qui ne portent pas les mêmes
 * permissions et ne racontent pas la même chose :
 *
 *  — ce que la structure déclare de son propre travail (`ACT_SAI`) : créer et
 *    modifier une activité, poser ses indicateurs et ses tâches, déclarer un
 *    avancement, verser une pièce ;
 *  — ce que l'autorité impose (`DEC`) : rattacher une instruction verbale ou
 *    une décision du DG, suspendre ou reprendre l'exécution ;
 *  — ce que la DSR fait quand rien ne bouge (`REL`) : relancer.
 *
 * La quatrième — le changement d'état du plan — se dédouble : la structure
 * soumet, le contrôle de gestion valide ou retourne. Le même formulaire sert
 * les deux, parce que c'est le même objet qui change d'état ; seuls le libellé
 * et le motif obligatoire varient.
 */
interface ChampsActivite {
  intitule: string;
  axe: LibelleAxe;
  objectif: string;
  etatReferenceGeneral: string;
  resultatsAttendus: string;
  /** L'identifiant de l'agent. `<select>` rend une chaîne ; le service la convertit. */
  responsableId: string;
  debut: string;
  fin: string;
  budgetValide: string;
}

/**
 * Les champs du §15 communs à la création et à la modification.
 *
 * Factorisés parce qu'ils doivent rester identiques : une activité qu'on ne
 * peut modifier que sur une partie de ses champs oblige à la supprimer pour la
 * corriger, et l'historique disparaît avec elle.
 */
function ChampsCommunsActivite({
  register,
  errors,
  control,
}: {
  register: UseFormRegister<ChampsActivite>;
  errors: FieldErrors<ChampsActivite>;
  control: Control<ChampsActivite>;
}) {
  const debut = useWatch({ control, name: "debut" });

  return (
    <>
      <Champ
        libelle="Intitulé"
        placeholder="Réduire le délai de traitement des factures fournisseurs"
        erreur={errors.intitule?.message}
        {...register("intitule", { required: "L'intitulé est obligatoire." })}
      />

      {/*
        Trois axes, arrêtés par le plan stratégique : une liste, pas une
        saisie. Deux orthographes d'un même axe auraient suffi à fausser tout
        regroupement par axe.
      */}
      <Liste
        libelle="Axe stratégique"
        invite="Choisissez l'axe du plan stratégique"
        options={OPTIONS_AXES}
        aide="Les trois axes du plan stratégique du Port. Une activité en rejoint un seul."
        erreur={errors.axe?.message}
        {...register("axe", {
          required: "Rattachez l'activité à un axe du plan stratégique.",
        })}
      />

      <ChampTexteLong
        libelle="Objectif"
        placeholder="Ce que l'activité doit produire, et à quel niveau."
        erreur={errors.objectif?.message}
        {...register("objectif", { required: "L'objectif est obligatoire." })}
      />

      <ChampTexteLong
        libelle="État de référence"
        placeholder="La situation constatée avant de commencer."
        aide="Sans point de départ, aucun taux d'avancement ne veut dire quoi que ce soit."
        rows={3}
        erreur={errors.etatReferenceGeneral?.message}
        {...register("etatReferenceGeneral", {
          required: "L'état de référence est obligatoire.",
        })}
      />

      <ChampTexteLong
        libelle="Résultats attendus"
        placeholder="Ce qui permettra de dire que l'activité est réalisée."
        rows={3}
        erreur={errors.resultatsAttendus?.message}
        {...register("resultatsAttendus", {
          required: "Les résultats attendus sont obligatoires.",
        })}
      />

      {/*
        Le responsable se choisit et ne se déduit pas du compte connecté : un
        point focal inscrit les activités de toute sa direction sans en porter
        aucune. L'annuaire n'est donc pas borné à sa structure — ADR 020.
      */}
      <SelecteurAgent
        libelle="Responsable de l'activité"
        aide="La personne qui répond de l'exécution, pas celle qui saisit."
        erreur={errors.responsableId?.message}
        {...register("responsableId", { required: "Désignez un responsable." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Début d'exécution"
          erreur={errors.debut?.message}
          {...register("debut", { required: "Indiquez le début." })}
        />
        <ChampDate
          libelle="Fin d'exécution"
          erreur={errors.fin?.message}
          {...register("fin", {
            required: "Indiquez la fin.",
            validate: (valeur) =>
              !debut || valeur >= debut || "La fin ne peut pas précéder le début.",
          })}
        />
      </div>

      <Champ
        libelle="Budget validé (F CFA)"
        type="number"
        min={0}
        placeholder="Laisser vide si l'activité n'a pas de budget dédié"
        aide="Le montant qualifie l'activité ; sa consommation est suivie par le contrôle de gestion."
        {...register("budgetValide")}
      />
    </>
  );
}

export function ModaleNouvelleActivite({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerActivite();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsActivite>();

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        intitule: valeurs.intitule,
        axe: valeurs.axe,
        objectif: valeurs.objectif,
        etatReferenceGeneral: valeurs.etatReferenceGeneral,
        resultatsAttendus: valeurs.resultatsAttendus,
        responsableId: Number(valeurs.responsableId),
        debut: valeurs.debut,
        fin: valeurs.fin,
        budgetValide: valeurs.budgetValide ? Number(valeurs.budgetValide) : null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter une activité"
      sousTitre="Elle rejoint le plan d'actions de votre structure pour l'exercice en cours."
      libelleEnvoi="Ajouter au plan"
      enCours={creer.isPending}
      erreur={creer.isError ? "L'activité n'a pas pu être ajoutée." : null}
      consequence="Les indicateurs et les tâches se posent ensuite, depuis la fiche de l'activité."
      largeur={680}
    >
      <ChampsCommunsActivite register={register} errors={errors} control={control} />
    </ModaleFormulaire>
  );
}

/**
 * Modification d'une activité inscrite au plan.
 *
 * Le motif est obligatoire, et c'est le cœur du geste : le §18 range les
 * modifications parmi les événements de la fiche de vie, au même rang que les
 * instructions et les décisions. Une échéance qui bouge sans raison inscrite
 * rend le retard incompréhensible six mois plus tard.
 */
export function ModaleModifierActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const modifier = useModifierActivite();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsActivite & { motif: string }>({
    defaultValues: {
      intitule: activite.intitule,
      axe: activite.axe,
      objectif: activite.objectif,
      etatReferenceGeneral: activite.etatReferenceGeneral,
      resultatsAttendus: activite.resultatsAttendus,
      responsableId: activite.responsableId === null ? "" : String(activite.responsableId),
      debut: activite.debut,
      fin: activite.fin,
      budgetValide: activite.budgetValide === null ? "" : String(activite.budgetValide),
    },
  });

  function fermer() {
    reset();
    modifier.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    modifier.mutate(
      {
        activiteId: activite.id,
        intitule: valeurs.intitule,
        axe: valeurs.axe,
        objectif: valeurs.objectif,
        etatReferenceGeneral: valeurs.etatReferenceGeneral,
        resultatsAttendus: valeurs.resultatsAttendus,
        responsableId: Number(valeurs.responsableId),
        debut: valeurs.debut,
        fin: valeurs.fin,
        budgetValide: valeurs.budgetValide ? Number(valeurs.budgetValide) : null,
        motif: valeurs.motif,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Modifier l'activité"
      sousTitre={activite.reference}
      libelleEnvoi="Enregistrer"
      enCours={modifier.isPending}
      erreur={modifier.isError ? "La modification n'a pas pu être enregistrée." : null}
      consequence="La modification et son motif sont inscrits à la fiche de vie."
      largeur={680}
    >
      <ChampsCommunsActivite
        register={register as unknown as UseFormRegister<ChampsActivite>}
        errors={errors as FieldErrors<ChampsActivite>}
        control={control as unknown as Control<ChampsActivite>}
      />

      <ChampTexteLong
        libelle="Motif de la modification"
        placeholder="Ce qui justifie le changement — instruction reçue, contrainte nouvelle, erreur de saisie."
        rows={3}
        erreur={errors.motif?.message}
        {...register("motif", {
          required:
            "Le motif est obligatoire : une modification sans motif rend le plan illisible.",
        })}
      />
    </ModaleFormulaire>
  );
}

/**
 * Ajout d'un indicateur — §15.
 *
 * Trois valeurs et non une : l'état de référence, la cible, et plus tard le
 * réalisé. Les deux premières se figent à la création, la troisième se relève.
 */
export function ModaleIndicateurActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const ajouter = useAjouterIndicateur();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    libelle: string;
    unite: string;
    etatReference: string;
    cible: string;
  }>();

  function fermer() {
    reset();
    ajouter.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    ajouter.mutate({ activiteId: activite.id, ...valeurs }, { onSuccess: fermer });
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter un indicateur"
      sousTitre={activite.reference}
      libelleEnvoi="Ajouter"
      enCours={ajouter.isPending}
      erreur={ajouter.isError ? "L'indicateur n'a pas pu être ajouté." : null}
      consequence="L'état de référence et la cible se figent ; seul le réalisé se relève ensuite."
      largeur={600}
    >
      <Champ
        libelle="Libellé"
        placeholder="Délai moyen d'ordonnancement"
        erreur={errors.libelle?.message}
        {...register("libelle", { required: "Le libellé est obligatoire." })}
      />

      <Champ
        libelle="Unité"
        placeholder="jours, %, agents, sites…"
        erreur={errors.unite?.message}
        {...register("unite", { required: "L'unité est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="État de référence"
          placeholder="38"
          aide="La valeur constatée avant de commencer."
          erreur={errors.etatReference?.message}
          {...register("etatReference", {
            required: "Indiquez l'état de référence.",
          })}
        />
        <Champ
          libelle="Cible"
          placeholder="15"
          aide="La valeur à atteindre en fin d'exécution."
          erreur={errors.cible?.message}
          {...register("cible", { required: "Indiquez la cible." })}
        />
      </div>
    </ModaleFormulaire>
  );
}

/** Relevé du réalisé d'un indicateur. La seule valeur qui bouge après coup. */
export function ModaleReleveIndicateur({
  ouverte,
  onFermer,
  activite,
  indicateur,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
  indicateur: IndicateurActivite | null;
}) {
  const relever = useReleverIndicateur();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ realise: string }>();

  function fermer() {
    reset();
    relever.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (!indicateur) return;
    relever.mutate(
      {
        activiteId: activite.id,
        indicateurId: indicateur.id,
        realise: valeurs.realise,
      },
      { onSuccess: fermer },
    );
  });

  if (!indicateur) return null;

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Relever l'indicateur"
      sousTitre={indicateur.libelle}
      libelleEnvoi="Relever"
      enCours={relever.isPending}
      erreur={relever.isError ? "Le relevé n'a pas pu être enregistré." : null}
      consequence="Le relevé est daté : c'est lui qui distingue une mesure fraîche d'une mesure ancienne."
      largeur={520}
    >
      <Encart ton="accent" icone="cible">
        Référence {indicateur.etatReference} {indicateur.unite} · cible {indicateur.cible}{" "}
        {indicateur.unite}
        {indicateur.releveLe
          ? ` · dernier relevé le ${formaterDate(indicateur.releveLe)} à ${indicateur.realise} ${indicateur.unite}`
          : " · jamais relevé"}
      </Encart>

      <Champ
        libelle={`Valeur constatée (${indicateur.unite})`}
        erreur={errors.realise?.message}
        {...register("realise", { required: "Indiquez la valeur constatée." })}
      />
    </ModaleFormulaire>
  );
}

/** Ajout d'une tâche — §15, « tâches à réaliser ». */
export function ModaleTacheActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const ajouter = useAjouterTache();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ libelle: string; echeance: string; responsableId: string }>({
    // Le responsable de l'activité par défaut : une tâche lui revient sauf
    // mention contraire, et le formulaire ne doit pas le faire ressaisir.
    defaultValues: {
      responsableId: activite.responsableId === null ? "" : String(activite.responsableId),
    },
  });

  function fermer() {
    reset();
    ajouter.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    ajouter.mutate(
      {
        activiteId: activite.id,
        libelle: valeurs.libelle,
        echeance: valeurs.echeance,
        responsableId: Number(valeurs.responsableId),
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter une tâche"
      sousTitre={activite.reference}
      libelleEnvoi="Ajouter"
      enCours={ajouter.isPending}
      erreur={ajouter.isError ? "La tâche n'a pas pu être ajoutée." : null}
      consequence="Elle entre au décompte des tâches et se coche lors d'une déclaration d'avancement."
      largeur={600}
    >
      <Champ
        libelle="Libellé"
        placeholder="Numérisation à réception"
        erreur={errors.libelle?.message}
        {...register("libelle", { required: "Le libellé est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Échéance"
          erreur={errors.echeance?.message}
          {...register("echeance", {
            required: "Indiquez l'échéance.",
            validate: (valeur) =>
              valeur <= activite.fin || "L'échéance dépasse la fin d'exécution de l'activité.",
          })}
        />
        <SelecteurAgent
          libelle="Responsable"
          erreur={errors.responsableId?.message}
          {...register("responsableId", {
            required: "Désignez un responsable.",
          })}
        />
      </div>
    </ModaleFormulaire>
  );
}

/**
 * Déclaration d'avancement — §18.
 *
 * **Deux appels, dans cet ordre, et l'ordre se justifie.** La déclaration part
 * d'abord (`POST /activites/{id}/avancement`), les justificatifs ensuite
 * (`POST /api/pieces`, un par fichier). L'acte métier est la déclaration ; un
 * fichier refusé — extension hors liste, poids au-delà du plafond — ne doit pas
 * annuler un avancement déjà saisi.
 *
 * Ce qui impose, en contrepartie, de ne pas mentir sur ce qui a réussi : si le
 * versement échoue, la modale reste ouverte et dit que **la déclaration est
 * passée** et que seules les pièces manquent. Un message unique « échec » aurait
 * conduit à re-déclarer, donc à inscrire deux fois le même avancement.
 *
 * Le fichier lui-même est envoyé. Jusqu'au 17 août 2026, la modale n'envoyait
 * que `{nom, poids}` et le serveur inscrivait une pièce sans binaire ; voir
 * `docs/pieges.md`.
 */
export function ModaleAvancementActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const [taches, setTaches] = useState<number[]>(
    activite.taches.filter((t) => t.fait).map((t) => t.id),
  );
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);
  const [erreurPieces, setErreurPieces] = useState<string | null>(null);
  const declarer = useDeclarerAvancement();
  const deposer = useDeposerPiece("activite", activite.id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ avancement: number; observation: string }>({
    defaultValues: { avancement: activite.avancement },
  });

  const avancement = useWatch({ control, name: "avancement" });
  const ecart = Number(avancement) - activite.avancementAttendu;

  function fermer() {
    reset();
    setFichiers([]);
    setErreurPieces(null);
    declarer.reset();
    deposer.reset();
    onFermer();
  }

  const envoyer = handleSubmit(async (valeurs) => {
    setErreurPieces(null);

    try {
      await declarer.mutateAsync({
        activiteId: activite.id,
        avancement: Number(valeurs.avancement),
        observation: valeurs.observation,
        tachesFaites: taches,
      });
    } catch {
      // `declarer.isError` porte déjà le message ; relancer ici produirait une
      // promesse rejetée que personne n'attrape, et la console d'un agent n'est
      // pas un canal d'erreur.
      return;
    }

    // Séquentiel et non `Promise.all` : le plafond de taille est vérifié fichier
    // par fichier côté serveur, et lancer cinq téléversements de front sur une
    // liaison lente est le meilleur moyen de les faire tous expirer.
    const refuses: string[] = [];
    for (const fichier of fichiers) {
      try {
        await deposer.mutateAsync({
          fichier: fichier.fichier,
          nom: fichier.nom,
          categorie: "justificatif",
        });
      } catch {
        refuses.push(fichier.nom);
      }
    }

    if (refuses.length > 0) {
      // La déclaration, elle, est inscrite : le dire explicitement évite qu'on
      // la resaisisse et qu'un même avancement figure deux fois à la fiche de vie.
      setErreurPieces(
        `L'avancement est bien déclaré, mais ${refuses.length === 1 ? "cette pièce n'a pas pu être versée" : "ces pièces n'ont pas pu être versées"} : ${refuses.join(", ")}. ` +
          "Vérifiez le format et le poids, puis déposez-les depuis l'onglet des pièces jointes.",
      );
      setFichiers([]);
      return;
    }

    fermer();
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Déclarer un avancement"
      sousTitre={activite.reference}
      libelleEnvoi="Déclarer"
      enCours={declarer.isPending || deposer.isPending}
      erreur={erreurPieces ?? (declarer.isError ? "L'avancement n'a pas pu être déclaré." : null)}
      consequence="La déclaration est inscrite à la fiche de vie et alimente le scoring de la structure."
    >
      <Champ
        libelle="Avancement déclaré (%)"
        type="number"
        min={0}
        max={100}
        aide={`Avancement attendu à cette date : ${activite.avancementAttendu} %.`}
        erreur={errors.avancement?.message}
        {...register("avancement", {
          required: "Indiquez l'avancement.",
          min: { value: 0, message: "L'avancement ne peut pas être négatif." },
          max: { value: 100, message: "L'avancement ne dépasse pas 100 %." },
        })}
      />

      {ecart < -10 && (
        <Encart ton="alerte" icone="horloge">
          L'écart avec l'attendu atteint {-ecart} points. Au-delà de dix points, l'activité passe en
          retard et la DSR en est informée. Expliquez ce qui bloque dans l'observation.
        </Encart>
      )}

      {activite.taches.length > 0 && (
        <div className="flex flex-col gap-[7px]">
          <span className="text-[11px] leading-none font-semibold text-encre-faible">
            Tâches réalisées
          </span>
          <div className="flex max-h-[220px] flex-col overflow-y-auto rounded-none border border-bordure-forte">
            {activite.taches.map((tache, index) => (
              <label
                key={tache.id}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 ${
                  index > 0 ? "border-t border-separateur" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={taches.includes(tache.id)}
                  onChange={() =>
                    setTaches((actuelles) =>
                      actuelles.includes(tache.id)
                        ? actuelles.filter((i) => i !== tache.id)
                        : [...actuelles, tache.id],
                    )
                  }
                  className="size-4 flex-none accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {tache.libelle}
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
        {...register("observation", {
          required: "Une observation est obligatoire.",
        })}
      />

      {/* §18 : les pièces jointes font partie de la fiche de vie. Elles pendent
          à la déclaration qu'elles justifient, jamais à l'activité en vrac. */}
      <ZoneDepot
        libelle="Pièces justificatives (facultatif)"
        aide="Rapport, procès-verbal, relevé — ce qui étaye la déclaration."
        fichiers={fichiers}
        onChange={setFichiers}
      />
    </ModaleFormulaire>
  );
}

/**
 * Suspension et reprise d'une activité — §19.
 *
 * « Les décisions du Directeur général peuvent […] suspendre une activité. »
 * C'est donc un geste d'autorité, porté par `DEC` et non par `ACT_SAI` : une
 * structure qui suspendrait elle-même ses activités en retard ferait
 * disparaître ses retards.
 */
export function ModaleSuspensionActivite({
  ouverte,
  onFermer,
  activite,
  action,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
  action: "suspendre" | "reprendre";
}) {
  const changer = useSuspendreActivite();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ motif: string; reference: string }>();

  function fermer() {
    reset();
    changer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    changer.mutate(
      {
        activiteId: activite.id,
        action,
        motif: valeurs.motif,
        reference: valeurs.reference?.trim() || null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre={action === "suspendre" ? "Suspendre l'activité" : "Lever la suspension"}
      sousTitre={activite.reference}
      libelleEnvoi={action === "suspendre" ? "Suspendre" : "Reprendre"}
      enCours={changer.isPending}
      erreur={changer.isError ? "L'opération n'a pas pu aboutir." : null}
      largeur={560}
    >
      {action === "suspendre" ? (
        <Encart ton="confidentiel" icone="horloge">
          Tant que la suspension dure, aucun retard n'est décompté et aucune relance n'est envoyée.
          L'activité sort du calcul du taux d'exécution de la structure.
        </Encart>
      ) : (
        <Encart ton="accent" icone="coche">
          L'activité reprend son cours. Le retard se recompte à partir d'aujourd'hui, sur la période
          d'exécution restante.
        </Encart>
      )}

      <Champ
        libelle="Référence de la décision (facultatif)"
        placeholder="CA-2026-011"
        aide="La décision d'instance ou l'instruction qui fonde la suspension."
        {...register("reference")}
      />

      <ChampTexteLong
        libelle={action === "suspendre" ? "Motif de la suspension" : "Motif de la reprise"}
        placeholder={
          action === "suspendre"
            ? "Ce qui empêche l'exécution, et ce qui la débloquera."
            : "Ce qui a levé l'obstacle."
        }
        rows={3}
        erreur={errors.motif?.message}
        {...register("motif", { required: "Le motif est obligatoire." })}
      />
    </ModaleFormulaire>
  );
}

/**
 * Rattachement d'une instruction verbale ou d'une décision du DG — §17.
 *
 * Le cahier des charges exige quatre attributs : l'activité, la date, le
 * responsable et le délai. Les trois derniers sont ici ; le premier est la
 * fiche depuis laquelle la modale s'ouvre.
 */
export function ModaleInstructionActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const rattacher = useRattacherInstruction();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    origine: "Instruction verbale" | "Décision du DG";
    reference: string;
    texte: string;
    responsableId: string;
    echeance: string;
  }>({
    defaultValues: {
      origine: "Instruction verbale",
      responsableId: activite.responsableId === null ? "" : String(activite.responsableId),
    },
  });

  function fermer() {
    reset();
    rattacher.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    rattacher.mutate(
      {
        activiteId: activite.id,
        origine: valeurs.origine,
        reference: valeurs.reference?.trim() || null,
        texte: valeurs.texte,
        responsableId: Number(valeurs.responsableId),
        echeance: valeurs.echeance,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Rattacher une instruction"
      sousTitre={activite.reference}
      libelleEnvoi="Rattacher"
      enCours={rattacher.isPending}
      erreur={rattacher.isError ? "L'instruction n'a pas pu être rattachée." : null}
      consequence="Elle entre à la fiche de vie et reste ouverte jusqu'à sa levée."
      largeur={620}
    >
      <Liste
        libelle="Origine"
        options={[
          {
            valeur: "Instruction verbale",
            libelle: "Instruction verbale du Directeur général",
          },
          {
            valeur: "Décision du DG",
            libelle: "Décision d'instance (CA, CODIR, DG)",
          },
        ]}
        aide="Une instruction verbale se consigne au moment où elle est donnée ; une décision porte une référence."
        {...register("origine", { required: true })}
      />

      <Champ
        libelle="Référence de la décision (facultatif)"
        placeholder="CODIR-2026-088"
        {...register("reference")}
      />

      <ChampTexteLong
        libelle="Teneur de l'instruction"
        placeholder="Ce qui est demandé, dans les termes où cela a été dit."
        erreur={errors.texte?.message}
        {...register("texte", {
          required: "La teneur de l'instruction est obligatoire.",
        })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelecteurAgent
          libelle="Responsable désigné"
          erreur={errors.responsableId?.message}
          {...register("responsableId", {
            required: "Désignez le responsable de l'exécution.",
          })}
        />
        <ChampDate
          libelle="Délai"
          aide="La date à laquelle l'instruction doit être exécutée."
          erreur={errors.echeance?.message}
          {...register("echeance", { required: "Le délai est obligatoire." })}
        />
      </div>
    </ModaleFormulaire>
  );
}

/** Levée d'une instruction : ce qui a été fait, et qui le constate. */
export function ModaleLeveeInstruction({
  ouverte,
  onFermer,
  activiteId,
  instruction,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activiteId: number;
  instruction: InstructionActivite | null;
}) {
  const lever = useLeverInstruction();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ commentaire: string }>();

  function fermer() {
    reset();
    lever.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (!instruction) return;
    lever.mutate(
      {
        activiteId,
        instructionId: instruction.id,
        commentaire: valeurs.commentaire,
      },
      { onSuccess: fermer },
    );
  });

  if (!instruction) return null;

  const enRetard =
    !instruction.levee && instruction.echeance < new Date().toISOString().slice(0, 10);

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Lever l'instruction"
      sousTitre={instruction.reference ?? "Instruction verbale"}
      libelleEnvoi="Lever"
      enCours={lever.isPending}
      erreur={lever.isError ? "L'instruction n'a pas pu être levée." : null}
      consequence="La levée est datée et inscrite à la fiche de vie."
      largeur={560}
    >
      <Encart ton={enRetard ? "danger" : "accent"} icone="horloge">
        {instruction.texte} — délai au {formaterDate(instruction.echeance)}
        {enRetard ? ", dépassé." : "."}
      </Encart>

      <ChampTexteLong
        libelle="Ce qui a été fait"
        placeholder="Ce qui permet de considérer l'instruction exécutée."
        rows={3}
        erreur={errors.commentaire?.message}
        {...register("commentaire", { required: "Dites ce qui a été fait." })}
      />
    </ModaleFormulaire>
  );
}

/**
 * Relance d'une activité — le geste propre de la DSR.
 *
 * §1.1 du descriptif : la DSR est l'« escalade humaine » chargée de relancer
 * les structures lorsque le système détecte un retard. Le courrier a son écran
 * de relance ; les activités n'en avaient aucun.
 */
export function ModaleRelanceActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const relancer = useRelancerActivite();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ texte: string }>({
    defaultValues: {
      texte:
        activite.avancement < activite.avancementAttendu
          ? `Écart de ${activite.avancementAttendu - activite.avancement} points avec l'avancement attendu. Merci de déclarer l'état réel de l'exécution.`
          : "",
    },
  });

  function fermer() {
    reset();
    relancer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    relancer.mutate({ activiteId: activite.id, texte: valeurs.texte }, { onSuccess: fermer });
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Relancer la structure"
      sousTitre={`${activite.reference} · ${activite.structureSigle}`}
      libelleEnvoi="Relancer"
      enCours={relancer.isPending}
      erreur={relancer.isError ? "La relance n'a pas pu être envoyée." : null}
      consequence="La relance est inscrite à la fiche de vie et compte au dossier de la structure."
      largeur={560}
    >
      {activite.derniereRelance && (
        <Encart ton="alerte" icone="horloge">
          Cette activité a déjà été relancée le {formaterDate(activite.derniereRelance)}. Une
          troisième relance sans réponse relève de l'escalade hiérarchique, pas de la répétition.
        </Encart>
      )}

      <ChampTexteLong
        libelle="Teneur de la relance"
        placeholder="Ce qui est attendu de la structure, et sous quel délai."
        erreur={errors.texte?.message}
        {...register("texte", {
          required: "La teneur de la relance est obligatoire.",
        })}
      />
    </ModaleFormulaire>
  );
}

export function ModaleDeposerObligation({
  ouverte,
  onFermer,
  obligation,
}: {
  ouverte: boolean;
  onFermer: () => void;
  obligation: Obligation | null;
}) {
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);
  const [erreurFichier, setErreurFichier] = useState<string>();
  const deposer = useDeposerObligation();

  const { register, handleSubmit, reset } = useForm<{ commentaire: string }>();

  function fermer() {
    reset();
    setFichiers([]);
    setErreurFichier(undefined);
    deposer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (!obligation) return;
    if (fichiers.length === 0) {
      setErreurFichier("Joignez le document à déposer.");
      return;
    }
    setErreurFichier(undefined);

    deposer.mutate(
      {
        obligationId: obligation.id,
        nomFichier: fichiers[0].nom,
        poids: fichiers[0].taille,
        commentaire: valeurs.commentaire,
      },
      { onSuccess: fermer },
    );
  });

  if (!obligation) return null;

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Déposer un document"
      sousTitre={obligation.intitule}
      libelleEnvoi="Déposer"
      enCours={deposer.isPending}
      erreur={deposer.isError ? "Le document n'a pas pu être déposé." : null}
      consequence="Le dépôt est horodaté : c'est lui qui détermine le respect du délai."
      largeur={560}
    >
      {obligation.retardJours !== null && (
        <Encart ton="danger" icone="horloge">
          Ce document est attendu depuis {obligation.retardJours} jour
          {obligation.retardJours > 1 ? "s" : ""}. Le retard est déjà décompté dans le classement
          mensuel de la structure ; le dépôt l'arrête, il ne l'efface pas.
        </Encart>
      )}

      <ZoneDepot
        libelle={obligation.nature}
        multiple={false}
        fichiers={fichiers}
        onChange={setFichiers}
        erreur={erreurFichier}
      />

      <ChampTexteLong
        libelle="Commentaire"
        placeholder="Facultatif : une précision sur le contenu ou sur le retard."
        rows={3}
        {...register("commentaire")}
      />
    </ModaleFormulaire>
  );
}

export function ModaleEtatPlan({
  ouverte,
  onFermer,
  annee,
  structureSigle,
  action,
}: {
  ouverte: boolean;
  onFermer: () => void;
  annee: number;
  structureSigle: string;
  action: "soumettre" | "valider" | "retourner";
}) {
  const changer = useChangerEtatPlan();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ motif: string }>();

  function fermer() {
    reset();
    changer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    changer.mutate(
      { annee, structureSigle, action, motif: valeurs.motif?.trim() || null },
      { onSuccess: fermer },
    );
  });

  const titres = {
    soumettre: "Soumettre le plan au contrôle de gestion",
    valider: "Valider le plan d'actions",
    retourner: "Retourner le plan à la structure",
  };

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre={titres[action]}
      sousTitre={`${structureSigle} — exercice ${annee}`}
      libelleEnvoi={action === "retourner" ? "Retourner" : "Confirmer"}
      enCours={changer.isPending}
      erreur={changer.isError ? "L'opération n'a pas pu aboutir." : null}
      largeur={560}
    >
      {action === "soumettre" && (
        <Encart ton="accent" icone="exporter">
          Une fois soumis, le plan n'est plus modifiable tant que le contrôle de gestion ne s'est
          pas prononcé. Vérifiez que toutes les activités de l'exercice y figurent.
        </Encart>
      )}

      {action === "valider" && (
        <Encart ton="succes" icone="coche">
          La validation rend le plan opposable : les activités qu'il contient engagent la structure,
          et leur exécution alimente le classement mensuel.
        </Encart>
      )}

      <ChampTexteLong
        libelle={action === "retourner" ? "Motif du retour" : "Commentaire"}
        placeholder={
          action === "retourner"
            ? "Ce qui doit être corrigé avant une nouvelle soumission."
            : "Facultatif."
        }
        erreur={errors.motif?.message}
        {...register("motif", {
          required:
            action === "retourner"
              ? "Le motif est obligatoire : un plan retourné sans motif ne peut pas être corrigé."
              : false,
        })}
      />
    </ModaleFormulaire>
  );
}
