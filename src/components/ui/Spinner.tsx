/**
 * Indicateur d'activité.
 *
 * Réservé aux attentes **courtes et localisées** : un bouton qui envoie, un
 * filtre qui recharge. Pour une page ou une liste, on préfère un squelette :
 * il conserve la mise en page et évite le saut visuel au moment où les données
 * arrivent.
 *
 * L'animation est désactivée pour qui a demandé moins de mouvement dans son
 * système. Le cercle reste alors visible, simplement immobile — c'est le
 * comportement attendu : l'information « ça travaille » ne doit pas disparaître
 * avec l'animation.
 */
export function Spinner({
  taille = 16,
  /** Texte lu par les lecteurs d'écran. Le cercle seul ne dit rien. */
  libelle = "Chargement en cours",
  className = "",
}: {
  taille?: number;
  libelle?: string;
  className?: string;
}) {
  return (
    <span role="status" className={`inline-flex items-center ${className}`}>
      <svg
        width={taille}
        height={taille}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="motion-safe:animate-spin"
      >
        <circle
          cx="8"
          cy="8"
          r="6.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.22"
        />
        <path
          d="M14.2 8A6.2 6.2 0 0 0 8 1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{libelle}</span>
    </span>
  );
}
