import type { CarteBlocages, LignePassage } from "@/features/courrier/api";
import { COURRIERS_DEMO } from "@/lib/demo/donnees";

/**
 * Le registre du bureau d'ordre et la carte des blocages, en démonstration.
 *
 * Les deux dérivent des mêmes courriers que le registre : un jeu séparé aurait
 * montré un bureau d'ordre dont aucune ligne ne s'ouvre, et le premier clic
 * l'aurait révélé.
 *
 * **Les trois piles sont peuplées.** Un écran de démonstration qui n'aurait que
 * la pile du matin ferait croire que la sortie n'est pas livrée — c'est le
 * défaut que le reste du dépôt appelle « une forme vide qui passe pour un
 * écran ».
 */

const HEURE = 60 * 60 * 1000;
const JOUR = 24 * HEURE;

/** Un horodatage relatif à maintenant. Figer une date aurait vieilli le jeu. */
function ilYA(jours: number): string {
  return new Date(Date.now() - jours * JOUR).toISOString();
}

const COTES = COURRIERS_DEMO.filter((courrier) => courrier.structuresCotees.length > 0);

export const PASSAGES_DEMO: LignePassage[] = COTES.slice(0, 9).map((courrier, index) => {
  // Trois états, en boucle : deux entrées non accusées, trois en cours, une
  // sortie. La proportion imite un bureau d'ordre réel — le gros est « chez
  // nous », la pile du matin est courte, l'archive s'accumule.
  const rang = index % 6;
  const entreIlYA = 1 + index * 2;
  const accuse = rang >= 2;
  const sorti = rang === 5;

  return {
    id: 900 + index,
    courrierId: courrier.id,
    numero: courrier.numero,
    objet: courrier.objet,
    correspondant: courrier.correspondant,
    nature: courrier.nature,
    structure: courrier.structuresCotees[0],
    structureId: 3,
    etape: courrier.etape,
    entreLe: ilYA(entreIlYA),
    accuseLe: accuse ? ilYA(entreIlYA - 0.5) : null,
    accusePar: accuse ? "L. Mbarga" : null,
    sortiLe: sorti ? ilYA(1) : null,
    sortiPar: sorti ? "L. Mbarga" : null,
    motifSortie: sorti ? "reponse" : null,
    noteSortie: sorti ? "Réponse signée et remise au bureau d'ordre central." : null,
    joursDansLaStructure: sorti ? entreIlYA - 1 : entreIlYA,
    heuresAvantAccuse: accuse ? 12 : null,
  };
});

export function passagesDemo(etat: string): LignePassage[] {
  if (etat === "a_accuser") {
    return PASSAGES_DEMO.filter((p) => p.accuseLe === null && p.sortiLe === null);
  }
  if (etat === "sortis") return PASSAGES_DEMO.filter((p) => p.sortiLe !== null);
  return PASSAGES_DEMO.filter((p) => p.sortiLe === null);
}

/**
 * La carte des blocages.
 *
 * Les trois formes de blocage y figurent, et c'est le point : un agent nommé,
 * une structure qui n'a pas ouvert son courrier, et le bureau d'ordre central
 * qui attend la cotation. La troisième est la plus facile à oublier, et c'est
 * elle qui explique les délais les plus longs.
 */
const DETENTEURS = [
  { detenteur: "J. Ateba", motif: "Affecté, traitement en cours" },
  { detenteur: null, motif: "Reçu, non accusé par le bureau d'ordre" },
  { detenteur: "R. Owona", motif: "Affecté, traitement en cours" },
];

export function carteBlocagesDemo(seuil: number): CarteBlocages {
  const lignes = COURRIERS_DEMO.filter((courrier) => courrier.etape !== "CLOTURE")
    .map((courrier, index) => {
      const immobilise = (courrier.delai?.joursEcoules ?? 0) + (index % 4);
      const source =
        courrier.structuresCotees.length === 0
          ? { detenteur: null, motif: "Enregistré, en attente de cotation" }
          : DETENTEURS[index % DETENTEURS.length];

      return {
        courrierId: courrier.id,
        numero: courrier.numero,
        objet: courrier.objet,
        correspondant: courrier.correspondant,
        etape: courrier.etape,
        echeance: courrier.echeance,
        joursDepassement: courrier.delai?.joursDepassement ?? 0,
        detenteur: source.detenteur,
        structure: courrier.structuresCotees[0] ?? null,
        motif: source.motif,
        depuis: ilYA(immobilise),
        joursImmobilise: immobilise,
      };
    })
    .filter((ligne) => ligne.joursImmobilise >= seuil)
    .sort((a, b) => b.joursImmobilise - a.joursImmobilise);

  const horsDelai = lignes.filter((ligne) => ligne.joursDepassement > 0).length;
  const sansAccuse = lignes.filter((ligne) => ligne.motif.startsWith("Reçu")).length;
  const plusAncien = lignes.length > 0 ? lignes[0].joursImmobilise : 0;

  return {
    lignes,
    total: lignes.length,
    arreteLe: new Date().toISOString(),
    resume: [
      { libelle: "En cours", valeur: String(lignes.length), ton: "neutre" },
      {
        libelle: "Hors délai",
        valeur: String(horsDelai),
        ton: horsDelai ? "alerte" : "succes",
      },
      {
        libelle: "Sans accusé de réception",
        valeur: String(sansAccuse),
        ton: sansAccuse ? "alerte" : "succes",
      },
      {
        libelle: "Immobilisation la plus longue",
        valeur: `${plusAncien} j`,
        ton: plusAncien > 15 ? "alerte" : "neutre",
      },
    ],
  };
}
