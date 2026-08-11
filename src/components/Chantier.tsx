import { EnTetePage } from "@/components/EnTetePage";

/**
 * Ecran non encore construit.
 * `ecrans` reprend les references de l'inventaire (A-01, G-04, …) afin que
 * l'avancement se lise directement dans l'application.
 */
export function Chantier({
  titre,
  ecrans,
  maquette,
}: {
  titre: string;
  ecrans: string[];
  maquette?: string;
}) {
  return (
    <>
      <EnTetePage titre={titre} />
      <div className="flex-1 overflow-y-auto bg-fond p-[26px]">
        <div className="max-w-2xl rounded-none border border-bordure bg-surface p-6">
          <p className="text-[13px] font-bold text-encre">Écran à construire</p>
          <p className="mt-1.5 text-xs font-medium text-encre-tenue">
            Références de l'inventaire couvertes ici :
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {ecrans.map((ecran) => (
              <li key={ecran} className="text-[12.5px] font-medium text-encre-moyenne">
                {ecran}
              </li>
            ))}
          </ul>
          {maquette && (
            <p className="mt-4 border-t border-separateur pt-4 text-xs font-medium text-encre-tenue">
              Maquette de référence : {maquette}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
