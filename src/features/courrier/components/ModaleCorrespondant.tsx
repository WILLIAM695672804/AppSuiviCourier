import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Champ, Liste } from "@/components/ui/Champ";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { api } from "@/lib/api";
import type { Correspondant } from "@/lib/referentiel";

/**
 * Creation d'une entree au carnet d'adresses, depuis l'ecran d'enregistrement.
 *
 * **Pourquoi ici et pas dans un ecran d'administration.** Le selecteur
 * d'expediteur ne laisse pas taper un nom au clavier — c'est ainsi qu'un meme
 * ministere finit ecrit de six manieres. Mais l'agent tient l'enveloppe en
 * main : sans cette modale, un expediteur absent du carnet arrete
 * l'enregistrement, et le courrier attend l'administrateur fonctionnel.
 *
 * Le serveur refuse un doublon de designation et le dit en clair : la modale
 * n'a donc pas a controler ce qu'elle ne peut pas savoir.
 */
const TYPES = [
  { valeur: "administration", libelle: "Administration" },
  { valeur: "externe", libelle: "Externe" },
  { valeur: "usager", libelle: "Usager" },
  { valeur: "interne", libelle: "Interne" },
];

interface SaisieCorrespondant {
  type: string;
  raisonSociale: string;
  nom: string;
  prenom: string;
  sigle: string;
  adresse: string;
  ville: string;
  courriel: string;
  telephone: string;
}

const VIDE: SaisieCorrespondant = {
  type: "administration",
  raisonSociale: "",
  nom: "",
  prenom: "",
  sigle: "",
  adresse: "",
  ville: "",
  courriel: "",
  telephone: "",
};

export function ModaleCorrespondant({
  ouverte,
  onFermer,
  onCree,
  /**
   * Ce que l'agent avait deja tape dans la recherche, repris tel quel.
   *
   * Lu a l'initialisation seulement : la page ne monte cette modale que
   * lorsqu'elle s'ouvre, donc l'etat repart de la saisie du moment. La monter
   * en permanence figerait ici la premiere recherche de la session.
   */
  saisieInitiale = "",
}: {
  ouverte: boolean;
  onFermer: () => void;
  onCree: (correspondant: Correspondant) => void;
  saisieInitiale?: string;
}) {
  const client = useQueryClient();
  const [saisie, setSaisie] = useState<SaisieCorrespondant>({
    ...VIDE,
    raisonSociale: saisieInitiale,
  });

  const creer = useMutation({
    mutationFn: (valeurs: SaisieCorrespondant) =>
      api.post<Correspondant>("/referentiels/correspondants", valeurs),
    onSuccess: (correspondant) => {
      // Le carnet vient de changer : les recherches en cache portent l'ancien.
      client.invalidateQueries({ queryKey: ["referentiel", "correspondants"] });
      onCree(correspondant);
    },
  });

  /** Une personne physique se designe par son nom, une organisation par sa raison sociale. */
  const personnePhysique = saisie.type === "usager";

  function modifier(champ: keyof SaisieCorrespondant, valeur: string) {
    setSaisie((precedent) => ({ ...precedent, [champ]: valeur }));
  }

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={() => {
        creer.reset();
        onFermer();
      }}
      onEnvoyer={() => creer.mutate(saisie)}
      titre="Créer un correspondant"
      sousTitre="L'entrée rejoint le référentiel partagé : elle servira à tous les courriers suivants."
      libelleEnvoi="Créer et retenir"
      consequence="La création est inscrite au journal."
      enCours={creer.isPending}
      erreur={
        creer.isError
          ? creer.error instanceof Error
            ? creer.error.message
            : "La création a échoué."
          : null
      }
    >
      <Liste
        libelle="Type"
        options={TYPES}
        value={saisie.type}
        onChange={(e) => modifier("type", e.target.value)}
      />

      {personnePhysique ? (
        <div className="grid grid-cols-2 gap-3.5">
          <Champ
            libelle="Nom"
            placeholder="Bamba"
            value={saisie.nom}
            onChange={(e) => modifier("nom", e.target.value)}
          />
          <Champ
            libelle="Prénom"
            placeholder="Sekou"
            value={saisie.prenom}
            onChange={(e) => modifier("prenom", e.target.value)}
          />
        </div>
      ) : (
        <Champ
          libelle="Raison sociale"
          placeholder="Ministère des Transports"
          aide="Le nom complet, tel qu'il figure sur le papier à en-tête. Pas de sigle seul : il rendrait la recherche des suivants impossible."
          value={saisie.raisonSociale}
          onChange={(e) => modifier("raisonSociale", e.target.value)}
        />
      )}

      {!personnePhysique && (
        <Champ
          libelle="Sigle"
          placeholder="MINT"
          aide="Ce que vos correspondants écrivent sur leur en-tête, et ce que l'agent tapera pour retrouver l'entrée."
          value={saisie.sigle}
          onChange={(e) => modifier("sigle", e.target.value)}
        />
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <Champ
          libelle="Ville"
          placeholder="Douala"
          value={saisie.ville}
          onChange={(e) => modifier("ville", e.target.value)}
        />
        <Champ
          libelle="Téléphone"
          placeholder="+237 …"
          value={saisie.telephone}
          onChange={(e) => modifier("telephone", e.target.value)}
        />
      </div>

      <Champ
        libelle="Adresse"
        placeholder="BP 4058, Douala"
        value={saisie.adresse}
        onChange={(e) => modifier("adresse", e.target.value)}
      />

      <Champ
        libelle="Courriel"
        type="email"
        placeholder="courrier@exemple.cm"
        value={saisie.courriel}
        onChange={(e) => modifier("courriel", e.target.value)}
      />
    </ModaleFormulaire>
  );
}
