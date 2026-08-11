import { Feu } from "@/components/ui/Feu";
import { SqueletteCompteurs } from "@/components/ui/Squelette";
import type { NiveauFeu } from "@/lib/feu";

export interface Compteur {
  libelle: string;
  /**
   * Nombre nu, ou chaîne déjà formatée quand la mesure porte une unité —
   * « 99,8 % », « 6,4 j », « 3 / 5 ». Le formatage vient du serveur : c'est
   * lui qui sait si un taux se dit en points ou en pourcentage.
   */
  valeur: number | string;
  note: string;
  feu: NiveauFeu;
}

/**
 * Les quatre chiffres qui ouvrent chaque registre de la gouvernance.
 *
 * Ils répondent à la seule question que la DSR se pose en arrivant : qu'est-ce
 * qui ne va pas ce matin. D'où la pastille sur chaque carte — un compteur qui
 * dit « 3 » sans dire si c'est grave n'aide personne.
 *
 * Deux colonnes sur téléphone, quatre à partir de `md` : quatre cartes côte à
 * côte sur 390 px donneraient des chiffres illisibles.
 */
export function BandeauCompteurs({
  compteurs,
  chargement = false,
}: {
  compteurs: Compteur[];
  /** Blocs de remplacement, tant que les chiffres ne sont pas arrivés. */
  chargement?: boolean;
}) {
  /*
   * Un zéro affiché avant la réponse est un mensonge : « aucune décision hors
   * délai » et « on ne sait pas encore » se lisent pareil, et le premier
   * rassure à tort. D'où le squelette plutôt qu'un compteur à zéro.
   */
  if (chargement || compteurs.length === 0) {
    return <SqueletteCompteurs />;
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {compteurs.map((compteur) => (
        <div
          key={compteur.libelle}
          className="flex flex-col gap-2 rounded-none border border-bordure bg-surface px-4 py-3.5"
        >
          <span className="truncate text-[11px] leading-none font-semibold text-encre-moyenne">
            {compteur.libelle}
          </span>
          <span className="text-[22px] leading-none font-extrabold text-encre tabular-nums">
            {compteur.valeur}
          </span>
          {compteur.feu === "inconnu" ? (
            <span className="text-[10.5px] leading-[1.35] font-medium text-encre-tenue">
              {compteur.note}
            </span>
          ) : (
            <Feu niveau={compteur.feu} libelle={compteur.note} />
          )}
        </div>
      ))}
    </div>
  );
}
