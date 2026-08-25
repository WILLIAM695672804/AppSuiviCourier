import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { SelecteurAgent } from "@/components/ui/SelecteurAgent";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import {
  useCreerSeance,
  useDeclarerAbsence,
  useDeposerDocument,
  type DocumentSeance,
  type TypeAbsence,
  type TypeSeance,
} from "@/features/gouvernance/api";

/**
 * Modales des registres de la gouvernance : séances, documents et absences.
 *
 * Trois formulaires courts, regroupés parce qu'aucun ne justifie son fichier.
 * Ils partagent la même enveloppe (`ModaleFormulaire`) et la même discipline :
 * les champs qui décident de quelque chose sont obligatoires, les autres non.
 */
const TYPES_SEANCE: TypeSeance[] = [
  "Réunion présidée par le DG",
  "Session du Conseil d'administration",
  "Assemblée générale",
  "CODIR",
  "Rapport d'activité",
  "Rapport sectoriel",
];

const NATURES_DOCUMENT: DocumentSeance["nature"][] = [
  "Ordre du jour",
  "Compte rendu",
  "Procès-verbal",
  "Dossier de séance",
  "Rapport",
];

const TYPES_ABSENCE: TypeAbsence[] = [
  "Congé annuel",
  "Mission",
  "Intérim",
  "Formation",
  "Absence exceptionnelle",
];

interface ChampsSeance {
  type: TypeSeance;
  intitule: string;
  date: string;
  /** L'identifiant de l'agent ; `<select>` rend une chaîne, vide si non choisi. */
  presidentId: string;
  structure: string;
  echeanceDepot: string;
}

