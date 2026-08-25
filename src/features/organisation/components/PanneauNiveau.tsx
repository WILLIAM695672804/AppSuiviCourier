import { useState } from "react";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Champ, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import {
  useCreerNiveau,
  useModifierNiveau,
  type NiveauHierarchique,
} from "@/features/organisation/api";
import { messageDErreur } from "@/lib/erreurApi";

/**
 * Créer ou modifier un étage de l'organigramme — F-02.
 *
 * Un seul panneau pour les deux gestes, parce que ce sont les mêmes champs à
 * deux exceptions près : le **code** et le **rang** n'apparaissent qu'à la
 * création. Le rang ordonne tout le référentiel ; le corriger au milieu d'un
 * formulaire déplacerait d'un coup toutes les structures de l'étage, et le
 * serveur le refuse pour cette raison.
 *
 * Le panneau ne supprime pas. Un étage porté par des structures ne peut pas
 * l'être — le socle le protège — et un étage vide qui disparaît emporte les
 * lignes d'historique qui le citent. C'est écrit à l'écran plutôt que caché
 * derrière un bouton grisé dont personne ne devinerait la raison.
 */
export function PanneauNiveau({
  choisi,
  niveaux,
  onEnregistre,
}: {
  choisi: NiveauHierarchique | null;
  niveaux: readonly NiveauHierarchique[];
  onEnregistre: () => void;
}) {
  const creer = useCreerNiveau();
  const modifier = useModifierNiveau(choisi?.id ?? 0);

  // La saisie est remise a zero des que la selection change. Sans cela, le
  // libelle tape pour un etage se retrouverait dans le formulaire du suivant.
  const [derniereSelection, setDerniereSelection] = useState<number | null>(null);
  const [saisie, setSaisie] = useState<Saisie>(vide);

  if ((choisi?.id ?? null) !== derniereSelection) {
    setDerniereSelection(choisi?.id ?? null);
    setSaisie(choisi ? depuis(choisi) : vide());
    creer.reset();
    modifier.reset();
  }

  const enCours = creer.isPending || modifier.isPending;
  const refus = creer.error ?? modifier.error ?? null;

  function enregistrer() {
    if (choisi) {
      // Seuls les ecarts partent : le serveur traite `undefined` comme
      // « ne touche pas », et lui renvoyer les huit valeurs ferait entrer au
      // journal une modification qui n'a rien modifie.
      modifier.mutate(ecarts(choisi, saisie), { onSuccess: onEnregistre });
    } else {
      creer.mutate(
        {
          code: saisie.code.trim().toUpperCase(),
          libelle: saisie.libelle.trim(),
          rang: Number(saisie.rang),
          niveauParentId: saisie.niveauParentId,
          peutCoter: saisie.peutCoter,
          peutRecevoirCotation: saisie.peutRecevoirCotation,
          porteSignature: saisie.porteSignature,
          ligneStatistiques: saisie.ligneStatistiques,
        },
        { onSuccess: onEnregistre },
      );
    }
  }

  const complet = choisi
    ? saisie.libelle.trim().length > 0
    : saisie.code.trim().length > 0 && saisie.libelle.trim().length > 0 && saisie.rang !== "";

  return (
    <Carte titre={choisi ? "Modifier le niveau" : "Ajouter un niveau"}>
      <div className="mt-3.5 flex flex-col gap-3.5">
        {refus && (
          <Encart ton="danger" icone="croix">
            {messageDErreur(refus, "Le niveau n'a pas pu être enregistré.")}
          </Encart>
        )}

        {!choisi && (
          <div className="grid gap-3.5 md:grid-cols-[1fr_92px]">
            <Champ
              libelle="Code"
              placeholder="BUR"
              aide="Court et stable : il ne se modifie plus ensuite."
              value={saisie.code}
              onChange={(e) => setSaisie({ ...saisie, code: e.target.value })}
            />
            <Champ
              libelle="Rang"
              type="number"
              min={1}
              aide="1 = sommet."
              value={saisie.rang}
              onChange={(e) => setSaisie({ ...saisie, rang: e.target.value })}
            />
          </div>
        )}

        <Champ
          libelle="Libellé"
          placeholder="Direction, Service, Bureau…"
          value={saisie.libelle}
          onChange={(e) => setSaisie({ ...saisie, libelle: e.target.value })}
        />

        <Liste
          libelle="Niveau parent autorisé"
          invite="Aucun — niveau racine"
          options={niveaux
            .filter((n) => n.id !== choisi?.id)
            .map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
          value={saisie.niveauParentId === null ? "" : String(saisie.niveauParentId)}
          onChange={(e) =>
            setSaisie({
              ...saisie,
              niveauParentId: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />

        <div className="flex flex-col gap-2.5 border-t border-separateur pt-3.5">
          <span className="text-[11px] leading-none font-semibold text-encre-faible">
            Ce que le niveau autorise
          </span>
          <CaseLibellee
            cochee={saisie.peutCoter}
            onChange={(v) => setSaisie({ ...saisie, peutCoter: v })}
            libelle="Peut coter vers un niveau inférieur"
          />
          <CaseLibellee
            cochee={saisie.peutRecevoirCotation}
            onChange={(v) => setSaisie({ ...saisie, peutRecevoirCotation: v })}
            libelle="Peut recevoir une cotation"
          />
          <CaseLibellee
            cochee={saisie.porteSignature}
            onChange={(v) => setSaisie({ ...saisie, porteSignature: v })}
            libelle="Porte la signature des courriers départ"
          />
          <CaseLibellee
            cochee={saisie.ligneStatistiques}
            onChange={(v) => setSaisie({ ...saisie, ligneStatistiques: v })}
            libelle="Apparaît comme ligne des statistiques"
          />
        </div>

        {choisi && choisi.nombreStructures > 0 && (
          <Encart ton="alerte" icone="aide">
            {choisi.nombreStructures} structures utilisent ce niveau. Modifier ce qu'il autorise
            change le circuit de tous leurs courriers en cours.
          </Encart>
        )}

        {choisi && (
          <Encart ton="accent" icone="aide">
            Le rang ne se corrige pas ici : il ordonne tout le référentiel, et le changer
            déplacerait d'un coup toutes les structures de cet étage.
          </Encart>
        )}

        <Bouton
          variante="principal"
          className="justify-center"
          disabled={enCours || !complet}
          onClick={enregistrer}
        >
          {choisi ? "Enregistrer les modifications" : "Créer le niveau"}
        </Bouton>
      </div>
    </Carte>
  );
}

/* ------------------------------------------------------------------ *
 *  L'etat de saisie
 *
 *  `rang` est une chaine et non un nombre : un champ numerique vide rend
 *  `""`, et le forcer en nombre ferait apparaitre 0 des la premiere frappe
 *  effacee.
 * ------------------------------------------------------------------ */

interface Saisie {
  code: string;
  libelle: string;
  rang: string;
  niveauParentId: number | null;
  peutCoter: boolean;
  peutRecevoirCotation: boolean;
  porteSignature: boolean;
  ligneStatistiques: boolean;
}

function vide(): Saisie {
  return {
    code: "",
    libelle: "",
    rang: "",
    niveauParentId: null,
    peutCoter: false,
    // Les deux defauts du modele : un etage qui ne recoit pas de cotation ne
    // travaille pas, et un etage absent des statistiques disparait des
    // tableaux de bord sans que personne ne l'ait voulu.
    peutRecevoirCotation: true,
    porteSignature: false,
    ligneStatistiques: true,
  };
}

function depuis(niveau: NiveauHierarchique): Saisie {
  return {
    code: "",
    libelle: niveau.libelle,
    rang: String(niveau.rang),
    niveauParentId: niveau.niveauParentId,
    peutCoter: niveau.peutCoter,
    peutRecevoirCotation: niveau.peutRecevoirCotation,
    porteSignature: niveau.porteSignature,
    ligneStatistiques: niveau.ligneStatistiques,
  };
}

/** Ce qui a bougé, et rien d'autre. */
function ecarts(niveau: NiveauHierarchique, saisie: Saisie) {
  return {
    ...(saisie.libelle !== niveau.libelle ? { libelle: saisie.libelle.trim() } : {}),
    ...(saisie.niveauParentId !== niveau.niveauParentId
      ? { niveauParentId: saisie.niveauParentId }
      : {}),
    ...(saisie.peutCoter !== niveau.peutCoter ? { peutCoter: saisie.peutCoter } : {}),
    ...(saisie.peutRecevoirCotation !== niveau.peutRecevoirCotation
      ? { peutRecevoirCotation: saisie.peutRecevoirCotation }
      : {}),
    ...(saisie.porteSignature !== niveau.porteSignature
      ? { porteSignature: saisie.porteSignature }
      : {}),
    ...(saisie.ligneStatistiques !== niveau.ligneStatistiques
      ? { ligneStatistiques: saisie.ligneStatistiques }
      : {}),
  };
}
