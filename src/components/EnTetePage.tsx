import { useState, type ReactNode } from "react";
import { FilAriane, type Miette } from "@/components/ui/FilAriane";
import { BoutonGlossaire, Glossaire } from "@/components/ui/Glossaire";
import { Icone } from "@/components/ui/Icone";
import { MenuProfil } from "@/components/ui/MenuProfil";
import { BoutonTiroir } from "@/components/ui/TiroirNavigation";
import { useTiroir } from "@/lib/contexteTiroir";
import { useSession } from "@/lib/contexteSession";

/**
 * En-tete d'ecran.
 *
 * Il n'y a pas de barre haute globale : chaque ecran porte son titre, son
 * decompte et ses actions. C'est ce que montrent les maquettes, et c'est
 * coherent — l'action principale depend toujours de l'ecran affiche.
 *
 * Les ecrans de saisie remplacent les outils systeme (aide, notifications)
 * par un fil d'Ariane : on y entre pour une tache, on en sort en la finissant.
 */
export function EnTetePage({
  titre,
  compte,
  sousTitre,
  miettes,
  mention,
  actions,
}: {
  titre: string;
  /** Nombre d'elements affiches, pose a cote du titre. */
  compte?: number | string;
  /** Precision sous le titre : perimetre couvert, periode, portee. */
  sousTitre?: string;
  miettes?: Miette[];
  /** Precision discrete a gauche des actions : « N° attribue : … ». */
  mention?: string;
  actions?: ReactNode;
}) {
  const session = useSession();
  const tiroir = useTiroir();
  const [glossaireOuvert, setGlossaireOuvert] = useState(false);
  const outilsSysteme = !miettes;

  return (
    <header className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-bordure px-4 py-3 md:px-[26px] md:py-[15px]">
      {tiroir && <BoutonTiroir onClick={tiroir.ouvrir} />}

      <div className="flex min-w-0 flex-col gap-[5px]">
        {miettes && <FilAriane miettes={miettes} />}
        <div className="flex items-baseline gap-2.5">
          <h1 className="truncate text-lg leading-tight font-extrabold tracking-[-.4px] text-encre md:text-xl">
            {titre}
          </h1>
          {compte !== undefined && (
            <span className="text-sm leading-none font-semibold text-encre-tenue tabular-nums">
              {compte}
            </span>
          )}
        </div>
        {sousTitre && (
          <p className="text-[11.5px] leading-none font-medium text-encre-tenue">{sousTitre}</p>
        )}
      </div>

      <div className="flex-1" />

      {mention && (
        <span className="text-[11.5px] leading-none font-semibold text-encre-tenue tabular-nums">
          {mention}
        </span>
      )}

      <div className="flex items-center gap-[13px]" data-impression="masquer">
        {session.delegationDe && (
          <span className="rounded-none border border-alerte-trait bg-alerte-voile px-2.5 py-1.5 text-[11px] leading-none font-bold text-alerte">
            Par délégation de {session.delegationDe.nomComplet}
          </span>
        )}

        {outilsSysteme && (
          <>
            {/* Le bouton d'aide ouvre le glossaire des sigles — §3.12 et note
                finale du descriptif. Il cede la place sur telephone, comme les
                preferences : le titre et l'action principale passent avant. Les
                notifications restent, elles appellent une action. */}
            <span className="hidden md:block">
              <BoutonGlossaire onClick={() => setGlossaireOuvert(true)} />
            </span>
            <button
              type="button"
              aria-label="Préférences"
              className="hidden text-encre-tenue hover:text-encre-faible md:block"
            >
              <Icone nom="parametres" taille={17} />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative text-encre-tenue hover:text-encre-faible"
            >
              <Icone nom="cloche" taille={17} />
              <span className="absolute -top-px right-0 size-[7px] rounded-none border-[1.5px] border-white bg-danger-vif" />
            </button>

            <div className="ml-0.5">
              <MenuProfil compact />
            </div>
          </>
        )}

        {actions}
      </div>

      <Glossaire ouverte={glossaireOuvert} onFermer={() => setGlossaireOuvert(false)} />
    </header>
  );
}