export function ModaleNouvelleSeance({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerSeance();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsSeance>({
    defaultValues: { type: "CODIR", date: new Date().toISOString().slice(0, 10) },
  });

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        ...valeurs,
        // La présidence se décide parfois à l'ouverture de la séance : le
        // sélecteur vide vaut « pas encore désigné », pas une erreur de saisie.
        presidentId: valeurs.presidentId ? Number(valeurs.presidentId) : null,
        ordreDuJour: [],
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ouvrir une séance"
      sousTitre="Le dossier de séance se remplit ensuite : ordre du jour, documents, décisions issues."
      libelleEnvoi="Ouvrir la séance"
      enCours={creer.isPending}
      erreur={creer.isError ? "La séance n'a pas pu être ouverte." : null}
      consequence="Une référence est attribuée et le délai de dépôt commence à courir."
      largeur={620}
    >
      <Liste
        libelle="Nature"
        options={TYPES_SEANCE.map((t) => ({ valeur: t, libelle: t }))}
        erreur={errors.type?.message}
        {...register("type", { required: "Choisissez la nature de la séance." })}
      />

      <Champ
        libelle="Intitulé"
        placeholder="Comité de direction d'août"
        erreur={errors.intitule?.message}
        {...register("intitule", { required: "L'intitulé est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Tenue le"
          erreur={errors.date?.message}
          {...register("date", { required: "Indiquez la date de la séance." })}
        />
        <ChampDate
          libelle="Compte rendu attendu le"
          aide="C'est cette date qui fait le hors délai."
          erreur={errors.echeanceDepot?.message}
          {...register("echeanceDepot", { required: "Fixez le délai de dépôt." })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelecteurAgent
          libelle="Présidée par"
          invite="À désigner"
          {...register("presidentId")}
        />
        <Champ
          libelle="Structure organisatrice"
          placeholder="Direction générale"
          erreur={errors.structure?.message}
          {...register("structure", { required: "Indiquez la structure organisatrice." })}
        />
      </div>
    </ModaleFormulaire>
  );
}

export function ModaleDeposerDocument({
  ouverte,
  onFermer,
  seanceId,
  seanceIntitule,
}: {
  ouverte: boolean;
  onFermer: () => void;
  seanceId: number;
  seanceIntitule: string;
}) {
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);
  const [erreurFichier, setErreurFichier] = useState<string>();
  const deposer = useDeposerDocument();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ nature: DocumentSeance["nature"]; libelle: string }>({
    defaultValues: { nature: "Compte rendu" },
  });

  function fermer() {
    reset();
    setFichiers([]);
    setErreurFichier(undefined);
    deposer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    if (fichiers.length === 0) {
      setErreurFichier("Joignez le document à déposer.");
      return;
    }
    setErreurFichier(undefined);

    deposer.mutate(
      {
        seanceId,
        nature: valeurs.nature,
        libelle: valeurs.libelle,
        nomFichier: fichiers[0].nom,
        poids: fichiers[0].taille,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Déposer un document"
      sousTitre={seanceIntitule}
      libelleEnvoi="Déposer"
      enCours={deposer.isPending}
      erreur={deposer.isError ? "Le document n'a pas pu être déposé." : null}
      consequence="Le dépôt est horodaté : c'est lui qui détermine le respect du délai."
      largeur={560}
    >
      <Liste
        libelle="Nature du document"
        options={NATURES_DOCUMENT.map((n) => ({ valeur: n, libelle: n }))}
        erreur={errors.nature?.message}
        {...register("nature", { required: "Choisissez la nature du document." })}
      />

      <Champ
        libelle="Libellé"
        placeholder="Compte rendu du CODIR d'août"
        erreur={errors.libelle?.message}
        {...register("libelle", { required: "Le libellé est obligatoire." })}
      />

      <ZoneDepot
        libelle="Document"
        multiple={false}
        fichiers={fichiers}
        onChange={setFichiers}
        erreur={erreurFichier}
      />
    </ModaleFormulaire>
  );
}

interface ChampsAbsence {
  /**
   * L'agent absent, par identifiant.
   *
   * `poste` et `structure` ont disparu du formulaire : ils étaient saisis à la
   * main pour un affichage que le serveur n'a jamais écrit, et rien ne
   * garantissait qu'ils correspondent au compte désigné. Ils viennent
   * maintenant de l'annuaire, avec l'agent.
   */
  responsableId: string;
  type: TypeAbsence;
  du: string;
  au: string;
  interimaireId: string;
}

export function ModaleDeclarerAbsence({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const declarer = useDeclarerAbsence();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsAbsence>({ defaultValues: { type: "Congé annuel" } });

  // `useWatch` et non `watch` : voir `ModalesDecision`.
  const interimaire = useWatch({ control, name: "interimaireId" });
  const du = useWatch({ control, name: "du" });

  function fermer() {
    reset();
    declarer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    declarer.mutate(
      {
        type: valeurs.type,
        du: valeurs.du,
        au: valeurs.au,
        responsableId: Number(valeurs.responsableId),
        // Une absence sans intérimaire est acceptée, et c'est même le cas que
        // la DSR doit voir : l'encart d'alerte le dit sans l'interdire.
        interimaireId: valeurs.interimaireId ? Number(valeurs.interimaireId) : null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Déclarer une absence"
      sousTitre="Congé, mission ou intérim d'un responsable"
      libelleEnvoi="Déclarer"
      enCours={declarer.isPending}
      erreur={declarer.isError ? "L'absence n'a pas pu être déclarée." : null}
      consequence="Les relances tiennent compte des absences déclarées."
      largeur={620}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelecteurAgent
          libelle="Responsable"
          aide="Son poste et sa structure viennent de l'annuaire."
          erreur={errors.responsableId?.message}
          {...register("responsableId", { required: "Désignez le responsable concerné." })}
        />
        <Liste
          libelle="Motif"
          options={TYPES_ABSENCE.map((t) => ({ valeur: t, libelle: t }))}
          {...register("type", { required: true })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChampDate
          libelle="Du"
          erreur={errors.du?.message}
          {...register("du", { required: "Indiquez le début de l'absence." })}
        />
        <ChampDate
          libelle="Au"
          erreur={errors.au?.message}
          {...register("au", {
            required: "Indiquez la fin de l'absence.",
            validate: (valeur) =>
              !du || valeur >= du || "La fin ne peut pas précéder le début.",
          })}
        />
      </div>

      <SelecteurAgent
        libelle="Intérim assuré par"
        invite="Aucun intérimaire désigné"
        {...register("interimaireId")}
      />

      {!interimaire && (
        <Encart ton="alerte" icone="cloche">
          Sans intérimaire désigné, les décisions et courriers revenant à ce responsable
          n'avanceront pas pendant son absence, et les relances partiront dans le vide.
          L'absence apparaîtra en rouge au registre.
        </Encart>
      )}
    </ModaleFormulaire>
  );
}
