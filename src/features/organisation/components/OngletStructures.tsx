import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { ModaleNouvelleStructure } from "@/features/organisation/components/ModaleNouvelleStructure";
import { construireArbre, structuresQuery } from "@/lib/referentiel";

/**
 * F-01 — les structures de l'institution.
 *
 * L'onglet manquant de l'organigramme. Il s'écrivait ailleurs : la DSR tenait
 * le référentiel des structures depuis son propre espace, sous `ADM_STR`, et
 * l'administrateur fonctionnel ouvrait les postes de structures qu'il ne
 * pouvait pas créer. Chacun faisait la moitié du geste (ADR 021).
 *
 * L'ordre des onglets suit celui de la création : une structure, puis les
 * postes qu'elle porte, puis les agents qui les occupent.
 *
 * La DSR n'a rien perdu de sa lecture : le référentiel se consulte depuis son
 * espace de travail, et sa liste est ouverte à toute session (ADR 007).
 */
export function OngletStructures() {
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const { data: structures = [] } = useQuery(structuresQuery());

  // L'arbre, et non la liste : l'indentation suit le rattachement reel.
  const noeuds = construireArbre(structures);
  const orphelines = noeuds.filter((n) => n.orpheline).length;

  return (
    <>
      <Carte
        titre="Structures"
        aDroite={
          <Bouton icone="plus" onClick={() => setModaleOuverte(true)}>
            Nouvelle structure
          </Bouton>
        }
      >
        <div className="mt-3.5 flex flex-col gap-3">
          <Encart ton="neutre" icone="organisation">
            Le référentiel est commun à tous les modules : une structure absente ici
            n'apparaîtra dans aucun tableau de bord. La créer ouvre son poste responsable,{" "}
            <strong>vacant</strong> — c'est l'onglet « Affectations » qui le pourvoit.
          </Encart>

          {orphelines > 0 && (
            <Encart ton="alerte" icone="bouclier">
              {orphelines === 1
                ? "Une structure est rattachée à une structure qui n'est plus en vigueur : "
                : `${orphelines} structures sont rattachées à une structure qui n'est plus en vigueur : `}
              elles sont affichées à la racine, ce qu'elles ne sont pas. Leur rattachement est à
              reprendre.
            </Encart>
          )}
        </div>

        <div className="mt-3.5 overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[minmax(220px,2fr)_120px_80px_minmax(150px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
              {["Structure", "Nature", "Niveau", "Responsable"].map((t) => (
                <span
                  key={t}
                  className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                >
                  {t}
                </span>
              ))}
            </div>

            {noeuds.map(({ structure, profondeur, orpheline }) => (
              <div
                key={structure.id}
                className="grid grid-cols-[minmax(220px,2fr)_120px_80px_minmax(150px,1fr)] items-center gap-2.5 border-b border-separateur py-3"
              >
                <span
                  className="flex min-w-0 items-center gap-2.5"
                  style={{ paddingLeft: profondeur * 16 }}
                >
                  <span className="flex-none rounded-none bg-surface-douce px-1.5 py-1 text-[10px] leading-none font-bold text-encre-douce">
                    {structure.sigle}
                  </span>
                  <span className="truncate text-xs leading-none font-semibold text-encre">
                    {structure.libelle}
                  </span>
                  {orpheline && (
                    <span
                      className="flex-none"
                      title="Sa structure de rattachement n'est plus en vigueur : elle est affichée à la racine faute de mieux."
                    >
                      <Etiquette ton="alerte">Rattachement rompu</Etiquette>
                    </span>
                  )}
                </span>
                <span className="text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {structure.nature}
                </span>
                <span className="text-[11.5px] leading-none font-medium text-encre-faible tabular-nums">
                  {structure.niveau}
                </span>
                {/* Vacant tant qu'aucun agent n'occupe le poste responsable :
                    c'est l'affectation qui remplit cette colonne, pas la
                    creation de la structure. */}
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {structure.responsable ?? "Non désigné"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Carte>

      <ModaleNouvelleStructure ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
