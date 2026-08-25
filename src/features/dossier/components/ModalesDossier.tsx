import { useState } from "react";
import { useForm } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  useDemanderComplement,
  useFusionner,
  useRetournerEtape,
  type DossierDetail,
  type EtapeDossier,
  type ModeleCourrier,
} from "@/features/dossier/api";

/**
 * Modales de l'instruction.
 *
 * Celle du retour à l'étape antérieure applique RF-BPM-06 à la lettre : le
 * motif est obligatoire, et il est le seul champ du formulaire. Un retour sans
 * motif oblige l'instructeur à deviner ce qu'on lui reproche, et le fait
 * revenir une seconde fois pour la même raison.
 *
 * Celle de la fusion montre l'aperçu avant de produire. Un modèle appliqué à
 * l'aveugle produit des courriers où subsistent des variables non remplacées —
 * et ils partent quand même.
 */
interface ChampsComplement {
  objet: string;
  echeance: string;
}

export function ModaleDemanderComplement({
  ouverte,
  onFermer,
  dossier,
}: {
  ouverte: boolean;
  onFermer: () => void;
  dossier: DossierDetail;
}) {
  const demander = useDemanderComplement();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsComplement>();

  function fermer() {
    reset();
    demander.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    demander.mutate(
      { dossierId: dossier.id, ...valeurs },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Demander un complément"
      sousTitre={`${dossier.reference} — ${dossier.demandeur}`}
      libelleEnvoi="Envoyer la demande"
      enCours={demander.isPending}
      erreur={demander.isError ? "La demande n'a pas pu être envoyée." : null}
      consequence="Le dossier passe en attente, mais son délai continue de courir."
      largeur={600}
    >
      <Encart ton="alerte" icone="horloge">
        Demander un complément ne suspend pas le délai d'instruction. Le dossier
        reste dû au {dossier.echeance}, que le demandeur réponde ou non.
      </Encart>

      <ChampTexteLong
        libelle="Pièces ou informations demandées"
        placeholder="Ce que le demandeur doit produire, précisément."
        aide="Ce texte part tel quel au demandeur : une demande vague appelle une réponse vague."
        erreur={errors.objet?.message}
        {...register("objet", { required: "Précisez ce qui est demandé." })}
      />

      <ChampDate
        libelle="Attendu pour le"
        aide="Passée cette date sans réponse, le dossier peut être clos sans suite."
        erreur={errors.echeance?.message}
        {...register("echeance", {
          required: "Fixez une échéance au demandeur.",
        })}
      />
    </ModaleFormulaire>
  );
}

export function ModaleRetourEtape({
  ouverte,
  onFermer,
  dossier,
}: {
  ouverte: boolean;
  onFermer: () => void;
  dossier: DossierDetail;
}) {
  const retourner = useRetournerEtape();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ etapeCible: EtapeDossier; motif: string }>({
    defaultValues: { etapeCible: "Instruction" },
  });

  // On ne peut retourner qu'a une etape deja franchie, et jamais a la courante.
  const cibles = dossier.etapes
    .filter((e) => e.franchie && e.code !== dossier.etape)
    .map((e) => ({ valeur: e.code, libelle: e.libelle }));

  function fermer() {
    reset();
    retourner.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    retourner.mutate(
      { dossierId: dossier.id, ...valeurs },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Retourner à une étape antérieure"
      sousTitre={`${dossier.reference} — actuellement en ${dossier.etape.toLowerCase()}`}
      libelleEnvoi="Retourner le dossier"
      enCours={retourner.isPending}
      erreur={
        retourner.isError ? "Le retour n'a pas pu être enregistré." : null
      }
      consequence="Rien n'est effacé : le premier passage reste à l'historique."
      largeur={600}
    >
      <Encart ton="accent" icone="horloge">
        Le retour ne supprime aucune trace. Les étapes déjà franchies restent au
        dossier avec leur acteur et leur date ; seul leur état repasse à « non
        franchie ».
      </Encart>

      {cibles.length === 0 ? (
        <p className="text-[12px] leading-[1.5] font-medium text-encre-tenue">
          Aucune étape antérieure n'a encore été franchie : ce dossier ne peut
          pas être retourné.
        </p>
      ) : (
        <Liste
          libelle="Retourner à"
          options={cibles}
          erreur={errors.etapeCible?.message}
          {...register("etapeCible", {
            required: "Choisissez l'étape de retour.",
          })}
        />
      )}

      <ChampTexteLong
        libelle="Motif du retour"
        placeholder="Ce qui manque ou ce qui doit être repris, précisément."
        aide="Obligatoire. Un retour sans motif oblige l'instructeur à deviner, et le fait revenir une seconde fois."
        erreur={errors.motif?.message}
        {...register("motif", {
          required: "Le motif est obligatoire.",
          minLength: {
            value: 15,
            message: "Soyez explicite : quinze caractères au minimum.",
          },
        })}
      />
    </ModaleFormulaire>
  );
}

export function ModaleFusion({
  ouverte,
  onFermer,
  dossier,
  modeles,
}: {
  ouverte: boolean;
  onFermer: () => void;
  dossier: DossierDetail;
  modeles: ModeleCourrier[];
}) {
  const [modeleId, setModeleId] = useState<number | null>(null);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const fusionner = useFusionner();

  const modele = modeles.find((m) => m.id === modeleId) ?? null;

  /** Aperçu : les variables renseignées sont remplacées, les autres restent visibles. */
  const apercu = modele
    ? modele.corps.replace(
        /\{\{(\w+)\}\}/g,
        (_, nom: string) => valeurs[nom]?.trim() || `{{${nom}}}`,
      )
    : "";
  const manquantes = modele
    ? modele.variables.filter((variable) => !valeurs[variable]?.trim())
    : [];

  function fermer() {
    setModeleId(null);
    setValeurs({});
    fusionner.reset();
    onFermer();
  }

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={() => {
        if (!modele) return;
        fusionner.mutate(
          { dossierId: dossier.id, modeleId: modele.id, valeurs },
          { onSuccess: fermer },
        );
      }}
      titre="Générer un courrier-type"
      sousTitre={`${dossier.reference} — ${dossier.demandeur}`}
      libelleEnvoi="Produire le courrier"
      enCours={fusionner.isPending}
      erreur={fusionner.isError ? "Le courrier n'a pas pu être produit." : null}
      consequence="Le document rejoint les pièces du dossier, en version 1."
      largeur={720}
    >
      <Liste
        libelle="Modèle"
        invite="Choisir un modèle…"
        options={modeles.map((m) => ({
          valeur: String(m.id),
          libelle: `${m.code} — ${m.libelle}`,
        }))}
        value={modeleId === null ? "" : String(modeleId)}
        onChange={(e) => {
          setModeleId(e.target.value ? Number(e.target.value) : null);
          setValeurs({});
        }}
      />

      {modele && (
        <>
          <p className="text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
            {modele.description}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {modele.variables.map((variable) => (
              <Champ
                key={variable}
                libelle={variable}
                value={valeurs[variable] ?? ""}
                onChange={(e) =>
                  setValeurs((actuelles) => ({
                    ...actuelles,
                    [variable]: e.target.value,
                  }))
                }
              />
            ))}
          </div>

          {manquantes.length > 0 && (
            <Encart ton="alerte" icone="horloge">
              {manquantes.length} variable{manquantes.length > 1 ? "s" : ""} non
              renseignée
              {manquantes.length > 1 ? "s" : ""} : {manquantes.join(", ")}. Elle
              {manquantes.length > 1 ? "s apparaîtront" : " apparaîtra"} telle
              {manquantes.length > 1 ? "s" : ""} quelle
              {manquantes.length > 1 ? "s" : ""} dans le courrier produit.
            </Encart>
          )}

          <div className="flex flex-col gap-[7px]">
            <span className="text-[11px] leading-none font-semibold text-encre-faible">
              Aperçu
            </span>
            <div className="max-h-[220px] overflow-y-auto rounded-none border border-bordure bg-surface-douce px-3.5 py-3">
              <p className="text-[11.5px] leading-[1.65] font-medium whitespace-pre-line text-encre-douce">
                {apercu}
              </p>
            </div>
          </div>
        </>
      )}
    </ModaleFormulaire>
  );
}
