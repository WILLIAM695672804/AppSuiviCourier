import { useQuery } from "@tanstack/react-query";
import { MarqueCase } from "@/components/ui/CaseACocher";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { structuresQuery } from "@/lib/referentiel";
import { useState } from "react";

/**
 * Choix d'une ou plusieurs structures dans le référentiel.
 *
 * Le rang compte. La première structure retenue est **pilote** — même règle
 * que le chef de file du courrier : c'est elle qui rend compte, elle que la
 * relance atteint, elle seule qui déclare l'exécution. L'ordre de sélection
 * fait donc le rang, et le libellé le dit à l'écran plutôt que de le laisser
 * deviner.
 *
 * La liste reste plate malgré l'arborescence des structures : à cet endroit on
 * cherche un sigle qu'on connaît déjà, on ne parcourt pas un organigramme.
 * L'indentation par niveau suffit à situer.
 */
export function SelecteurStructure({
  libelle = "Structures chargées",
  choisies,
  onChange,
  erreur,
  aide,
  /** Sans rang : toutes les structures retenues sont à égalité. */
  avecPilote = true,
}: {
  libelle?: string;
  /** Identifiants dans l'ordre de sélection : le premier est pilote. */
  choisies: number[];
  onChange: (choisies: number[]) => void;
  erreur?: string;
  aide?: string;
  avecPilote?: boolean;
}) {
  const [recherche, setRecherche] = useState("");
  const { data } = useQuery(structuresQuery());

  const structures = (data ?? []).filter((s) =>
    `${s.sigle} ${s.libelle}`.toLowerCase().includes(recherche.trim().toLowerCase()),
  );

  function basculer(id: number) {
    onChange(choisies.includes(id) ? choisies.filter((c) => c !== id) : [...choisies, id]);
  }

  return (
    <div className="flex flex-col gap-[7px]">
      <span className="text-[11px] leading-none font-semibold text-encre-faible">{libelle}</span>

      <ChampRecherche
        valeur={recherche}
        onChange={setRecherche}
        placeholder="Filtrer par sigle ou par intitulé…"
      />

      <div
        role="group"
        aria-label={libelle}
        className={`flex max-h-[240px] flex-col overflow-y-auto rounded-none border ${
          erreur ? "border-danger-trait" : "border-bordure-forte"
        }`}
      >
        {structures.length === 0 ? (
          <p className="px-3 py-5 text-center text-[11.5px] font-medium text-encre-tenue">
            Aucune structure ne correspond.
          </p>
        ) : (
          structures.map((structure, index) => {
            const rang = choisies.indexOf(structure.id);
            const retenue = rang >= 0;

            return (
              <div
                key={structure.id}
                role="checkbox"
                aria-checked={retenue}
                tabIndex={0}
                onClick={() => basculer(structure.id)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    basculer(structure.id);
                  }
                }}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 transition-colors duration-150 ${
                  index > 0 ? "border-t border-separateur" : ""
                } ${retenue ? "bg-accent-voile" : "hover:bg-surface-douce"}`}
              >
                <MarqueCase cochee={retenue} />

                <span
                  className="flex min-w-0 flex-1 items-center gap-2"
                  style={{ paddingLeft: structure.niveau * 12 }}
                >
                  <span className="flex-none text-[11px] leading-none font-bold text-encre-douce">
                    {structure.sigle}
                  </span>
                  <span className="min-w-0 truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                    {structure.libelle}
                  </span>
                </span>

                {retenue && avecPilote && (
                  <span
                    className={`flex-none rounded-none px-1.5 py-0.5 text-[9px] leading-none font-bold ${
                      rang === 0
                        ? "bg-accent text-white"
                        : "bg-surface text-encre-faible"
                    }`}
                  >
                    {rang === 0 ? "PILOTE" : `RANG ${rang + 1}`}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {erreur ? (
        <span className="text-[10.5px] leading-[1.4] font-semibold text-danger">{erreur}</span>
      ) : (
        <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">
          {aide ??
            (avecPilote
              ? "La première structure retenue est pilote : c'est elle qui rend compte pour l'ensemble."
              : "Toutes les structures retenues sont à égalité.")}
        </span>
      )}
    </div>
  );
}
