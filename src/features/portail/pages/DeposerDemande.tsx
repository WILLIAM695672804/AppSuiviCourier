import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { Icone } from "@/components/ui/Icone";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import { mesDemandesQuery, useDeposerDemande } from "@/features/portail/api";

/**
 * Dépôt d'une demande — §3.13, premier point.
 *
 * Cinq champs, pas un de plus. Chaque champ ajouté à un formulaire public est
 * un motif d'abandon, et l'institution dispose de bien d'autres moyens de
 * réclamer une précision ensuite — c'est exactement ce que sert la demande de
 * complément.
 *
 * Le délai de réponse est annoncé **avant** le dépôt et non après. Un usager
 * qui sait qu'il attendra trente jours ne rappelle pas au bout de trois ;
 * celui qui ne sait rien appelle le standard.
 *
 * Ce délai vient du serveur, qui le règle en base et le fige sur la demande au
 * moment du dépôt. Il était écrit en dur ici : l'écran promettait trente jours
 * quoi qu'il arrive, et une direction qui aurait raccourci le délai aurait
 * découvert l'écart en lisant une réclamation.
 */
const TYPES = [
  {
    valeur: "Demande",
    libelle: "Demande — autorisation, information, document",
  },
  { valeur: "Réclamation", libelle: "Réclamation — contestation, litige" },
  {
    valeur: "Autorisation",
    libelle: "Autorisation — occupation, travaux, accès",
  },
  { valeur: "Requête", libelle: "Requête — révision d'une décision" },
];

interface Champs {
  type: string;
  objet: string;
  contexte: string;
}

export function DeposerDemande() {
  const naviguer = useNavigate();
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);
  const deposer = useDeposerDemande();
  // La liste des demandes porte le délai réglé : elle est déjà en cache quand
  // l'usager arrive ici depuis « Mes demandes », d'où aucune requête de plus.
  const { data: mesDemandes } = useQuery(mesDemandesQuery());
  const delai = mesDemandes?.delaiReponseJours;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Champs>({ defaultValues: { type: "Demande" } });

  const envoyer = handleSubmit((valeurs) => {
    deposer.mutate(
      {
        type: valeurs.type,
        objet: valeurs.objet,
        contexte: valeurs.contexte,
        pieces: fichiers.map((f) => ({ nom: f.nom, taille: f.taille })),
      },
      { onSuccess: (resultat) => naviguer(`/portail/demandes/${resultat.id}`) },
    );
  });

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/portail"
        className="flex w-fit items-center gap-1.5 text-[12.5px] leading-none font-semibold text-accent hover:underline"
      >
        <Icone nom="chevronGauche" taille={13} />
        Retour à mes demandes
      </Link>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-.5px] text-encre">
          Déposer une demande
        </h1>
        <p className="text-[13px] leading-[1.55] font-medium text-encre-faible">
          Vous recevrez un accusé de réception immédiat, puis une réponse
          {delai === undefined
            ? " dans le délai annoncé à l'enregistrement"
            : ` sous ${delai} jours`}
          .
        </p>
      </div>

      {deposer.isError && (
        <Encart ton="danger" icone="croix">
          Votre demande n'a pas pu être déposée. Réessayez dans quelques
          instants.
        </Encart>
      )}

      <form onSubmit={envoyer} className="flex flex-col gap-4">
        <Carte titre="Votre demande">
          <div className="mt-4 flex flex-col gap-4">
            <Liste
              libelle="De quoi s'agit-il ?"
              options={TYPES}
              aide="Le type oriente votre dossier vers le service compétent."
              {...register("type", { required: true })}
            />

            <Champ
              libelle="Objet"
              placeholder="Autorisation d'occupation temporaire du quai 4"
              aide="Une phrase suffit. C'est ce que verra le service en ouvrant votre dossier."
              erreur={errors.objet?.message}
              {...register("objet", {
                required: "Indiquez l'objet de votre demande.",
                minLength: {
                  value: 10,
                  message: "Précisez un peu : dix caractères au minimum.",
                },
              })}
            />

            <ChampTexteLong
              libelle="Votre demande en détail"
              placeholder="Ce que vous demandez, pour quelle période, et sur quel fondement."
              rows={6}
              erreur={errors.contexte?.message}
              {...register("contexte", {
                required: "Décrivez votre demande.",
                minLength: {
                  value: 30,
                  message: "Trente caractères au minimum.",
                },
              })}
            />

            <ZoneDepot
              libelle="Pièces justificatives"
              fichiers={fichiers}
              onChange={setFichiers}
              aide="Facultatif au dépôt. Le service vous réclamera les pièces manquantes si besoin."
            />
          </div>
        </Carte>

        <Encart ton="accent" icone="horloge">
          Une fois déposée, votre demande reçoit une référence que vous
          retrouverez dans « Mes demandes ». Vous serez averti à chaque étape,
          par le canal choisi dans vos préférences de notification.
        </Encart>

        <div className="flex flex-wrap items-center gap-3">
          <Bouton
            variante="principal"
            icone="exporter"
            chargement={deposer.isPending}
            onClick={envoyer}
          >
            {deposer.isPending ? "Dépôt en cours…" : "Déposer ma demande"}
          </Bouton>
          <Bouton onClick={() => naviguer("/portail")}>Annuler</Bouton>
        </div>
      </form>
    </div>
  );
}
