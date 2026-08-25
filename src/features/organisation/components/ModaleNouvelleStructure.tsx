import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { useCreerStructure } from "@/features/organisation/api";
import { messageDErreur } from "@/lib/erreurApi";
import { construireArbre, structuresQuery } from "@/lib/referentiel";

/**
 * Les douze natures admises par `structure.nature`, dans l'ordre ou elles
 * apparaissent dans l'organigramme du Port — du sommet vers la feuille, puis
 * les entites juridiques distinctes.
 *
 * La garde reelle est le CHECK `structure_nature_valide` en base ; cette liste
 * est ce que le formulaire propose. Elles doivent rester alignees :
 * `noyau/organisation/modeles.py` — `Structure.NATURES`.
 *
 * La nature n'est pas le rang. Le champ « Niveau », a cote, dit qui dirige la
 * structure : le Cabinet du Directeur general est dirige par un chef de
 * service, un Departement par un sous-directeur.
 */
const NATURES_STRUCTURE = [
  "Direction",
  "Division",
  "Departement",
  "Service",
  "Cellule",
  "Centre",
  "Cabinet",
  "Secteur",
  "Representation",
  "Filiale",
  "Succursale",
  "Organe",
];

/**
 * Le libelle propose pour le poste responsable, selon la nature.
 *
 * Le serveur compose exactement le meme libelle quand le champ part vide
 * (`noyau.organisation.services._libelle_poste_responsable`). Le prerenseigner
 * ici ne change donc pas le resultat : cela **montre** le poste qui va etre
 * ouvert, et laisse le corriger avant, plutot que de le decouvrir apres dans
 * le registre des postes.
 */
function libellePosteResponsable(nature: string, sigle: string, libelle: string): string {
  const nom = sigle.trim() || libelle.trim();
  if (!nom) return "";
  if (nature === "Direction") return `Directeur de ${nom}`;
  if (nature === "Service") return `Chef de service ${nom}`;
  if (nature === "Division") return `Chef de division ${nom}`;
  return `Responsable de ${nom}`;
}

/**
 * Inscrire une structure a l'organigramme — F-01.
 *
 * Ce formulaire ne nomme personne. Le serveur ouvre avec la structure son
 * poste responsable **vacant** : le formulaire saisit donc le *poste*
 * (`posteResponsableLibelle`), et non le *responsable*. L'onglet
 * « Affectations », a cote, y nommera un agent avec sa date d'effet — et c'est
 * la raison pour laquelle les deux gestes vivent desormais dans le meme ecran
 * (ADR 021).
 *
 * `profilResponsableId` n'est pas envoye : le serveur retient `RESP`, ou `DG`
 * au sommet. C'est le profil *propose* sur le poste, que l'ecran des
 * habilitations peut changer a l'affectation.
 */
export function ModaleNouvelleStructure({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const creer = useCreerStructure();
  const { data: structures } = useQuery(structuresQuery());
  // Le libelle du poste cesse d'etre recalcule des qu'on y touche : sinon la
  // correction serait effacee a la frappe suivante dans le sigle.
  const [posteRepris, setPosteRepris] = useState(false);
  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    libelle: string;
    sigle: string;
    nature: string;
    niveau: number;
    parentId: string;
    posteResponsableLibelle: string;
  }>({
    defaultValues: { niveau: 2, nature: "Direction", parentId: "", posteResponsableLibelle: "" },
  });

  const [nature, sigle, libelle, niveau, parentId] = useWatch({
    control,
    name: ["nature", "sigle", "libelle", "niveau", "parentId"],
  });

  const propose = libellePosteResponsable(nature, sigle ?? "", libelle ?? "");

  useEffect(() => {
    if (!posteRepris) setValue("posteResponsableLibelle", propose);
  }, [propose, posteRepris, setValue]);

  /*
   * Les rattachements possibles : les structures d'un rang **strictement
   * superieur**, dans l'ordre de l'arbre.
   *
   * Le serveur refuse un parent de rang egal ou inferieur
   * (`structure_parente_incoherente`) ; le lui envoyer quand meme aurait fait
   * ressaisir tout le formulaire pour un choix que l'ecran connaissait deja.
   * Ce qu'il ne sait pas, en revanche : si le parent a bien un poste
   * responsable. Ce refus-la reste du serveur, et son message est affiche tel
   * quel.
   */
  const rattachements = useMemo(
    () => construireArbre(structures ?? []).filter((n) => n.structure.niveau < Number(niveau)),
    [structures, niveau],
  );

  // Un rattachement devenu incoherent apres coup — le rang a baisse — est
  // efface plutot que laisse en place : un choix invisiblement invalide se
  // serait solde par un refus serveur incomprehensible.
  useEffect(() => {
    if (parentId === "") return;
    if (!rattachements.some((n) => String(n.structure.id) === parentId)) setValue("parentId", "");
  }, [parentId, rattachements, setValue]);

  function fermer() {
    reset();
    creer.reset();
    setPosteRepris(false);
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        libelle: valeurs.libelle,
        sigle: valeurs.sigle.toUpperCase(),
        nature: valeurs.nature,
        niveau: Number(valeurs.niveau),
        parentId: valeurs.parentId === "" ? null : Number(valeurs.parentId),
        // Vide, le serveur compose le meme libelle : on le laisse faire plutot
        // que d'envoyer une chaine vide qu'il aurait a retraduire.
        posteResponsableLibelle: valeurs.posteResponsableLibelle.trim() || null,
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
      erreur={creer.isError ? messageDErreur(creer.error, "La structure n'a pas pu être ajoutée.") : null}
      consequence="Le référentiel alimente tous les modules : activités, décisions, scoring."
      largeur={560}
    >
      <Champ
        libelle="Intitulé"
        placeholder="Direction des affaires financières"
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

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Niveau hiérarchique"
          type="number"
          min={1}
          max={5}
          aide="1 pour la Direction générale, 2 pour les directions, 3 pour les départements, 4 pour les services."
          {...register("niveau", { required: true, min: 1, max: 5 })}
        />
        <Liste
          libelle="Rattachement"
          invite="Aucun — structure de sommet"
          options={rattachements.map((n) => ({
            valeur: String(n.structure.id),
            libelle: `${"— ".repeat(n.profondeur)}${n.structure.sigle} · ${n.structure.libelle}`,
          }))}
          aide="La structure mère dans l'organigramme. Seules celles d'un rang supérieur sont proposées."
          {...register("parentId")}
        />
      </div>

      <Champ
        libelle="Poste responsable"
        placeholder={propose || "Directeur de la structure"}
        aide="Le poste ouvert avec la structure. Laissé vide, il est composé depuis la nature et le sigle."
        {...register("posteResponsableLibelle", {
          onChange: () => setPosteRepris(true),
        })}
      />

      <Encart ton="accent" icone="organisation">
        La structure est créée avec ce poste <strong>vacant</strong> : personne n'est nommé à sa
        tête ici. L'affectation d'un agent, avec sa date d'effet, se fait dans l'onglet
        « Affectations » — et c'est elle qui remplira la colonne « Responsable » du référentiel.
      </Encart>
    </ModaleFormulaire>
  );
}
