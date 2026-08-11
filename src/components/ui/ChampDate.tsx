import { useId, type InputHTMLAttributes } from "react";
import { Etiqueteur } from "@/components/ui/Champ";

/**
 * Saisie d'une date.
 *
 * On s'appuie sur `<input type="date">` du navigateur plutôt que sur un
 * calendrier maison. Trois raisons : il est déjà traduit et localisé, il est
 * accessible au clavier sans un octet de JavaScript, et sur téléphone il
 * ouvre le sélecteur natif du système — celui que l'agent connaît déjà.
 *
 * Le format d'affichage suit la locale du poste ; la valeur reste au format
 * ISO, qui est ce que le serveur attend. C'est précisément ce que le contrôle
 * natif garantit et qu'un composant maison aurait fini par trahir.
 */
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  libelle: string;
  erreur?: string;
  aide?: string;
};

export function ChampDate({ libelle, erreur, aide, className, ...reste }: Props) {
  const id = useId();

  return (
    <Etiqueteur libelle={libelle} pour={id} erreur={erreur} aide={aide} className={className}>
      <input
        id={id}
        type="date"
        aria-invalid={erreur ? true : undefined}
        {...reste}
        className={`w-full rounded-none border bg-surface px-3 py-2.5 text-[12.5px] leading-none font-semibold text-encre outline-none transition-colors duration-150 focus:border-accent disabled:bg-surface-douce disabled:text-encre-tenue ${
          erreur ? "border-danger-trait" : "border-bordure-forte"
        }`}
      />
    </Etiqueteur>
  );
}
