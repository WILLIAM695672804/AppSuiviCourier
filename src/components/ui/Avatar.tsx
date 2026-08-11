/**
 * Pastille d'initiales.
 *
 * La teinte derive du nom, pour qu'un meme agent garde la meme couleur d'un
 * ecran a l'autre. Elle ne porte aucun sens : c'est un reperage, pas un statut.
 */
const TEINTES = [
  "bg-accent-voile-fort text-accent-fonce",
  "bg-[#e7f8f0] text-succes",
  "bg-[#fef4e6] text-alerte",
  "bg-[#ede8ff] text-confidentiel",
  "bg-[#f2f4f7] text-encre-faible",
];

const TAILLES = {
  petit: "size-7 text-[10px]",
  moyen: "size-[30px] text-[10px]",
  grand: "size-8 text-[10.5px]",
};

export function Avatar({
  initiales,
  titre,
  taille = "moyen",
}: {
  initiales: string;
  titre?: string;
  taille?: keyof typeof TAILLES;
}) {
  const somme = [...initiales].reduce((total, c) => total + c.charCodeAt(0), 0);
  const teinte = TEINTES[somme % TEINTES.length];

  return (
    <span
      title={titre}
      className={`grid flex-none place-items-center rounded-none leading-none font-bold ${TAILLES[taille]} ${teinte}`}
    >
      {initiales}
    </span>
  );
}
