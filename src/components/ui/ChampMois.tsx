import { useId, type InputHTMLAttributes } from "react";
import { Etiqueteur } from "@/components/ui/Champ";

/**
 * Saisie d'un mois — « août 2026 ».
 *
 * Même parti pris que `ChampDate` : le contrôle natif du navigateur, déjà
 * traduit, accessible au clavier et doté du sélecteur du système sur
 * téléphone. La valeur reste `AAAA-MM`, qui est ce que le serveur attend.
 *
 * Il sert là où le quantième n'est pas une décision : la période d'une
 * activité s'écrit « de mars à décembre » (ADR 047). Demander un jour
 * obligeait à en inventer un, et deux activités identiques se retrouvaient
 * décalées de quinze jours sans que cela veuille rien dire. Le serveur pose la
 * borne : premier jour du mois au début, dernier à la fin.
 *
 * `type="month"` n'est pas implémenté par Firefox, qui rend un champ texte. La
 * valeur y reste conforme grâce au `pattern` — le format est le même, c'est le
 * confort de saisie qui diffère.
 */
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  libelle: string;
  erreur?: string;
  aide?: string;
};

export function ChampMois({ libelle, erreur, aide, className, ...reste }: Props) {
  const id = useId();

  return (
    <Etiqueteur libelle={libelle} pour={id} erreur={erreur} aide={aide} className={className}>
      <input
        id={id}
        type="month"
        pattern="\d{4}-\d{2}"
        placeholder="AAAA-MM"
        aria-invalid={erreur ? true : undefined}
        {...reste}
        className={`w-full rounded-none border bg-surface px-3 py-2.5 text-[12.5px] leading-none font-semibold text-encre outline-none transition-colors duration-150 focus:border-accent disabled:bg-surface-douce disabled:text-encre-tenue ${
          erreur ? "border-danger-trait" : "border-bordure-forte"
        }`}
      />
    </Etiqueteur>
  );
}
