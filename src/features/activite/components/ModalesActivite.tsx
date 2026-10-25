import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Bouton } from "@/components/ui/Bouton";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { ChampMois } from "@/components/ui/ChampMois";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { SelecteurAgent } from "@/components/ui/SelecteurAgent";
import { SelecteurStructure } from "@/components/ui/SelecteurStructure";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import { OPTIONS_AXES, type LibelleAxe } from "@/lib/axesStrategiques";
import { messageDErreur } from "@/lib/erreurApi";
import { formaterDate, formaterMois, moisDeLaDate } from "@/lib/format";
import { useSession } from "@/lib/contexteSession";
import { structuresQuery } from "@/lib/referentiel";
import {
  useAjouterIndicateur,
  useChangerEtatPlan,
  useCreerActivite,
  useDeclarerAvancement,
  useDeposerObligation,
  useLeverInstruction,
  useModifierActivite,
  useModifierTaches,
  useRattacherInstruction,
  useRecalibrerAvancement,
  useRelancerActivite,
  useReleverIndicateur,
  useSuspendreActivite,
  type ActiviteDetail,
  type IndicateurActivite,
  type InstructionActivite,
  type Obligation,
  type SaisieTacheLigne,
  type TacheActivite,
} from "@/features/activite/api";
import { useDeposerPiece } from "@/features/pieces/api";

