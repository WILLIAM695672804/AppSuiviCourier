import { Squelette } from "@/components/ui/Squelette";

/** Un chiffre de la bande haute. Sept au plus : au-dela, on ne lit plus. */
export interface Repere {
  libelle: string;
  /** Deja formatee par le serveur — un pourcentage, un delai, un effectif. */
  valeur: string;
  /** Precision sous la valeur. « — » quand la mesure n'est pas disponible. */
  note: string | null;
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
      {reperes.map((repere, index) => (
        <div key={repere?.libelle ?? index} className="flex flex-col gap-2 px-4 py-3.5">
          <span className="truncate text-[10.5px] leading-none font-semibold text-encre-faible">
            {repere?.libelle ?? <Squelette largeur="80%" />}
          </span>
          <span className="truncate text-[19px] leading-none font-extrabold tracking-[-.5px] text-encre tabular-nums">
            {repere?.valeur ?? <Squelette largeur="55%" hauteur={19} />}
          </span>
          {repere && (
            <span className="truncate text-[10px] leading-none font-medium text-encre-tenue">
              {repere.note ?? "—"}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}
