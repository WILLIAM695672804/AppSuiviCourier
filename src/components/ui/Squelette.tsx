/**
 * Blocs de remplacement affichés pendant le chargement.
 *
 * Un squelette plutôt qu'un spinner dès qu'on connaît la forme de ce qui va
 * arriver. Trois raisons, et la troisième est la plus importante :
 *
 *  — la mise en page ne saute pas quand les données arrivent, parce qu'elle
 *    était déjà là ;
 *  — l'attente paraît plus courte, l'œil ayant quelque chose à parcourir ;
 *  — l'agent voit **où** l'information apparaîtra, et peut préparer son geste
 *    — sur un poste où l'on enchaîne cinq cents courriers par jour, ce demi-
 *    seconde gagnée à chaque écran compte.
 *
 * L'animation s'arrête pour qui a demandé moins de mouvement : les blocs
 * restent gris, ce qui suffit à dire que rien n'est encore là.
 */
const BASE = "block rounded-none bg-inerte motion-safe:animate-pulse";

export function Squelette({
  largeur = "100%",
  hauteur = 12,
  className = "",
}: {
  largeur?: string | number;
  hauteur?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${BASE} ${className}`}
      style={{ width: largeur, height: hauteur }}
    />
  );
}

/**
 * Lignes de texte de longueurs inégales.
 *
 * Des barres toutes identiques ne ressemblent à rien de lisible ; on décroît
 * la dernière pour imiter un paragraphe.
 */
export function SqueletteTexte({ lignes = 3 }: { lignes?: number }) {
  return (
    <span aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lignes }, (_, index) => (
        <Squelette
          key={index}
          largeur={index === lignes - 1 ? "62%" : index % 2 === 0 ? "100%" : "88%"}
        />
      ))}
    </span>
  );
}

/** Carte en attente : un titre, quelques lignes. */
export function SqueletteCarte({ lignes = 3 }: { lignes?: number }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-none border border-[color:var(--color-bordure-carte)] bg-surface px-5 pt-[18px] pb-5"
    >
      <Squelette largeur={160} hauteur={14} />
      <div className="mt-4">
        <SqueletteTexte lignes={lignes} />
      </div>
    </div>
  );
}

/** Compteurs du haut d'écran, en attente. */
export function SqueletteCompteurs({ nombre = 4 }: { nombre?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {Array.from({ length: nombre }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2.5 rounded-none border border-bordure bg-surface px-4 py-3.5"
        >
          <Squelette largeur="72%" hauteur={10} />
          <Squelette largeur={52} hauteur={20} />
          <Squelette largeur="58%" hauteur={9} />
        </div>
      ))}
    </div>
  );
}
