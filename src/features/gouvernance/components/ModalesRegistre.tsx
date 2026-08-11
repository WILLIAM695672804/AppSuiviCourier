import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import {
  useCreerSeance,
  useCreerStructure,
  useDeclarerAbsence,
  useDeposerDocument,
  type DocumentSeance,
  type TypeAbsence,
  type TypeSeance,
} from "@/features/gouvernance/api";

/**
 * Modales des registres de la gouvernance : séances, documents, absences et
 * référentiel des structures.
 *
 * Quatre formulaires courts, regroupés parce qu'aucun ne justifie son fichier.
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

const NATURES_STRUCTURE = ["Direction", "Service", "Division", "Filiale", "Succursale"];

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
  president: string;
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
    creer.mutate({ ...valeurs, ordreDuJour: [] }, { onSuccess: fermer });
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
        <Champ
          libelle="Présidée par"
          placeholder="N'Guessan Y."
          {...register("president")}
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
  responsable: string;
  poste: string;
  structure: string;
  type: TypeAbsence;
  du: string;
  au: string;
  interimaire: string;
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
  const interimaire = useWatch({ control, name: "interimaire" });
  const du = useWatch({ control, name: "du" });

  function fermer() {
    reset();
    declarer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    declarer.mutate(
      { ...valeurs, interimaire: valeurs.interimaire.trim() || null },
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
        <Champ
          libelle="Responsable"
          placeholder="P. Etoundi"
          erreur={errors.responsable?.message}
          {...register("responsable", { required: "Indiquez le responsable concerné." })}
        />
        <Champ
          libelle="Poste"
          placeholder="Directeur des affaires financières"
          erreur={errors.poste?.message}
          {...register("poste", { required: "Indiquez le poste." })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Structure"
          placeholder="DAF"
          erreur={errors.structure?.message}
          {...register("structure", { required: "Indiquez la structure." })}
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

      <Champ
        libelle="Intérim assuré par"
        placeholder="Laisser vide si aucun intérimaire n'est désigné"
        {...register("interimaire")}
      />

      {!interimaire?.trim() && (
        <Encart ton="alerte" icone="cloche">
          Sans intérimaire désigné, les décisions et courriers revenant à ce responsable
          n'avanceront pas pendant son absence, et les relances partiront dans le vide.
          L'absence apparaîtra en rouge au registre.
        </Encart>
      )}
    </ModaleFormulaire>
  );
}

export function ModaleNouvelleStructure({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerStructure();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    libelle: string;
    sigle: string;
    nature: string;
    niveau: number;
    responsable: string;
  }>({
    defaultValues: { niveau: 1, nature: "Direction" },
  });

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        libelle: valeurs.libelle,
        sigle: valeurs.sigle.toUpperCase(),
        nature: valeurs.nature,
        niveau: Number(valeurs.niveau),
        responsable: valeurs.responsable.trim() || null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter une structure"
      sousTitre="Directions, filiales et succursales du référentiel unique"
      libelleEnvoi="Ajouter"
      enCours={creer.isPending}
      erreur={creer.isError ? "La structure n'a pas pu être ajoutée." : null}
      consequence="Le référentiel alimente tous les modules : activités, décisions, scoring."
      largeur={560}
    >
      <Champ
        libelle="Intitulé"
        placeholder="s affaires financières"
        erreur={errors.libelle?.message}
        {...register("libelle", { required: "L'intitulé est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Sigle"
          placeholder="DAF"
          maxLength={8}
          erreur={errors.sigle?.message}
          {...register("sigle", {
            required: "Le sigle est obligatoire : il identifie la structure partout.",
            maxLength: { value: 8, message: "Huit caractères au maximum." },
          })}
        />
        <Liste
          libelle="Nature"
          options={NATURES_STRUCTURE.map((n) => ({ valeur: n, libelle: n }))}
          aide="Une filiale ou une succursale a ses propres organes de gestion."
          {...register("nature", { required: true })}
        />
      </div>

      <Champ
        libelle="Niveau hiérarchique"
        type="number"
        min={0}
        max={5}
        aide="0 pour la Direction générale, 1 pour les directions, 2 pour les services."
        {...register("niveau", { required: true, min: 0, max: 5 })}
      />

      <Champ
        libelle="Responsable"
        placeholder="Laisser vide si le poste n'est pas pourvu"
        {...register("responsable")}
      />
    </ModaleFormulaire>
  );
}
