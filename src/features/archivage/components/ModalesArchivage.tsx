import { useState } from "react";
import { useForm } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Definition } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  useCreerRegle,
  useProduirePreuve,
  useVerser,
  type PreuveIntegrite,
  type SortFinal,
  type VersementDetail,
} from "@/features/archivage/api";
import { formaterDateHeure } from "@/lib/format";

/**
 * Modales de l'archivage.
 *
 * Deux d'entre elles engagent au-delà de l'application : le versement est
 * irréversible, et la preuve d'intégrité est destinée à un tiers — auditeur,
 * juridiction. Elles disent donc explicitement ce qu'elles produisent, avant
 * de le produire.
 */
const SORTS: SortFinal[] = ["Conservation définitive", "Destruction", "Tri"];

interface ChampsRegle {
  typologie: string;
  description: string;
  dua: number;
  sortFinal: SortFinal;
  fondementJuridique: string;
}

export function ModaleNouvelleRegle({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerRegle();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsRegle>({ defaultValues: { sortFinal: "Tri", dua: 5 } });

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      { ...valeurs, dua: Number(valeurs.dua) },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter une règle de conservation"
      sousTitre="Elle s'appliquera à tous les dossiers de la typologie, une fois visée."
      libelleEnvoi="Ajouter au référentiel"
      enCours={creer.isPending}
      erreur={creer.isError ? "La règle n'a pas pu être ajoutée." : null}
      consequence="La règle naît sans visa : elle devra être validée par le service des archives."
      largeur={640}
    >
      <Champ
        libelle="Typologie documentaire"
        placeholder="Marché public et contrat"
        erreur={errors.typologie?.message}
        {...register("typologie", {
          required: "La typologie est obligatoire.",
        })}
      />

      <ChampTexteLong
        libelle="Description"
        placeholder="Quels documents relèvent de cette typologie."
        rows={3}
        erreur={errors.description?.message}
        {...register("description", {
          required: "La description est obligatoire.",
        })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Durée d'utilité administrative (années)"
          type="number"
          min={1}
          max={100}
          aide="Elle court à compter de la clôture du dossier."
          erreur={errors.dua?.message}
          {...register("dua", {
            required: "Fixez la durée.",
            min: { value: 1, message: "Un an au minimum." },
          })}
        />
        <Liste
          libelle="Sort final"
          options={SORTS.map((s) => ({ valeur: s, libelle: s }))}
          {...register("sortFinal", { required: true })}
        />
      </div>

      <Champ
        libelle="Fondement juridique"
        placeholder="Texte ou instruction qui fonde la durée"
        aide="Sans fondement, la règle ne sera pas opposable en cas de contrôle."
        erreur={errors.fondementJuridique?.message}
        {...register("fondementJuridique", {
          required: "Le fondement juridique est obligatoire.",
        })}
      />
    </ModaleFormulaire>
  );
}

export function ModaleVerser({
  ouverte,
  onFermer,
  versement,
}: {
  ouverte: boolean;
  onFermer: () => void;
  versement: VersementDetail;
}) {
  const verser = useVerser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ observation: string }>();

  const nonBloquantes = versement.anomalies.filter((a) => !a.bloquante);

  function fermer() {
    reset();
    verser.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    verser.mutate(
      {
        versementId: versement.id,
        observation: valeurs.observation,
        anomaliesAcceptees: nonBloquantes.length > 0,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Verser au système d'archivage"
      sousTitre={`${versement.reference} — ${versement.objet}`}
      libelleEnvoi="Verser"
      enCours={verser.isPending}
      erreur={
        verser.isError ? "Le versement n'a pas pu être enregistré." : null
      }
      consequence="Le versement est irréversible et scelle une nouvelle empreinte."
      largeur={600}
    >
      <Encart ton="accent" icone="archive">
        Le versement transfère la garde du dossier au système d'archivage. Il ne
        le détruit pas : le sort final — {versement.sortFinal.toLowerCase()} —
        s'appliquera à l'échéance de la durée d'utilité administrative, sur
        bordereau visé.
      </Encart>

      {nonBloquantes.length > 0 && (
        <Encart ton="alerte" icone="horloge">
          {nonBloquantes.length} anomalie{nonBloquantes.length > 1 ? "s" : ""}{" "}
          non bloquante
          {nonBloquantes.length > 1 ? "s" : ""} subsiste
          {nonBloquantes.length > 1 ? "nt" : ""}. Verser malgré elle
          {nonBloquantes.length > 1 ? "s" : ""} suppose de le motiver :
          l'observation sera conservée avec le dossier.
        </Encart>
      )}

      <ChampTexteLong
        libelle="Observation de versement"
        placeholder="Ce qui a été contrôlé, et ce qui reste en écart le cas échéant."
        erreur={errors.observation?.message}
        {...register("observation", {
          required:
            "Une observation est obligatoire : elle accompagne le dossier versé.",
        })}
      />
    </ModaleFormulaire>
  );
}

export function ModalePreuveIntegrite({
  ouverte,
  onFermer,
  versement,
}: {
  ouverte: boolean;
  onFermer: () => void;
  versement: VersementDetail;
}) {
  const [preuve, setPreuve] = useState<PreuveIntegrite | null>(null);
  const produire = useProduirePreuve();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ motif: string; destinataire: string }>();

  function fermer() {
    reset();
    setPreuve(null);
    produire.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    produire.mutate(
      {
        versementId: versement.id,
        motif: valeurs.motif,
        destinataire: valeurs.destinataire,
      },
      { onSuccess: (resultat) => setPreuve(resultat) },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={preuve ? fermer : envoyer}
      titre="Produire une preuve d'intégrité"
      sousTitre={`${versement.reference} — ${versement.objet}`}
      libelleEnvoi={preuve ? "Terminer" : "Produire la preuve"}
      enCours={produire.isPending}
      erreur={produire.isError ? "La preuve n'a pas pu être produite." : null}
      consequence={
        preuve
          ? undefined
          : "La production est journalisée : qui, quand, pour qui."
      }
      largeur={620}
    >
      {preuve ? (
        <>
          <Encart ton="succes" icone="coche">
            Preuve produite. Elle atteste l'état du dossier à l'instant de
            l'horodatage, et s'accompagne de la chaîne d'empreintes conservée à
            la fiche.
          </Encart>

          <div className="flex flex-col gap-3.5 rounded-none border border-bordure px-3.5 py-3.5">
            <Definition libelle="Algorithme">{preuve.algorithme}</Definition>
            <Definition libelle="Empreinte">
              <code className="block rounded-none bg-surface-douce px-2 py-1.5 font-mono text-[9.5px] leading-[1.5] break-all text-encre-faible">
                {preuve.empreinte}
              </code>
            </Definition>
            <Definition libelle="Horodatage">
              {formaterDateHeure(preuve.horodatage)}
            </Definition>
            <Definition libelle="Autorité d'horodatage">
              {preuve.autorite}
            </Definition>
            <Definition libelle="Périmètre scellé">
              {preuve.nombrePieces} pièces · {preuve.taille}
            </Definition>
            <Definition libelle="Produite par">{preuve.produitePar}</Definition>
          </div>

          <Encart ton="alerte" icone="bouclier">
            L'horodatage est interne. Pour être opposable devant une
            juridiction, il devra provenir d'une autorité qualifiée — exigence
            RNF-CONF-02 du document de référence.
          </Encart>
        </>
      ) : (
        <>
          <Encart ton="accent" icone="bouclier">
            La preuve atteste qu'aucune pièce n'a été ajoutée ni retirée depuis
            la clôture. Elle se remet à un tiers : auditeur, inspection,
            juridiction.
          </Encart>

          <Champ
            libelle="Destinataire"
            placeholder="Division de l'audit interne"
            erreur={errors.destinataire?.message}
            {...register("destinataire", {
              required: "Indiquez à qui la preuve est destinée.",
            })}
          />

          <ChampTexteLong
            libelle="Motif de la demande"
            placeholder="Contrôle de conformité, contentieux, demande externe…"
            aide="Le motif est journalisé avec la production : c'est ce qui rend l'accès traçable."
            erreur={errors.motif?.message}
            {...register("motif", { required: "Le motif est obligatoire." })}
          />
        </>
      )}
    </ModaleFormulaire>
  );
}
