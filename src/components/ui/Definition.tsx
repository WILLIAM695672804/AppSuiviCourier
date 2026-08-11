import type { ReactNode } from "react";

/**
 * Couple libelle / valeur des ecrans de consultation.
 * Le libelle est en petites majuscules : il doit s'effacer devant la valeur.
 */
export function Definition({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-[10.5px] leading-none font-semibold tracking-[.5px] text-encre-tenue uppercase">
        {libelle}
      </dt>
      <dd className="text-[12.5px] leading-[1.4] font-semibold text-encre">{children}</dd>
    </div>
  );
}

/** Grille de definitions qui se recompose selon la largeur disponible. */
export function GrilleDefinitions({ children }: { children: ReactNode }) {
  return (
    <dl className="mt-[15px] grid grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-4">
      {children}
    </dl>
  );
}
