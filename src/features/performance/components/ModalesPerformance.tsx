import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { Interrupteur } from "@/components/ui/Interrupteur";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  dictionnaireQuery,
  useCreerIndicateur,
  useCreerProduction,
  type Periodicite,
} from "@/features/performance/api";

/**
 * Modales du dictionnaire et du calendrier de production.
 *
 * Ce sont les deux seules modales de l'application qui modifient une **règle**
 * et non une donnée. Ajouter un indicateur change la façon dont toutes les
 * structures seront mesurées le mois suivant ; ajouter une production au
 * calendrier crée une obligation pour douze directions.
 *
 * D'où les encarts d'avertissement : ailleurs, une saisie n'engage que son
 * auteur ; ici, elle engage tout le monde.
 */
const PERIODICITES: Periodicite[] = ["Mensuelle", "Trimestrielle", "Semestrielle", "Annuelle"];

interface ChampsIndicateur {
  code: string;
  libelle: string;
  definition: string;
  formule: string;
  source: string;
  periodicite: Periodicite;
  responsable: string;
  unite: string;
  seuilVert: number;
  seuilOrange: number;
  critere: string;
}

export function ModaleNouvelIndicateur({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerIndicateur();
  // Les critères viennent du serveur : une liste écrite ici se serait
  // désynchronisée au premier critère ajouté par la DSR, et la saisie aurait
  // été refusée sans que l'agent comprenne pourquoi.
  const { data: dictionnaire } = useQuery(dictionnaireQuery());
  const criteres = dictionnaire?.criteres ?? [];
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChampsIndicateur>({
    defaultValues: {
      periodicite: "Mensuelle",
      unite: "%",
      seuilVert: 85,
      seuilOrange: 60,
    },
  });

  const seuilVert = useWatch({ control, name: "seuilVert" });
  const critere = useWatch({ control, name: "critere" });

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        ...valeurs,
        code: valeurs.code.toUpperCase(),
        seuilVert: Number(valeurs.seuilVert),
        seuilOrange: Number(valeurs.seuilOrange),
        critere: valeurs.critere || null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter un indicateur"
      sousTitre="Définition, formule, source, périodicité et responsable — les cinq champs qui rendent une mesure discutable."
      libelleEnvoi="Ajouter au dictionnaire"
      enCours={creer.isPending}
      erreur={creer.isError ? "L'indicateur n'a pas pu être ajouté." : null}
      largeur={700}
    >
      {critere && (
        <Encart ton="alerte" icone="bouclier">
          Cet indicateur alimentera le critère «{" "}
          {criteres.find((c) => c.code === critere)?.libelle ?? critere} » de la matrice de scoring.
          Il changera donc le classement de toutes les structures dès le mois suivant.
        </Encart>
      )}

      <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
        <Champ
          libelle="Code"
          placeholder="ACT-EXE"
          maxLength={12}
          erreur={errors.code?.message}
          {...register("code", { required: "Le code est obligatoire." })}
        />
        <Champ
          libelle="Libellé"
          placeholder="Taux d'exécution du plan d'actions"
          erreur={errors.libelle?.message}
          {...register("libelle", { required: "Le libellé est obligatoire." })}
        />
      </div>

      <ChampTexteLong
        libelle="Définition"
        placeholder="Ce que l'indicateur mesure exactement, et sur quel périmètre."
        rows={3}
        erreur={errors.definition?.message}
        {...register("definition", {
          required: "La définition est obligatoire.",
        })}
      />

      <Champ
        libelle="Formule de calcul"
        placeholder="activités à l'attendu ÷ activités suivies × 100"
        aide="Elle s'affiche en clair au dictionnaire : un responsable doit pouvoir refaire l'opération."
        erreur={errors.formule?.message}
        {...register("formule", { required: "La formule est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Source des données"
          placeholder="Module Activités — déclarations des points focaux"
          erreur={errors.source?.message}
          {...register("source", { required: "Indiquez la source." })}
        />
        <Champ
          libelle="Responsable de la production"
          placeholder="DSR"
          erreur={errors.responsable?.message}
          {...register("responsable", { required: "Indiquez le responsable." })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Liste
          libelle="Périodicité"
          options={PERIODICITES.map((p) => ({ valeur: p, libelle: p }))}
          {...register("periodicite", { required: true })}
        />
        <Liste
          libelle="Critère alimenté"
          invite="Aucun — indicateur de suivi seul"
          options={criteres.map((c) => ({
            valeur: c.code,
            libelle: `${c.libelle} · ${c.poids} %`,
          }))}
          {...register("critere")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Champ
          libelle="Unité"
          placeholder="%"
          maxLength={10}
          {...register("unite", { required: true })}
        />
        <Champ
          libelle="Seuil vert (à partir de)"
          type="number"
          erreur={errors.seuilVert?.message}
          {...register("seuilVert", { required: "Fixez le seuil vert." })}
        />
        <Champ
          libelle="Seuil orange (à partir de)"
          type="number"
          erreur={errors.seuilOrange?.message}
          {...register("seuilOrange", {
            required: "Fixez le seuil orange.",
            validate: (valeur) =>
              Number(valeur) < Number(seuilVert) ||
              "Le seuil orange doit être inférieur au seuil vert.",
          })}
        />
      </div>
    </ModaleFormulaire>
  );
}

interface ChampsProduction {
  production: string;
  nature: string;
  periodicite: Periodicite;
  echeance: string;
  joursAvantRelance: number;
}

export function ModaleNouvelleProduction({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerProduction();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChampsProduction & { relanceAutomatique: boolean }>({
    defaultValues: {
      periodicite: "Mensuelle",
      relanceAutomatique: true,
      joursAvantRelance: 3,
    },
  });

  const relance = useWatch({ control, name: "relanceAutomatique" });

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        production: valeurs.production,
        nature: valeurs.nature,
        periodicite: valeurs.periodicite,
        echeance: valeurs.echeance,
        relanceAutomatique: valeurs.relanceAutomatique,
        joursAvantRelance: valeurs.relanceAutomatique ? Number(valeurs.joursAvantRelance) : null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Ajouter une production au calendrier"
      sousTitre="Qui alimente quoi, à quelle fréquence, et ce qui se passe en cas de non-saisie."
      libelleEnvoi="Ajouter au calendrier"
      enCours={creer.isPending}
      erreur={creer.isError ? "La production n'a pas pu être ajoutée." : null}
      largeur={640}
    >
      <Encart ton="alerte" icone="cloche">
        Une production inscrite au calendrier devient une obligation pour les structures concernées,
        et son non-respect pèse sur leur classement mensuel.
      </Encart>

      <Champ
        libelle="Production attendue"
        placeholder="Rapport mensuel d'activité"
        erreur={errors.production?.message}
        {...register("production", { required: "L'intitulé est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Nature"
          placeholder="Rapport, procès-verbal, saisie…"
          erreur={errors.nature?.message}
          {...register("nature", { required: "Indiquez la nature." })}
        />
        <Liste
          libelle="Fréquence"
          options={PERIODICITES.map((p) => ({ valeur: p, libelle: p }))}
          {...register("periodicite", { required: true })}
        />
      </div>

      <Champ
        libelle="Échéance"
        placeholder="le 5 du mois suivant"
        aide="Formulation littérale : c'est ainsi qu'elle apparaît aux structures."
        erreur={errors.echeance?.message}
        {...register("echeance", { required: "L'échéance est obligatoire." })}
      />

      <Encart ton="accent" icone="organisation">
        La production est ouverte à toutes les structures qui entrent au classement, et le
        responsable en découle : la structure elle-même quand elle est seule concernée, la DSR quand
        elles sont plusieurs. Ni l'un ni l'autre ne se saisit — un nombre écrit à la main
        divergerait du référentiel dès la création de la direction suivante.
      </Encart>

      <div className="flex flex-col gap-3 rounded-none border border-bordure px-3.5 py-3">
        <Interrupteur
          libelle="Relance automatique"
          actif={relance}
          onChange={(valeur) => setValue("relanceAutomatique", valeur)}
        />

        {relance ? (
          <Champ
            libelle="Jours avant l'échéance"
            type="number"
            min={1}
            max={30}
            aide="La relance part avant l'échéance. Une relance qui arrive après ne fait que documenter le retard."
            {...register("joursAvantRelance", {
              required: relance,
              min: 1,
              max: 30,
            })}
          />
        ) : (
          <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
            Sans relance automatique, le rappel repose sur la vigilance d'une personne — le premier
            facteur de retard constaté.
          </p>
        )}
      </div>
    </ModaleFormulaire>
  );
}
