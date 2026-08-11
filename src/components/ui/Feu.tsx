import type { NiveauFeu } from "@/lib/feu";

/**
 * Le code couleur vert / orange / rouge du descriptif fonctionnel.
 *
 * Il revient dans les quatre piliers — activités, courrier, dossiers, scoring —
 * et doit donc se lire partout de la même façon. D'où un composant unique
 * plutôt qu'une pastille redessinée dans chaque écran.
 *
 * La couleur ne porte jamais le sens à elle seule : un libellé l'accompagne,
 * et le titre HTML le répète. Une pastille rouge muette n'est pas lisible pour
 * qui distingue mal les couleurs — ni sur une capture en noir et blanc, ce qui
 * arrive à chaque impression de tableau de bord.
 *
 * Le seuil qui choisit le niveau vit dans `lib/feu.ts` : il sert aussi à trier
 * et à compter, pas seulement à colorer.
 */
const TONS: Record<NiveauFeu, { fond: string; texte: string; defaut: string }> = {
  vert: { fond: "bg-succes-vif", texte: "text-succes", defaut: "Conforme" },
  orange: { fond: "bg-alerte-vif", texte: "text-alerte", defaut: "À surveiller" },
  rouge: { fond: "bg-danger-vif", texte: "text-danger", defaut: "En alerte" },
  inconnu: { fond: "bg-encre-tenue", texte: "text-encre-tenue", defaut: "Non renseigné" },
};

export function Feu({
  niveau,
  libelle,
  /** Sans libellé visible : la pastille seule, dans une cellule de tableau dense. */
  muet = false,
}: {
  niveau: NiveauFeu;
  libelle?: string;
  muet?: boolean;
}) {
  const ton = TONS[niveau];
  const texte = libelle ?? ton.defaut;

  return (
    <span className="inline-flex items-center gap-1.5" title={texte}>
      <span className={`size-2 flex-none rounded-none ${ton.fond}`} />
      {muet ? (
        <span className="sr-only">{texte}</span>
      ) : (
        <span className={`text-[11.5px] leading-none font-semibold ${ton.texte}`}>{texte}</span>
      )}
    </span>
  );
}
