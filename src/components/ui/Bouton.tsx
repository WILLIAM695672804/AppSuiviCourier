import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icone, type NomIcone } from "@/components/ui/Icone";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Les quatre boutons des maquettes, et rien d'autre.
 *
 * - principal  : action d'ecran unique (Enregistrer un courrier)
 * - secondaire : actions de barre d'outils (Exporter, Numeriser)
 * - doux       : action accentuee mais non dominante (Coter la selection)
 * - fantome    : actions posees sur un fond sombre (barre de selection)
 */
type Variante = "principal" | "secondaire" | "doux" | "fantome";

const VARIANTES: Record<Variante, string> = {
  principal:
    "bg-linear-[180deg,#3b78f0,#2059d8] text-white font-bold shadow-[0_1px_2px_rgba(32,89,216,.4)] hover:brightness-[1.06]",
  secondaire:
    "border border-bordure-forte text-encre-douce font-semibold hover:bg-surface-douce",
  doux: "bg-accent-voile border border-accent-trait text-accent-fonce font-bold hover:bg-[#e3ebfd]",
  fantome: "text-white font-semibold hover:bg-white/10",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  icone?: NomIcone;
  /** Remplace l'icone par un indicateur et desactive le bouton pendant l'envoi. */
  chargement?: boolean;
  children: ReactNode;
};

export function Bouton({
  variante = "secondaire",
  icone,
  chargement = false,
  children,
  className = "",
  disabled,
  ...reste
}: Props) {
  const rembourrage = variante === "principal" ? "px-[15px] py-2.5" : "px-3 py-2";
  const rayon = variante === "principal" ? "rounded-none" : "rounded-none";

  return (
    <button
      type="button"
      // Desactive pendant l'envoi : un second clic partirait en double, et
      // c'est ainsi qu'on cree deux fois la meme decision.
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      {...reste}
      className={`inline-flex items-center gap-[7px] text-xs leading-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${rayon} ${rembourrage} ${VARIANTES[variante]} ${className}`}
    >
      {/* Le spinner remplace l'icone plutot que de s'y ajouter : la largeur du
          bouton ne bouge pas, et rien ne saute sous le curseur. */}
      {chargement ? (
        <Spinner taille={14} libelle="Envoi en cours" />
      ) : (
        icone && <Icone nom={icone} taille={14} epaisseur={variante === "principal" ? 1.8 : 1.6} />
      )}
      {children}
    </button>
  );
}

/** Bouton carre des barres d'outils : une icone, pas de libelle visible. */
export function BoutonIcone({
  icone,
  libelle,
  className = "",
  ...reste
}: ButtonHTMLAttributes<HTMLButtonElement> & { icone: NomIcone; libelle: string }) {
  return (
    <button
      type="button"
      title={libelle}
      aria-label={libelle}
      {...reste}
      className={`grid size-[34px] place-items-center rounded-none border border-bordure-forte text-encre-faible transition-colors duration-150 hover:bg-surface-douce ${className}`}
    >
      <Icone nom={icone} taille={15} epaisseur={1.6} />
    </button>
  );
}
