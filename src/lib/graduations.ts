/**
 * Graduations rondes encadrant une plage de valeurs.
 *
 * Un axe qui s'arrete a 1,47 se lit mal : on cherche le pas avant de lire la
 * courbe. Le pas est donc arrondi a 1, 2, 2,5 ou 5 fois une puissance de dix,
 * ce que fait n'importe quel tableur, et pour la meme raison.
 *
 * Hors des composants de graphique parce que deux d'entre eux s'en servent, et
 * qu'un axe gradue differemment d'un graphique a l'autre, sur le meme ecran,
 * se remarque immediatement.
 */
export function calculerGraduations(minimum: number, maximum: number, cible = 4): number[] {
  const etendue = maximum - minimum || 1;
  const magnitude = 10 ** Math.floor(Math.log10(etendue / cible));
  const pas =
    [1, 2, 2.5, 5, 10]
      .map((facteur) => facteur * magnitude)
      .find((candidat) => etendue / candidat <= cible) ?? etendue;

  const bas = Math.floor(minimum / pas) * pas;
  const haut = Math.ceil(maximum / pas) * pas;

  const niveaux: number[] = [];
  // L'epsilon absorbe l'imprecision des flottants : sans lui, un pas de 0,1
  // perd sa derniere graduation une fois sur deux.
  for (let niveau = bas; niveau <= haut + pas / 1000; niveau += pas) {
    niveaux.push(Number(niveau.toFixed(10)));
  }
  return niveaux;
}
