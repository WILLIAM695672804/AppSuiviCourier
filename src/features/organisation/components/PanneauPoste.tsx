import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Champ, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import {
  useCloturerPoste,
  useCreerPoste,
  useModifierPoste,
  type NiveauHierarchique,
  type PosteTravail,
} from "@/features/organisation/api";
import { profilsQuery } from "@/features/habilitation/api";
import { usePermission } from "@/lib/contexteSession";
import { messageDErreur } from "@/lib/erreurApi";
import { construireArbre, structuresQuery } from "@/lib/referentiel";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Créer, corriger ou clôturer un poste de travail — F-03.
 *
 * Jumeau de `PanneauNiveau`, et pour la même raison : ce sont les mêmes champs
 * à une exception près. La **structure** n'apparaît qu'à la création — déplacer
 * un poste d'une direction à une autre n'est pas une correction mais une
 * réorganisation, qui clôt le poste ici et en ouvre un là-bas. Le serveur
 * refuse de le faire en une modification, et l'écran ne le propose donc pas.
 *
 * Le panneau ne supprime pas, il **clôture**. Effacer un poste effacerait qui a
 * validé quoi à cet étage. La clôture demande un motif, parce qu'une fermeture
 * sans raison est indistinguable d'une fausse manœuvre six mois plus tard.
 *
 * **Le profil par défaut n'est proposé qu'à qui porte `ADM_HAB`.** Le catalogue
 * des profils relève de l'administrateur des habilitations, pas de celui de
 * l'organigramme (§3.9) — et les deux mains sont volontairement distinctes.
 * Sans cette permission, le champ est absent et la valeur en place est
 * conservée : envoyer `null` effacerait un choix que l'on n'a pas vu.
 */
