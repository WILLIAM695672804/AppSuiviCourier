import { MarqueCase } from "@/components/ui/CaseACocher";

/** Case a cocher et son libelle, dans un seul controle cliquable. */
export function CaseLibellee({
  cochee,
  onChange,
  libelle,
  desactivee = false,
}: {
  cochee: boolean;
  onChange: (cochee: boolean) => void;
  libelle: string;
  desactivee?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={cochee}
      disabled={desactivee}
      onClick={() => onChange(!cochee)}
      className="flex cursor-pointer items-center gap-[9px] text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <MarqueCase cochee={cochee} />
      <span className="text-xs leading-none font-semibold text-encre-douce">{libelle}</span>
    </button>
  );
}