/**
 * Modales du pilier « activités ».
 *
 * Elles se répartissent en trois familles, qui ne portent pas les mêmes
 * permissions et ne racontent pas la même chose :
 *
 *  — ce que la structure déclare de son propre travail (`ACT_SAI`) : créer et
 *    modifier une activité, poser ses indicateurs et ses tâches, déclarer
 *    l'avancement d'une tâche, verser une pièce ;
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
  /** Les sigles des structures co-responsables, hors porteuse — ADR 047. */
  structuresAssociees: string[];
  /** Le mois, `AAAA-MM` : la période d'une activité ne se saisit pas au jour. */
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
  porteuse,
}: {
  register: UseFormRegister<ChampsActivite>;
  errors: FieldErrors<ChampsActivite>;
  control: Control<ChampsActivite>;
  /** La structure qui porte l'activité à son plan. Affichée, jamais choisie. */
  porteuse: { sigle: string; libelle: string };
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
        Ce qui répond d'une activité, c'est une **structure** — ADR 047. La
        porteuse vient du plan et ne se choisit pas ; les autres s'ajoutent, et
        chacune voit l'activité et la déclare.
      */}
      <ChampStructuresResponsables control={control} porteuse={porteuse} />

      {/*
        Le point focal ne se déduit pas du compte connecté : un point focal
        inscrit les activités de toute sa direction sans en porter aucune.
        L'annuaire n'est donc pas borné à sa structure — ADR 020. Et il est
        **facultatif** : la responsabilité tient aux structures.
      */}
      <SelecteurAgent
        libelle="Point focal (facultatif)"
        invite="Aucun point focal"
        aide="La personne qu'on appelle. Ce sont les structures ci-dessus qui répondent de l'exécution."
        erreur={errors.responsableId?.message}
        {...register("responsableId")}
      />

      {/*
        Au mois, et non au jour : un plan annuel s'écrit « de mars à décembre »,
        et le quantième était inventé à chaque saisie. Le serveur pose la borne
        — premier jour du mois au début, dernier à la fin (ADR 047).
      */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChampMois
          libelle="Début d'exécution"
          erreur={errors.debut?.message}
          {...register("debut", { required: "Indiquez le mois de début." })}
        />
        <ChampMois
          libelle="Fin d'exécution"
          erreur={errors.fin?.message}
          {...register("fin", {
            required: "Indiquez le mois de fin.",
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

/**
 * Les structures qui répondent de l'activité — ADR 047.
 *
 * La **porteuse** s'affiche et ne se choisit pas : elle vient du plan d'actions
 * de l'agent qui enregistre, et c'est ce plan qui compte l'activité. La
 * proposer au choix laisserait croire qu'on peut inscrire une activité au plan
 * d'une autre direction, ce que le serveur refuse.
 *
 * Les autres s'ajoutent librement, **sans borne de périmètre** : une activité
 * transverse associe précisément une direction que le point focal ne lit pas.
 * Les associer lui ouvre la visibilité — c'est le geste, pas un effet de bord.
 *
 * `SelecteurStructure` travaille par identifiants, l'API par sigles : la
 * conversion se fait ici, contre le référentiel de l'organigramme. Tant qu'il
 * n'est pas arrivé, la liste est vide et rien n'est cliquable ; l'aide le dit
 * plutôt que de laisser croire que l'organigramme ne contient rien.
 */
function ChampStructuresResponsables({
  control,
  porteuse,
}: {
  control: Control<ChampsActivite>;
  porteuse: { sigle: string; libelle: string };
}) {
  const { data: referentiel } = useQuery(structuresQuery());
  const structures = referentiel ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1 border border-bordure-forte bg-surface-douce px-3 py-2.5">
        <span className="text-[11px] leading-none font-semibold text-encre-faible">
          Structure porteuse
        </span>
        <span className="text-[12.5px] leading-none font-bold text-encre">
          {porteuse.sigle || "—"}
          {porteuse.libelle && (
            <span className="ml-2 font-medium text-encre-moyenne">{porteuse.libelle}</span>
          )}
        </span>
        <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">
          Elle inscrit l'activité à son plan d'actions annuel. Elle ne se choisit pas.
        </span>
      </div>

      <Controller
        control={control}
        name="structuresAssociees"
        render={({ field }) => (
          <SelecteurStructure
            libelle="Autres structures responsables"
            avecPilote={false}
            aide={
              referentiel
                ? "Elles voient l'activité et la déclarent, sans l'inscrire à leur propre plan."
                : "Chargement de l'organigramme…"
            }
            choisies={structures
              .filter((s) => (field.value ?? []).includes(s.sigle))
              .map((s) => s.id)}
            onChange={(ids) =>
              field.onChange(
                ids
                  .map((id) => structures.find((s) => s.id === id)?.sigle)
                  .filter((sigle): sigle is string => Boolean(sigle) && sigle !== porteuse.sigle),
              )
            }
          />
        )}
      />
    </div>
  );
}

/**
 * Une ligne de l'éditeur de tâches.
 *
 * `tacheId` et non `id` : `useFieldArray` réserve `id` à sa propre clef de
 * rendu, et l'écraserait. La part reste une chaîne, ce que rend un `<input>` ;
 * elle n'est convertie qu'à l'envoi.
 */
interface LigneTache {
  /** Absent : la tâche est à créer. Présent : la tâche existante est mise à jour. */
  tacheId?: number;
  libelle: string;
  valeurPrevue: string;
  /** `AAAA-MM`. Vide : le mois de l'activité. */
  moisDebut: string;
  moisFin: string;
}

interface ChampsTaches {
  taches: LigneTache[];
}

const LIGNE_UNIQUE: LigneTache = {
  libelle: "",
  valeurPrevue: "100",
  moisDebut: "",
  moisFin: "",
};

/**
 * Une valeur en centièmes entiers.
 *
 * La somme à 100 (RG-3) se compare en entiers : en virgule flottante,
 * 33,33 + 33,33 + 33,34 ne tombe pas sur 100, et le formulaire refuserait un
 * découpage que le serveur, qui compte en décimal, accepte.
 */
function enCentiemes(valeur: string | number): number {
  const nombre = Number(String(valeur).replace(",", "."));
  return Number.isFinite(nombre) ? Math.round(nombre * 100) : 0;
}

/** « 33,33 », « 100 » — des points de l'activité (RG-5). */
function formaterPoints(valeur: number): string {
  return valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/** Les lignes telles que l'API les attend. Un mois laissé vide reprend celui de l'activité. */
function lignesAEnvoyer(lignes: LigneTache[], debut: string, fin: string): SaisieTacheLigne[] {
  return lignes.map((ligne) => ({
    ...(ligne.tacheId === undefined ? {} : { id: ligne.tacheId }),
    libelle: ligne.libelle.trim(),
    valeurPrevue: enCentiemes(ligne.valeurPrevue) / 100,
    moisDebut: ligne.moisDebut || debut,
    moisFin: ligne.moisFin || fin,
  }));
}

/**
 * La liste des tâches d'une activité et leurs parts — ADR 049.
 *
 * L'avancement de l'activité n'est plus saisi : il est la somme des valeurs
 * obtenues sur ses tâches (RG-7). Le découpage se pose donc **avec**
 * l'activité (RG-1), et chaque tâche reçoit une part de 0 à 100 (RG-2) dont le
 * total vaut exactement 100 (RG-3). Le total courant s'affiche pendant la
 * saisie : un refus découvert à l'envoi obligerait à refaire le calcul de tête.
 *
 * Les mois sont bornés par la période de l'activité (RG-8, RG-9) : le sélecteur
 * ne propose que ceux-là, et c'est lui qui porte l'année — elle ne se saisit
 * pas. Le serveur refuse de toute façon une tâche qui en sortirait.
 *
 * Partagé entre la création et la modification de la liste, pour que les deux
 * appliquent les mêmes règles. En modification, `existantes` dit ce qui a déjà
 * avancé : une telle tâche ne se retire pas, et sa part ne descend pas sous ce
 * qu'elle a obtenu — le serveur le refuserait, autant ne pas le proposer.
 */
function EditeurTaches({
  control,
  register,
  errors,
  debut,
  fin,
  existantes = [],
}: {
  control: Control<ChampsTaches>;
  register: UseFormRegister<ChampsTaches>;
  errors: FieldErrors<ChampsTaches>;
  /** Période de l'activité, `AAAA-MM`. Vide tant qu'elle n'est pas saisie. */
  debut: string;
  fin: string;
  existantes?: TacheActivite[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "taches",
    rules: {
      validate: (lignes) => {
        if (lignes.length === 0) return "Une activité compte au moins une tâche.";
        const total = lignes.reduce((somme, ligne) => somme + enCentiemes(ligne.valeurPrevue), 0);
        return (
          total === 10000 ||
          `Les parts totalisent ${formaterPoints(total / 100)} : elles doivent faire exactement 100.`
        );
      },
    },
  });
  const lignes = useWatch({ control, name: "taches" }) ?? [];
  const total = lignes.reduce((somme, ligne) => somme + enCentiemes(ligne?.valeurPrevue ?? ""), 0);
  const reliquat = 10000 - total;
  const periodeConnue = Boolean(debut && fin);

  const dansLaPeriode = (mois: string) =>
    !periodeConnue ||
    !mois ||
    (mois >= debut && mois <= fin) ||
    `Hors de la période de l'activité (${formaterMois(debut)} – ${formaterMois(fin)}).`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[11px] leading-none font-semibold text-encre-faible">
          Tâches à réaliser
        </span>
        <span
          className={`text-[11px] leading-none font-bold tabular-nums ${
            total === 10000 ? "text-succes" : "text-danger"
          }`}
        >
          Total {formaterPoints(total / 100)} / 100
        </span>
      </div>
      <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">
        Chaque tâche reçoit une part de l'activité ; les parts totalisent 100, et l'activité avance
        de ce que ses tâches obtiennent. Un mois laissé vide reprend celui de l'activité.
      </span>

      {fields.map((field, index) => {
        const existante = existantes.find((t) => t.id === field.tacheId);
        const plancher = existante ? Math.max(existante.valeurObtenue, existante.valeurRetenue) : 0;
        const avancee = plancher > 0;

        return (
          <div
            key={field.id}
            className="flex flex-col gap-3 border border-bordure-forte bg-surface px-3 py-3"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
              <Champ
                libelle={`Tâche ${index + 1}`}
                placeholder="Rédaction du cahier des charges"
                erreur={errors.taches?.[index]?.libelle?.message}
                {...register(`taches.${index}.libelle`, {
                  validate: (valeur) => valeur.trim() !== "" || "Le libellé est obligatoire.",
                })}
              />
              <Champ
                libelle="Part (points)"
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                aide={avancee ? `Obtenu : ${formaterPoints(plancher)}` : undefined}
                erreur={errors.taches?.[index]?.valeurPrevue?.message}
                {...register(`taches.${index}.valeurPrevue`, {
                  validate: (valeur) => {
                    const refus = refusDeValeur(valeur);
                    if (refus) return refus;
                    const centiemes = enCentiemes(valeur);
                    if (centiemes <= 0 || centiemes > 10000) return "Entre 0,01 et 100.";
                    return (
                      centiemes >= Math.round(plancher * 100) ||
                      `La tâche a déjà obtenu ${formaterPoints(plancher)} points.`
                    );
                  },
                })}
              />
            </div>

            <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
              <ChampMois
                libelle="Mois de début"
                min={debut || undefined}
                max={fin || undefined}
                erreur={errors.taches?.[index]?.moisDebut?.message}
                {...register(`taches.${index}.moisDebut`, {
                  validate: dansLaPeriode,
                })}
              />
              <ChampMois
                libelle="Mois de fin"
                min={debut || undefined}
                max={fin || undefined}
                erreur={errors.taches?.[index]?.moisFin?.message}
                {...register(`taches.${index}.moisFin`, {
                  validate: (valeur, valeurs) => {
                    const hors = dansLaPeriode(valeur);
                    if (hors !== true) return hors;
                    const premier = valeurs.taches[index]?.moisDebut || debut;
                    const dernier = valeur || fin;
                    return (
                      !premier ||
                      !dernier ||
                      dernier >= premier ||
                      "La fin ne peut pas précéder le début."
                    );
                  },
                })}
              />
              <Bouton
                type="button"
                icone="croix"
                onClick={() => remove(index)}
                disabled={fields.length === 1 || avancee}
                title={avancee ? "Une tâche qui a déjà avancé ne se retire pas." : undefined}
              >
                Retirer
              </Bouton>
            </div>
          </div>
        );
      })}

      {errors.taches?.root?.message && (
        <Encart ton="danger" icone="horloge">
          {errors.taches.root.message}
        </Encart>
      )}

      <div>
        <Bouton
          type="button"
          icone="plus"
          onClick={() =>
            append({
              libelle: "",
              // Le reliquat plutôt que zéro : c'est presque toujours ce que la
              // dernière tâche doit recevoir, et le total tombe juste d'emblée.
              valeurPrevue: reliquat > 0 ? String(reliquat / 100) : "",
              moisDebut: "",
              moisFin: "",
            })
          }
        >
          Ajouter une tâche
        </Bouton>
      </div>
    </div>
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
  // La porteuse est la structure de l'agent : c'est son plan qui reçoit
  // l'activité. Le serveur la déduit de la même façon — le front l'affiche
  // pour que personne ne découvre après coup à quel plan il a écrit.
  const session = useSession();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsActivite & ChampsTaches>({
    defaultValues: { structuresAssociees: [], taches: [LIGNE_UNIQUE] },
  });
  const debut = useWatch({ control, name: "debut" }) ?? "";
  const fin = useWatch({ control, name: "fin" }) ?? "";

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
        responsableId: valeurs.responsableId ? Number(valeurs.responsableId) : null,
        structuresAssociees: valeurs.structuresAssociees ?? [],
        debut: valeurs.debut,
        fin: valeurs.fin,
        budgetValide: valeurs.budgetValide ? Number(valeurs.budgetValide) : null,
        taches: lignesAEnvoyer(valeurs.taches, valeurs.debut, valeurs.fin),
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
      erreur={
        creer.isError ? messageDErreur(creer.error, "L'activité n'a pas pu être ajoutée.") : null
      }
      consequence="L'avancement de l'activité sera la somme de ce que ses tâches obtiennent. Les indicateurs se posent ensuite, depuis la fiche."
      largeur={720}
    >
      <ChampsCommunsActivite
        register={register as unknown as UseFormRegister<ChampsActivite>}
        errors={errors as FieldErrors<ChampsActivite>}
        control={control as unknown as Control<ChampsActivite>}
        porteuse={{
          sigle: session.structureSigle,
          libelle: session.structureLibelle,
        }}
      />

      <EditeurTaches
        control={control as unknown as Control<ChampsTaches>}
        register={register as unknown as UseFormRegister<ChampsTaches>}
        errors={errors as FieldErrors<ChampsTaches>}
        debut={debut}
        fin={fin}
      />
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
      structuresAssociees: activite.structuresAssociees.map((s) => s.sigle),
      // La fiche rend une date pleine, le champ attend un mois : le quantième
      // posé par le serveur ne se re-saisit pas (ADR 047).
      debut: moisDeLaDate(activite.debut),
      fin: moisDeLaDate(activite.fin),
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
        responsableId: valeurs.responsableId ? Number(valeurs.responsableId) : null,
        structuresAssociees: valeurs.structuresAssociees ?? [],
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
      erreur={
        modifier.isError
          ? messageDErreur(modifier.error, "La modification n'a pas pu être enregistrée.")
          : null
      }
      consequence="La modification et son motif sont inscrits à la fiche de vie."
      largeur={680}
    >
      <ChampsCommunsActivite
        register={register as unknown as UseFormRegister<ChampsActivite>}
        errors={errors as FieldErrors<ChampsActivite>}
        control={control as unknown as Control<ChampsActivite>}
        porteuse={{
          sigle: activite.structureSigle,
          libelle: activite.structureLibelle,
        }}
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

/**
 * Modification de la liste des tâches — ADR 049.
 *
 * La liste s'envoie **entière** et remplace l'ajout unitaire : la somme à 100
 * (RG-3) ne se contrôle que sur la liste, puisque passer de 50/50 à 30/70
 * transite par une somme fausse. Une tâche absente de la liste est retirée ;
 * une tâche présente garde son identifiant, donc ses déclarations.
 *
 * **Aucun agent n'est désigné** (ADR 048) : une tâche relève de son activité,
 * et ce sont les structures responsables de l'activité qui en répondent
 * (ADR 047).
 *
 * Le motif est exigé, comme pour toute modification de l'activité : changer
 * les parts change ce qui reste à obtenir sur chaque tâche, et la fiche de vie
 * doit dire pourquoi le découpage a bougé.
 */
export function ModaleTachesActivite({
  ouverte,
  onFermer,
  activite,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
}) {
  const modifier = useModifierTaches();
  const debut = moisDeLaDate(activite.debut);
  const fin = moisDeLaDate(activite.fin);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsTaches & { motif: string }>({
    defaultValues: {
      taches:
        activite.taches.length > 0
          ? activite.taches.map((tache) => ({
              tacheId: tache.id,
              libelle: tache.libelle,
              valeurPrevue: String(tache.valeurPrevue),
              moisDebut: tache.moisDebut,
              moisFin: tache.moisFin,
            }))
          : [LIGNE_UNIQUE],
      motif: "",
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
        taches: lignesAEnvoyer(valeurs.taches, debut, fin),
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
      titre="Modifier les tâches"
      sousTitre={activite.reference}
      libelleEnvoi="Enregistrer"
      enCours={modifier.isPending}
      erreur={
        modifier.isError
          ? messageDErreur(modifier.error, "Les tâches n'ont pas pu être enregistrées.")
          : null
      }
      consequence="Les valeurs déjà obtenues sont conservées : l'avancement de l'activité ne bouge pas, seule la part restant à obtenir sur chaque tâche change. La nouvelle liste et son motif sont inscrits à la fiche de vie."
      largeur={680}
    >
      <EditeurTaches
        control={control as unknown as Control<ChampsTaches>}
        register={register as unknown as UseFormRegister<ChampsTaches>}
        errors={errors as FieldErrors<ChampsTaches>}
        debut={debut}
        fin={fin}
        existantes={activite.taches}
      />

      <ChampTexteLong
        libelle="Motif de la modification"
        placeholder="Ce qui justifie le nouveau découpage — tâche oubliée, part mal estimée, instruction reçue."
        rows={3}
        erreur={errors.motif?.message}
        {...register("motif", {
          validate: (valeur) =>
            valeur.trim() !== "" ||
            "Le motif est obligatoire : un découpage modifié sans motif rend l'avancement illisible.",
        })}
      />
    </ModaleFormulaire>
  );
}

/**
 * Le refus d'une valeur en points, ou `null` si elle se lit.
 *
 * Le serveur compte au centième et refuse une précision plus fine plutôt que
 * de l'arrondir en silence : le formulaire applique la même règle, pour que le
 * refus arrive sous le champ et non en tête de modale.
 */
function refusDeValeur(valeur: string): string | null {
  if (String(valeur).trim() === "") return "Indiquez une valeur.";
  const nombre = Number(String(valeur).replace(",", "."));
  if (!Number.isFinite(nombre)) return "Indiquez un nombre.";
  if (Math.abs(nombre * 100 - Math.round(nombre * 100)) > 1e-6) return "Au centième au plus.";
  return null;
}

/**
 * Déclaration d'avancement d'une tâche — §18, ADR 049.
 *
 * **L'avancement se déclare sur une tâche, jamais sur l'activité** (RG-4). Le
 * parcours est celui de la demande : l'activité est ouverte, on choisit la
 * tâche, on déclare. La valeur s'exprime en points de l'activité (RG-5) — une
 * tâche prévue à 30 et déclarée à 15 apporte 15 points — et ne dépasse pas la
 * part prévue (RG-6). Elle est **cumulative** : elle remplace la précédente,
 * elle ne s'y ajoute pas. L'activité en fait la somme (RG-7), et la modale
 * montre le taux qui en résultera avant l'envoi.
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
  tacheInitiale,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
  /** La tâche désignée depuis la fiche. À défaut, la première qui n'est pas faite. */
  tacheInitiale?: number;
}) {
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);
  const [erreurPieces, setErreurPieces] = useState<string | null>(null);
  const declarer = useDeclarerAvancement();
  const deposer = useDeposerPiece("activite", activite.id);

  const premiere =
    activite.taches.find((t) => t.id === tacheInitiale) ??
    activite.taches.find((t) => !t.fait) ??
    activite.taches[0];

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<{ tacheId: string; valeurObtenue: string; observation: string }>({
    defaultValues: {
      tacheId: premiere ? String(premiere.id) : "",
      valeurObtenue: premiere ? String(premiere.valeurObtenue) : "",
      observation: "",
    },
  });

  const tacheId = useWatch({ control, name: "tacheId" });
  const valeur = useWatch({ control, name: "valeurObtenue" }) ?? "";
  const tache = activite.taches.find((t) => String(t.id) === tacheId);

  // Le taux qui résultera de la déclaration. Une tâche recalibrée garde sa
  // valeur retenue : la DSR l'a fixée, une nouvelle déclaration ne la déplace
  // pas tant que le recalibrage n'est pas levé (ADR 049).
  const apres =
    activite.taches.reduce(
      (somme, t) =>
        somme +
        (t.id === tache?.id && !t.recalibrage ? enCentiemes(valeur) : enCentiemes(t.valeurRetenue)),
      0,
    ) / 100;
  const ecart = apres - activite.avancementAttendu;

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
        tacheId: Number(valeurs.tacheId),
        valeurObtenue: enCentiemes(valeurs.valeurObtenue) / 100,
        observation: valeurs.observation,
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
      erreur={
        erreurPieces ??
        (declarer.isError
          ? messageDErreur(declarer.error, "L'avancement n'a pas pu être déclaré.")
          : null)
      }
      consequence="La déclaration est inscrite à la fiche de vie. L'avancement de l'activité, somme de ses tâches, alimente le scoring de la structure."
    >
      {activite.taches.length === 0 && (
        <Encart ton="alerte" icone="horloge">
          Cette activité ne compte aucune tâche. L'avancement se déclare sur une tâche : découpez
          d'abord l'activité, depuis sa fiche.
        </Encart>
      )}

      <Liste
        libelle="Tâche"
        invite="Choisissez la tâche"
        options={activite.taches.map((t) => ({
          valeur: String(t.id),
          libelle: `${t.libelle} — ${formaterPoints(t.valeurObtenue)} / ${formaterPoints(t.valeurPrevue)}`,
        }))}
        erreur={errors.tacheId?.message}
        {...register("tacheId", {
          required: "Choisissez la tâche dont vous déclarez l'avancement.",
          // La valeur déclarée à ce jour, et non zéro : la déclaration est
          // cumulative, et repartir de zéro ferait déclarer un recul par mégarde.
          onChange: (evenement: { target: { value: string } }) => {
            const choisie = activite.taches.find((t) => String(t.id) === evenement.target.value);
            setValue("valeurObtenue", choisie ? String(choisie.valeurObtenue) : "");
          },
        })}
      />

      {tache && (
        <Encart ton="accent" icone="cible">
          Part prévue : {formaterPoints(tache.valeurPrevue)} points, de{" "}
          {formaterMois(tache.moisDebut)} à {formaterMois(tache.moisFin)}. Déclaré à ce jour :{" "}
          {formaterPoints(tache.valeurObtenue)}.
          {tache.recalibrage
            ? ` La DSR retient ${formaterPoints(tache.recalibrage.valeurRetenue)} points sur cette tâche : votre déclaration sera inscrite, mais ne changera pas la valeur retenue tant que le recalibrage n'est pas levé.`
            : ""}
        </Encart>
      )}

      <Champ
        libelle="Valeur obtenue (points de l'activité)"
        type="number"
        min={0}
        max={tache?.valeurPrevue}
        step={0.01}
        aide={
          tache
            ? `De 0 à ${formaterPoints(tache.valeurPrevue)}. Cumulée : elle remplace la déclaration précédente.`
            : undefined
        }
        erreur={errors.valeurObtenue?.message}
        {...register("valeurObtenue", {
          validate: (saisie) => {
            const refus = refusDeValeur(saisie);
            if (refus) return refus;
            const centiemes = enCentiemes(saisie);
            if (centiemes < 0) return "La valeur ne peut pas être négative.";
            return (
              !tache ||
              centiemes <= enCentiemes(tache.valeurPrevue) ||
              `La tâche est prévue à ${formaterPoints(tache.valeurPrevue)} points : elle n'en obtient pas davantage.`
            );
          },
        })}
      />

      {tache && (
        <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
          Avancement de l'activité après la déclaration :{" "}
          <span className="font-bold text-encre tabular-nums">{formaterPoints(apres)} %</span>, pour{" "}
          {activite.avancementAttendu} % attendus à cette date.
        </p>
      )}

      {tache && ecart < -10 && (
        <Encart ton="alerte" icone="horloge">
          L'écart avec l'attendu atteint {formaterPoints(-ecart)} points. Au-delà de dix points,
          l'activité passe en retard et la DSR en est informée. Expliquez ce qui bloque dans
          l'observation.
        </Encart>
      )}

      <ChampTexteLong
        libelle="Observation"
        placeholder="Ce qui a avancé, ce qui bloque."
        erreur={errors.observation?.message}
        aide="Le serveur la refuse si elle est vide : c'est elle qui alimente la fiche de vie, et c'est sur elle que la DSR s'appuie pour recalibrer."
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

/**
 * Recalibrage d'une tâche — ADR 030, descendu à la tâche par l'ADR 049.
 *
 * La structure déclare, la DSR retient. Depuis l'ADR 049, elle retient **sur
 * une tâche** : l'avancement de l'activité est la somme des valeurs de ses
 * tâches (RG-7), et un taux posé sur l'activité ne se répartirait sur aucune —
 * la somme des tâches cesserait d'égaler l'avancement affiché.
 *
 * La valeur déclarée n'est pas réécrite : elle reste sur la tâche, à côté de
 * la valeur retenue, parce que c'est le désaccord qui doit être lisible et non
 * sa disparition. La modale montre donc les deux chiffres avant l'envoi, et
 * exige le motif dans les deux sens — poser un désaccord comme le lever sont
 * l'un et l'autre des décisions, et une décision sans motif ne se conteste pas.
 *
 * `ACT_REC`, que seul le profil DSR porte : le contrôle de gestion valide les
 * plans (`ACT_VAL`) mais ne contredit pas une structure sur ses réalisations.
 */
export function ModaleRecalibrage({
  ouverte,
  onFermer,
  activite,
  tacheInitiale,
}: {
  ouverte: boolean;
  onFermer: () => void;
  activite: ActiviteDetail;
  /** La tâche désignée depuis la fiche. À défaut, la première de la liste. */
  tacheInitiale?: number;
}) {
  const recalibrer = useRecalibrerAvancement();
  const premiere = activite.taches.find((t) => t.id === tacheInitiale) ?? activite.taches[0];

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<{ tacheId: string; valeur: string; motif: string }>({
    defaultValues: {
      tacheId: premiere ? String(premiere.id) : "",
      valeur: premiere ? String(premiere.valeurRetenue) : "",
      motif: "",
    },
  });

  const tacheId = useWatch({ control, name: "tacheId" });
  const retenue = useWatch({ control, name: "valeur" }) ?? "";
  const tache = activite.taches.find((t) => String(t.id) === tacheId);
  const ecart = tache ? (enCentiemes(retenue) - enCentiemes(tache.valeurObtenue)) / 100 : 0;

  function fermer() {
    reset();
    recalibrer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    recalibrer.mutate(
      {
        activiteId: activite.id,
        tacheId: Number(valeurs.tacheId),
        valeur: enCentiemes(valeurs.valeur) / 100,
        motif: valeurs.motif,
      },
      { onSuccess: fermer },
    );
  });

  function lever() {
    if (!tache) return;
    // Le motif est demandé au clic et non par un second formulaire : lever un
    // recalibrage est un geste rare, et lui construire son propre écran
    // l'aurait rendu plus difficile à trouver qu'à exécuter.
    const motif = (window.prompt("Motif de la levée du recalibrage :") ?? "").trim();
    if (!motif) return;

    recalibrer.mutate(
      { activiteId: activite.id, tacheId: tache.id, valeur: null, motif },
      { onSuccess: fermer },
    );
  }

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Recalibrer une tâche"
      sousTitre={activite.reference}
      libelleEnvoi="Retenir cette valeur"
      enCours={recalibrer.isPending}
      erreur={
        recalibrer.isError
          ? messageDErreur(recalibrer.error, "Le recalibrage n'a pas pu être enregistré.")
          : null
      }
      consequence="La valeur retenue remplace la valeur déclarée de la tâche, et l'avancement de l'activité — leur somme — dans les tableaux de bord, les scores et les agrégats. Le point focal en est averti — à défaut, le responsable de la structure porteuse — et la fiche de vie garde les deux chiffres."
      largeur={600}
    >
      <Liste
        libelle="Tâche"
        invite="Choisissez la tâche"
        options={activite.taches.map((t) => ({
          valeur: String(t.id),
          libelle: `${t.libelle} — déclaré ${formaterPoints(t.valeurObtenue)} / ${formaterPoints(t.valeurPrevue)}${t.recalibrage ? " · recalibrée" : ""}`,
        }))}
        erreur={errors.tacheId?.message}
        {...register("tacheId", {
          required: "Choisissez la tâche à recalibrer.",
          onChange: (evenement: { target: { value: string } }) => {
            const choisie = activite.taches.find((t) => String(t.id) === evenement.target.value);
            setValue("valeur", choisie ? String(choisie.valeurRetenue) : "");
          },
        })}
      />

      {tache && (
        <Encart ton="neutre" icone="document">
          La structure déclare {formaterPoints(tache.valeurObtenue)} points sur cette tâche, prévue
          à {formaterPoints(tache.valeurPrevue)}.
          {tache.recalibrage
            ? ` Un recalibrage est déjà en place : ${formaterPoints(tache.recalibrage.valeurRetenue)} points retenus — ${tache.recalibrage.motif}`
            : ""}
        </Encart>
      )}

      <Champ
        libelle="Valeur retenue (points de l'activité)"
        type="number"
        min={0}
        max={tache?.valeurPrevue}
        step={0.01}
        aide={tache ? `De 0 à ${formaterPoints(tache.valeurPrevue)}.` : undefined}
        erreur={errors.valeur?.message}
        {...register("valeur", {
          validate: (saisie) => {
            const refus = refusDeValeur(saisie);
            if (refus) return refus;
            const centiemes = enCentiemes(saisie);
            if (centiemes < 0) return "La valeur ne peut pas être négative.";
            return (
              !tache ||
              centiemes <= enCentiemes(tache.valeurPrevue) ||
              `La tâche est prévue à ${formaterPoints(tache.valeurPrevue)} points : la valeur retenue ne la dépasse pas.`
            );
          },
        })}
      />

      {tache && ecart !== 0 && (
        <Encart ton="alerte" icone="bouclier">
          {ecart < 0
            ? `Vous retirez ${formaterPoints(-ecart)} points à ce que la structure a déclaré.`
            : `Vous ajoutez ${formaterPoints(ecart)} points à ce que la structure a déclaré.`}{" "}
          Le motif lui sera notifié tel quel.
        </Encart>
      )}

      <ChampTexteLong
        libelle="Motif"
        placeholder="Ce qui n'est pas justifié dans les réalisations annoncées."
        aide="Obligatoire. Il part au point focal — à défaut au responsable de la structure porteuse — et s'inscrit à la fiche de vie."
        erreur={errors.motif?.message}
        {...register("motif", {
          required: "Un recalibrage s'écrit avec son motif.",
        })}
      />

      {tache?.recalibrage && (
        <button
          type="button"
          onClick={lever}
          className="cursor-pointer self-start text-[11.5px] leading-none font-bold text-accent hover:underline"
        >
          Lever le recalibrage de cette tâche et rendre la main à la structure
        </button>
      )}
    </ModaleFormulaire>
  );
}