export function PanneauPoste({
  choisi,
  postes,
  niveaux,
  onEnregistre,
}: {
  choisi: PosteTravail | null;
  postes: readonly PosteTravail[];
  niveaux: readonly NiveauHierarchique[];
  onEnregistre: () => void;
}) {
  const voitLesProfils = usePermission(PERMISSIONS.ADM_HAB);
  const { data: structures = [] } = useQuery(structuresQuery());
  const { data: profils = [] } = useQuery({ ...profilsQuery(), enabled: voitLesProfils });

  const creer = useCreerPoste();
  const modifier = useModifierPoste(choisi?.id ?? 0);
  const cloturer = useCloturerPoste(choisi?.id ?? 0);

  // L'état part de la sélection courante et n'en est plus resynchronisé : c'est
  // l'appelant qui remonte ce panneau, par une `key` portant la sélection et un
  // compteur de remise à zéro. La réinitialisation vivait ici, en phase de
  // rendu, comparée à la sélection précédente — et ne pouvait donc pas voir deux
  // fois la même valeur : redemander « Ajouter » alors que rien n'était
  // sélectionné ne réinitialisait rien, et le bouton paraissait mort.
  const [saisie, setSaisie] = useState<Saisie>(() => (choisi ? depuis(choisi) : vide()));
  // La clôture est repliée par défaut : c'est le geste irréversible du panneau,
  // et il ne doit pas se trouver sous le curseur de qui venait corriger un
  // libellé.
  const [clotureOuverte, setClotureOuverte] = useState(false);
  const [motifCloture, setMotifCloture] = useState("");

  const enCours = creer.isPending || modifier.isPending || cloturer.isPending;
  const refus = creer.error ?? modifier.error ?? cloturer.error ?? null;

  function enregistrer() {
    if (choisi) {
      modifier.mutate(ecarts(choisi, saisie, voitLesProfils), { onSuccess: onEnregistre });
    } else {
      creer.mutate(
        {
          structureId: Number(saisie.structureId),
          libelle: saisie.libelle.trim(),
          niveauId: Number(saisie.niveauId),
          posteSuperieurId: saisie.posteSuperieurId,
          profilParDefautId: voitLesProfils ? saisie.profilParDefautId : null,
          effectifPrevu: Number(saisie.effectifPrevu) || 1,
        },
        { onSuccess: onEnregistre },
      );
    }
  }

  const complet = choisi
    ? saisie.libelle.trim().length > 0
    : saisie.libelle.trim().length > 0 && saisie.structureId !== "" && saisie.niveauId !== "";

  // L'arbre plutôt que la liste : un poste se rattache à une structure, et
  // l'indentation dit laquelle dépend de laquelle.
  const noeuds = construireArbre(structures);

  return (
    <Carte titre={choisi ? "Modifier le poste" : "Ajouter un poste"}>
      <div className="mt-3.5 flex flex-col gap-3.5">
        {refus && (
          <Encart ton="danger" icone="croix">
            {messageDErreur(refus, "Le poste n'a pas pu être enregistré.")}
          </Encart>
        )}

        {!choisi && (
          <Liste
            libelle="Structure"
            invite="Choisir une structure"
            aide="Elle ne se corrige plus ensuite : changer de structure clôt le poste et en ouvre un autre."
            options={noeuds.map((n) => ({
              valeur: String(n.structure.id),
              libelle: `${"— ".repeat(n.profondeur)}${n.structure.sigle} · ${n.structure.libelle}`,
            }))}
            value={saisie.structureId}
            onChange={(e) => setSaisie({ ...saisie, structureId: e.target.value })}
          />
        )}

        <Champ
          libelle="Libellé du poste"
          placeholder="Chef de service du courrier central"
          value={saisie.libelle}
          onChange={(e) => setSaisie({ ...saisie, libelle: e.target.value })}
        />

        <div className="grid gap-3.5 md:grid-cols-[1fr_104px]">
          <Liste
            libelle="Niveau hiérarchique"
            invite="Choisir un niveau"
            options={niveaux.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
            value={saisie.niveauId}
            onChange={(e) => setSaisie({ ...saisie, niveauId: e.target.value })}
          />
          <Champ
            libelle="Effectif prévu"
            type="number"
            min={1}
            aide="L'écart rend le poste vacant visible."
            value={saisie.effectifPrevu}
            onChange={(e) => setSaisie({ ...saisie, effectifPrevu: e.target.value })}
          />
        </div>

        <Liste
          libelle="Poste supérieur"
          invite="Aucun — poste de sommet"
          aide="Souvent hors de la structure : le supérieur d'un chef de service est le directeur."
          options={postes
            .filter((p) => p.id !== choisi?.id)
            .map((p) => ({ valeur: String(p.id), libelle: `${p.structure} · ${p.libelle}` }))}
          value={saisie.posteSuperieurId === null ? "" : String(saisie.posteSuperieurId)}
          onChange={(e) =>
            setSaisie({
              ...saisie,
              posteSuperieurId: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />

        {voitLesProfils ? (
          <Liste
            libelle="Profil proposé par défaut"
            invite="Aucun — à choisir compte par compte"
            aide="Une proposition à la création d'un compte, jamais une attribution."
            options={profils.map((p) => ({ valeur: String(p.id), libelle: p.libelle }))}
            value={saisie.profilParDefautId === null ? "" : String(saisie.profilParDefautId)}
            onChange={(e) =>
              setSaisie({
                ...saisie,
                profilParDefautId: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        ) : (
          choisi && (
            <Encart ton="neutre" icone="aide">
              Profil proposé : <strong>{choisi.profilParDefaut}</strong>. Le modifier relève de
              l'administrateur des habilitations ; il est conservé tel quel.
            </Encart>
          )
        )}

        {choisi && choisi.titulaires > 0 && (
          <Encart ton="alerte" icone="aide">
            {choisi.titulaires === 1
              ? "Un agent occupe ce poste. "
              : `${choisi.titulaires} agents occupent ce poste. `}
            Changer son niveau change ce qu'il peut coter et signer, pour eux, immédiatement.
          </Encart>
        )}

        <Bouton
          variante="principal"
          className="justify-center"
          disabled={enCours || !complet}
          onClick={enregistrer}
        >
          {choisi ? "Enregistrer les modifications" : "Créer le poste"}
        </Bouton>

        {choisi && (
          <div className="flex flex-col gap-2.5 border-t border-separateur pt-3.5">
            {clotureOuverte ? (
              <>
                <Encart ton="alerte" icone="bouclier">
                  La clôture ne supprime rien : le poste sort de l'organigramme et son histoire
                  reste lisible.
                  {choisi.titulaires > 0 &&
                    " Ses titulaires se retrouveront sans poste — affectez-les ailleurs d'abord."}
                </Encart>
                <Champ
                  libelle="Motif de la clôture"
                  placeholder="Réorganisation de la direction, poste fusionné avec…"
                  value={motifCloture}
                  onChange={(e) => setMotifCloture(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <Bouton className="justify-center" onClick={() => setClotureOuverte(false)}>
                    Annuler
                  </Bouton>
                  <Bouton
                    className="justify-center text-danger"
                    disabled={enCours || motifCloture.trim().length === 0}
                    onClick={() =>
                      cloturer.mutate(
                        { motif: motifCloture.trim() },
                        { onSuccess: onEnregistre },
                      )
                    }
                  >
                    Clôturer le poste
                  </Bouton>
                </div>
              </>
            ) : (
              <Bouton
                icone="croix"
                className="justify-center"
                onClick={() => setClotureOuverte(true)}
              >
                Clôturer ce poste
              </Bouton>
            )}
          </div>
        )}
      </div>
    </Carte>
  );
}

/* ------------------------------------------------------------------ *
 *  L'etat de saisie
 *
 *  Les identifiants et l'effectif sont des chaines et non des nombres : un
 *  `select` vide rend `""`, et le forcer en nombre ferait apparaitre 0 la ou
 *  rien n'est choisi.
 * ------------------------------------------------------------------ */

interface Saisie {
  structureId: string;
  libelle: string;
  niveauId: string;
  effectifPrevu: string;
  posteSuperieurId: number | null;
  profilParDefautId: number | null;
}

function vide(): Saisie {
  return {
    structureId: "",
    libelle: "",
    niveauId: "",
    // Le defaut du modele serveur : un poste compte un agent sauf mention
    // contraire, et un effectif a zero rendrait tous les postes vacants.
    effectifPrevu: "1",
    posteSuperieurId: null,
    profilParDefautId: null,
  };
}

function depuis(poste: PosteTravail): Saisie {
  return {
    structureId: String(poste.structureId),
    libelle: poste.libelle,
    niveauId: String(poste.niveauId),
    effectifPrevu: String(poste.postesPrevus),
    posteSuperieurId: poste.posteSuperieurId,
    profilParDefautId: poste.profilParDefautId,
  };
}

/**
 * Ce qui a bougé, et rien d'autre.
 *
 * Le serveur traite `undefined` comme « ne touche pas » : lui renvoyer les cinq
 * valeurs ferait entrer au journal une modification qui n'a rien modifié.
 */
function ecarts(poste: PosteTravail, saisie: Saisie, voitLesProfils: boolean) {
  return {
    ...(saisie.libelle !== poste.libelle ? { libelle: saisie.libelle.trim() } : {}),
    ...(Number(saisie.niveauId) !== poste.niveauId ? { niveauId: Number(saisie.niveauId) } : {}),
    ...(saisie.posteSuperieurId !== poste.posteSuperieurId
      ? { posteSuperieurId: saisie.posteSuperieurId }
      : {}),
    ...(voitLesProfils && saisie.profilParDefautId !== poste.profilParDefautId
      ? { profilParDefautId: saisie.profilParDefautId }
      : {}),
    ...(Number(saisie.effectifPrevu) !== poste.postesPrevus
      ? { effectifPrevu: Number(saisie.effectifPrevu) }
      : {}),
  };
}
