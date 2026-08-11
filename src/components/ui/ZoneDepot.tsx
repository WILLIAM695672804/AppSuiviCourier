import { useRef, useState } from "react";
import { Icone } from "@/components/ui/Icone";

/**
 * Dépôt de fichiers, par glisser-déposer ou par parcours.
 *
 * Le bouton « Parcourir » n'est pas un ornement : le glisser-déposer seul
 * exclut qui travaille au clavier, et n'existe pas sur téléphone. La zone
 * entière est donc un bouton, et le glisser-déposer vient en plus.
 *
 * Le fichier n'est pas envoyé ici. Ce composant tient une liste et la remonte
 * au formulaire ; c'est la modale qui décide quand et où poster. Sans quoi
 * chaque écran aurait sa propre logique d'envoi, et son propre bogue.
 */
export interface FichierDepose {
  nom: string;
  taille: string;
  fichier: File;
}

function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ZoneDepot({
  libelle = "Pièces jointes",
  aide,
  accepte = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = true,
  fichiers,
  onChange,
  erreur,
}: {
  libelle?: string;
  aide?: string;
  /** Extensions acceptées, passées telles quelles à l'input. */
  accepte?: string;
  multiple?: boolean;
  fichiers: FichierDepose[];
  onChange: (fichiers: FichierDepose[]) => void;
  erreur?: string;
}) {
  const entree = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);

  function ajouter(liste: FileList | null) {
    if (!liste || liste.length === 0) return;
    const nouveaux = Array.from(liste).map((fichier) => ({
      nom: fichier.name,
      taille: formaterTaille(fichier.size),
      fichier,
    }));
    onChange(multiple ? [...fichiers, ...nouveaux] : nouveaux.slice(0, 1));
  }

  return (
    <div className="flex flex-col gap-[7px]">
      <span className="text-[11px] leading-none font-semibold text-encre-faible">{libelle}</span>

      <button
        type="button"
        onClick={() => entree.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          ajouter(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-none border border-dashed px-4 py-6 transition-colors duration-150 ${
          erreur
            ? "border-danger-trait bg-danger-voile"
            : survol
              ? "border-accent bg-accent-voile"
              : "border-bordure-forte bg-surface-douce hover:border-accent"
        }`}
      >
        <Icone nom="exporter" taille={19} className="text-encre-tenue" />
        <span className="text-[12px] leading-none font-semibold text-encre-douce">
          Déposer un fichier ou parcourir
        </span>
        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
          {accepte.replaceAll(".", "").replaceAll(",", ", ").toUpperCase()}
        </span>
      </button>

      <input
        ref={entree}
        type="file"
        accept={accepte}
        multiple={multiple}
        onChange={(e) => {
          ajouter(e.target.files);
          // Remis a zero pour que redeposer le meme fichier declenche l'evenement.
          e.target.value = "";
        }}
        className="hidden"
      />

      {fichiers.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {fichiers.map((fichier, index) => (
            <li
              key={`${fichier.nom}-${index}`}
              className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2"
            >
              <Icone nom="document" taille={14} className="flex-none text-encre-tenue" />
              <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-semibold text-encre">
                {fichier.nom}
              </span>
              <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                {fichier.taille}
              </span>
              <button
                type="button"
                onClick={() => onChange(fichiers.filter((_, i) => i !== index))}
                aria-label={`Retirer ${fichier.nom}`}
                className="grid size-6 flex-none cursor-pointer place-items-center rounded-none text-encre-tenue transition-colors duration-150 hover:bg-surface-douce hover:text-danger"
              >
                <Icone nom="croix" taille={11} epaisseur={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {erreur ? (
        <span className="text-[10.5px] leading-[1.4] font-semibold text-danger">{erreur}</span>
      ) : (
        aide && (
          <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">{aide}</span>
        )
      )}
    </div>
  );
}
