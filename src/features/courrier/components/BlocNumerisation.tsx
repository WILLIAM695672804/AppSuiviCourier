import { useRef, useState } from "react";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Icone } from "@/components/ui/Icone";

/**
 * Les fichiers numerises du pli, avant enregistrement.
 *
 * L'institution travaille en mode hybride : le papier continue de circuler et
 * la numerisation ne le remplace pas. D'ou la mention rappelee sous les
 * vignettes — sans elle, un agent croira que le document original peut rester
 * au service courrier.
 *
 * **Ce bloc ne verse rien.** Il tient une liste de `File` en memoire, que
 * l'ecran depose sur `POST /pieces` une fois le courrier cree : le rattachement
 * exige l'identifiant de l'objet, et le courrier n'en a pas avant sa ligne.
 *
 * Ce qu'il ne fait pas, et pourquoi : **il ne pilote aucun scanner.** Jusqu'au
 * 19 aout 2026, « Numériser une page » empilait une vignette en memoire et
 * n'envoyait rien — une numerisation pour de faux, dont l'agent ne pouvait pas
 * se douter. Piloter un scanner depuis un navigateur suppose un service local
 * (eSCL, TWAIN) qui n'existe pas au Port ; l'usage reel est de numeriser vers
 * un dossier, puis de reprendre le fichier ici.
 */
export function BlocNumerisation({
  fichiers,
  onAjouter,
  onRetirer,
}: {
  fichiers: File[];
  onAjouter: (ajoutes: File[]) => void;
  onRetirer: (index: number) => void;
}) {
  const entree = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);

  function accepter(liste: FileList | null) {
    if (!liste || liste.length === 0) return;
    onAjouter(Array.from(liste));
  }

  return (
    <Carte
      titre="Numérisation"
      aDroite={
        <span className="text-[11px] leading-none font-medium text-encre-tenue">
          {fichiers.length === 0
            ? "Aucun fichier joint"
            : `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""} à verser`}
        </span>
      }
    >
      <div className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-[11px]">
        {fichiers.map((fichier, index) => (
          <div
            key={`${fichier.name}-${index}`}
            className="flex flex-col gap-1.5 rounded-none border border-bordure bg-neutre-voile p-[9px]"
          >
            <div className="flex flex-col gap-1 rounded-none border border-bordure bg-surface p-[9px]">
              <div className="h-[3px] w-1/2 rounded-none bg-accent-voile-fort" />
              <div className="mt-1 h-[3px] w-full rounded-none bg-inerte" />
              <div className="h-[3px] w-[88%] rounded-none bg-inerte" />
              <div className="h-[3px] w-[94%] rounded-none bg-inerte" />
              <div className="h-[3px] w-2/5 rounded-none bg-inerte" />
            </div>
            <span
              title={fichier.name}
              className="truncate text-center text-[10px] leading-none font-semibold text-encre-faible"
            >
              {fichier.name}
            </span>
            <button
              type="button"
              onClick={() => onRetirer(index)}
              className="cursor-pointer text-[10px] leading-none font-semibold text-encre-tenue underline-offset-2 hover:text-danger hover:underline"
            >
              Retirer
            </button>
          </div>
        ))}

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
            accepter(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-none border border-dashed px-[9px] py-4 transition-colors duration-150 ${
            survol ? "border-accent bg-accent-voile" : "border-bordure-champ hover:bg-neutre-voile"
          }`}
        >
          <Icone nom="numeriser" taille={18} epaisseur={1.6} className="text-encre-tenue" />
          <span className="text-center text-[10.5px] leading-[1.3] font-semibold text-encre-faible">
            Joindre le
            <br />
            document numérisé
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Bouton onClick={() => entree.current?.click()}>Importer un fichier</Bouton>
        <span className="text-[11px] leading-[1.4] font-medium text-encre-tenue">
          Les fichiers sont versés une fois le courrier enregistré. Le document original est remis
          au coursier avec le bordereau.
        </span>
      </div>

      {/* Plusieurs fichiers d'un coup : un pli numerise sort souvent en une page
          par fichier, et les reprendre un a un serait une corvee de plus a un
          poste qui enregistre plusieurs dizaines de courriers par jour. */}
      <input
        ref={entree}
        type="file"
        multiple
        onChange={(e) => {
          accepter(e.target.files);
          // Remis a zero pour que rejoindre le meme fichier declenche l'evenement.
          e.target.value = "";
        }}
        className="hidden"
      />
    </Carte>
  );
}
