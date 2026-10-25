import { Link } from "react-router";
import { Icone } from "@/components/ui/Icone";
import { Squelette } from "@/components/ui/Squelette";

/** Un chiffre de la bande haute. Sept au plus : au-dela, on ne lit plus. */
export interface Repere {
  libelle: string;
  /** Deja formatee par le serveur — un pourcentage, un delai, un effectif. */
  valeur: string;
  /** Precision sous la valeur. « — » quand la mesure n'est pas disponible. */
  note: string | null;
  /**
   * Ecran qui porte le detail de ce chiffre, quand il en existe un et que la
   * session l'ouvre (ADR 027). La mesure vient du serveur, la destination est
   * une affaire d'ecran : c'est la page qui la pose, pas l'API.
   */
  chemin?: string | null;
}

/**
 * Bande de reperes des vues d'ensemble.
 *
 * Une seule carte et non sept : ce sont sept lectures d'une meme situation,
 * pas sept objets distincts. C'est ce qui la distingue des `ChiffreClef` du
 * cockpit, qui sont autant de portes vers un ecran d'action.
 *
 * Tant que les chiffres ne sont pas arrives, les cases restent vides mais la
 * bande garde sa hauteur : la page ne saute pas au moment ou ils tombent.
 *
 * Partagee par la vue de la Direction generale et celle du Comite de
 * direction. Deux ecrans, deux jeux de mesures, une seule facon de les poser —
 * si l'un change d'allure, l'autre suit, ce qui est exactement l'effet
 * recherche : ce sont deux lectures du meme dispositif.
 */
export function BandeReperes({ reperes }: { reperes: (Repere | null)[] }) {
  return (
    <section className="grid grid-cols-2 divide-x divide-y divide-separateur overflow-hidden rounded-none border border-[color:var(--color-bordure-carte)] bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:grid-cols-4 xl:grid-cols-7 xl:divide-y-0">
      {reperes.map((repere, index) => {
        const contenu = (
          <>
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[10.5px] leading-none font-semibold text-encre-faible">
                {repere?.libelle ?? <Squelette largeur="80%" />}
              </span>
              {/* Le chevron dit que le chiffre ouvre quelque chose. Sans lui,
                  seul le survol l'apprend — et il n'y a pas de survol sur un
                  telephone. */}
              {repere?.chemin && (
                <Icone nom="chevronDroite" taille={10} epaisseur={2} className="flex-none text-accent" />
              )}
            </span>
            <span className="truncate text-[19px] leading-none font-extrabold tracking-[-.5px] text-encre tabular-nums">
              {repere?.valeur ?? <Squelette largeur="55%" hauteur={19} />}
            </span>
            {repere && (
              <span className="truncate text-[10px] leading-none font-medium text-encre-tenue">
                {repere.note ?? "—"}
              </span>
            )}
          </>
        );

        const classe = "flex flex-col gap-2 px-4 py-3.5";

        return repere?.chemin ? (
          <Link
            key={repere.libelle}
            to={repere.chemin}
            className={`${classe} transition-colors duration-150 hover:bg-surface-douce`}
          >
            {contenu}
          </Link>
        ) : (
          <div key={repere?.libelle ?? index} className={classe}>
            {contenu}
          </div>
        );
      })}
    </section>
  );
}
