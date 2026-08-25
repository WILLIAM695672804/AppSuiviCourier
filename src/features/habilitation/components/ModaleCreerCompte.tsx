import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { Champ, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { PORTEES, profilsQuery, useCreerCompte } from "@/features/habilitation/api";
import { messageDErreur } from "@/lib/erreurApi";
import { postesQuery, structuresQuery } from "@/lib/referentiel";

/**
 * Créer un compte — G-01.
 *
 * Le formulaire impose le **profil** et la **portée**, comme le serveur. Ce
 * n'est pas de la rigidité : un compte sans profil ne peut rien, un compte sans
 * périmètre ne voit rien. Un agent ainsi créé se connecterait parfaitement et
 * n'obtiendrait que des listes vides — la panne qu'on cherche ensuite dans le
 * filtrage, dans les écrans, partout sauf là où elle est.
 *
 * Le mot de passe est facultatif et le restera peu : l'authentification doit
 * revenir à l'annuaire (RF-ADM-02). Laissé vide, le compte existe et attend le
 * SSO — il ne peut pas ouvrir de session. C'est écrit sous le champ, parce que
 * créer un compte inutilisable sans le savoir est le piège de cet écran.
 *
 * La liste des postes dépend de la structure choisie : le serveur refuse un
 * poste qui n'en relève pas, et une liste complète mêlerait huit « Chef de
 * service » que rien ne distinguerait.
 */
type Formulaire = {
  identifiant: string;
  prenom: string;
  nom: string;
  courriel: string;
  telephone: string;
  matricule: string;
  motDePasse: string;
  structureId: string;
  posteId: string;
  profilId: string;
  portee: string;
  perimetreStructureId: string;
};

export function ModaleCreerCompte({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  const { data: structures = [] } = useQuery({ ...structuresQuery(), enabled: ouverte });
  const { data: profils = [] } = useQuery({ ...profilsQuery(), enabled: ouverte });
  const creer = useCreerCompte();

  const {
    register,
    handleSubmit,
    control,
    resetField,
    reset,
    formState: { errors },
  } = useForm<Formulaire>({ defaultValues: { portee: "structure" } });

  // `useWatch` et non `watch()` : la seconde renvoie une fonction que le
  // compilateur React ne peut pas memoiser, et il cesse alors d'optimiser tout
  // le composant.
  const structureId = useWatch({ control, name: "structureId" }) ?? "";
  const portee = useWatch({ control, name: "portee" }) ?? "structure";
  const { data: postes = [] } = useQuery(postesQuery(structureId ? Number(structureId) : null));

  // Le poste retenu doit relever de la structure retenue. Changer de structure
  // sans vider le poste enverrait une paire que le serveur refuserait — refus
  // exact, mais qui arriverait apres la saisie complete.
  const [derniereStructure, setDerniereStructure] = useState("");
  if (structureId !== derniereStructure) {
    setDerniereStructure(structureId);
    if (derniereStructure) resetField("posteId");
  }

  function fermer() {
    reset();
    creer.reset();
    onFermer();
  }

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        identifiant: valeurs.identifiant.trim(),
        prenom: valeurs.prenom,
        nom: valeurs.nom,
        structureId: Number(valeurs.structureId),
        posteId: Number(valeurs.posteId),
        profilId: Number(valeurs.profilId),
        portee: valeurs.portee,
        // « Institution » ne se borne a rien : le serveur refuse qu'on lui
        // passe une structure. Les trois autres portent celle de l'agent, sauf
        // choix explicite.
        perimetreStructureId:
          valeurs.portee === "toutes"
            ? null
            : valeurs.perimetreStructureId
              ? Number(valeurs.perimetreStructureId)
              : null,
        courriel: valeurs.courriel || null,
        telephone: valeurs.telephone || null,
        matricule: valeurs.matricule || null,
        motDePasse: valeurs.motDePasse || null,
      },
      { onSuccess: fermer },
    );
  });

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre="Créer un compte"
      sousTitre="Le profil dit ce que l'agent peut faire, le périmètre dit sur quoi"
      libelleEnvoi="Créer le compte"
      enCours={creer.isPending}
      erreur={creer.isError ? messageDErreur(creer.error, "Le compte n'a pas pu être créé.") : null}
      consequence="La création, l'attribution du profil et la pose du périmètre sont inscrites au journal."
      largeur={680}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          libelle="Prénom"
          erreur={errors.prenom?.message}
          {...register("prenom", { required: "Le prénom est obligatoire." })}
        />
        <Champ
          libelle="Nom"
          erreur={errors.nom?.message}
          {...register("nom", { required: "Le nom est obligatoire." })}
        />
      </div>

      <Champ
        libelle="Identifiant d'annuaire"
        placeholder="p.nom"
        aide="C'est lui qui fera le rapprochement avec l'annuaire, pas l'adresse électronique."
        erreur={errors.identifiant?.message}
        {...register("identifiant", { required: "L'identifiant est obligatoire." })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Champ libelle="Adresse électronique" type="email" {...register("courriel")} />
        <Champ libelle="Matricule" {...register("matricule")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Liste
          libelle="Structure de rattachement"
          invite="Choisir la structure…"
          options={structures.map((s) => ({
            valeur: String(s.id),
            libelle: `${s.sigle} — ${s.libelle}`,
          }))}
          erreur={errors.structureId?.message}
          {...register("structureId", { required: "Choisissez la structure." })}
        />
        <Liste
          libelle="Poste"
          invite={structureId ? "Choisir le poste…" : "Choisissez d'abord la structure"}
          disabled={!structureId}
          aide="Seuls les postes de la structure choisie sont proposés."
          options={postes.map((p) => ({ valeur: String(p.id), libelle: p.libelle }))}
          erreur={errors.posteId?.message}
          {...register("posteId", { required: "Choisissez le poste." })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Liste
          libelle="Profil"
          invite="Choisir le profil…"
          aide="Un agent peut en porter plusieurs ; celui-ci est le premier."
          options={profils.map((p) => ({ valeur: String(p.id), libelle: p.libelle }))}
          erreur={errors.profilId?.message}
          {...register("profilId", { required: "Le profil est obligatoire." })}
        />
        <Liste
          libelle="Étendue des données visibles"
          options={PORTEES.map((p) => ({ valeur: p.valeur, libelle: p.libelle }))}
          aide={PORTEES.find((p) => p.valeur === portee)?.aide}
          {...register("portee", { required: true })}
        />
      </div>

      {portee !== "toutes" && (
        <Liste
          libelle="Périmètre appuyé sur"
          invite="La structure de rattachement"
          aide="Laissez vide dans le cas courant : le périmètre suit la structure de l'agent."
          options={structures.map((s) => ({
            valeur: String(s.id),
            libelle: `${s.sigle} — ${s.libelle}`,
          }))}
          {...register("perimetreStructureId")}
        />
      )}

      <Champ
        libelle="Mot de passe initial"
        type="password"
        autoComplete="new-password"
        aide="Facultatif. Laissé vide, le compte existe mais ne pourra pas se connecter tant que l'annuaire n'est pas branché."
        {...register("motDePasse")}
      />

      <Encart ton="alerte" icone="bouclier">
        Le profil et l'étendue sont obligatoires. Un compte sans profil ne peut rien ; un compte sans
        périmètre se connecte et n'obtient que des listes vides.
      </Encart>
    </ModaleFormulaire>
  );
}
