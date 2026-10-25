import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Icone } from "@/components/ui/Icone";
import { construireArbre, structuresQuery, type StructureRef } from "@/lib/referentiel";

/**
 * Choix d'une structure parmi celles que le périmètre autorise.
 *
 * Remplace la rangée de pastilles là où les options sont des structures. Les
 * pastilles tenaient à quatorze sigles ; l'organigramme réel en compte
 * soixante-dix-sept, et la rangée devenait deux choses à la fois illisibles :
 * un mur de boutons qui repousse le contenu hors de l'écran, et une liste où
 * `DAG` et `DAG-MP-MAR` se ressemblent alors que l'une contient l'autre.
 *
 * D'où les deux partis pris. **Un menu déroulant**, parce qu'un choix parmi
 * soixante-dix-sept se cherche, il ne se parcourt pas ; avec un champ de
 * recherche, parce qu'on connaît déjà le sigle qu'on veut. Et **l'indentation
 * par rattachement**, parce que c'est la seule chose qui distingue une
 * direction de son département — le sigle ne le dit que par convention de
 * nommage, ce qui n'est pas une donnée.
 *
 * L'arbre vient du référentiel de l'organigramme, ouvert à toute session
 * (ADR 007). Le décalage affiché est le nombre d'ancêtres **retenus**, jamais
 * la profondeur absolue : un service dont la direction n'est pas dans le
 * périmètre se pose à la racine, et non trois crans à droite sous rien.
 *
 * Tant que le référentiel n'est pas arrivé, la liste s'affiche à plat. Elle
 * reste utilisable — c'est l'indentation qui manque, pas le choix.
 */
export function ChoixStructure({
  sigles,
  actif,
  onChange,
  libelle,
  sigleTout,
}: {
  /** Les sigles proposés, dans n'importe quel ordre : l'arbre les remet en place. */
  sigles: readonly string[];
  actif: string;
  onChange: (sigle: string) => void;
  /** Nommé pour le lecteur d'écran : « Choisir la structure observée ». */
  libelle: string;
  /**
   * Entrée hors organigramme posée en tête — « Toutes ». Elle n'est pas une
   * structure : elle ne s'indente pas et ne se cherche pas par intitulé.
   */
  sigleTout?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const boite = useRef<HTMLDivElement>(null);
  const { data: referentiel } = useQuery(structuresQuery());

  useEffect(() => {
    if (!ouvert) return;

    function auClic(evenement: MouseEvent) {
      if (!boite.current?.contains(evenement.target as Node)) setOuvert(false);
    }
    function aLaTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", aLaTouche);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", aLaTouche);
    };
  }, [ouvert]);

  const lignes = useMemo(
    () => ordonner(sigles, sigleTout, referentiel),
    [sigles, sigleTout, referentiel],
  );

  const choisie = lignes.find((ligne) => ligne.sigle === actif);
  const terme = recherche.trim().toLowerCase();
  const visibles = terme
    ? lignes.filter((ligne) => `${ligne.sigle} ${ligne.libelle}`.toLowerCase().includes(terme))
    : lignes;

  function retenir(sigle: string) {
    onChange(sigle);
    setOuvert(false);
    setRecherche("");
  }

  return (
    <div ref={boite} className="relative flex w-full flex-col gap-[7px] md:w-[320px]">
      <span className="text-[11px] leading-none font-semibold text-encre-faible">{libelle}</span>

      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label={libelle}
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-none border border-bordure-forte bg-surface px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-douce md:min-h-0"
      >
        <span className="flex-none text-xs leading-none font-bold text-encre">{actif}</span>
        {choisie?.libelle && (
          <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-medium text-encre-tenue">
            {choisie.libelle}
          </span>
        )}
        <Icone
          nom={ouvert ? "chevronHaut" : "chevronBas"}
          taille={13}
          epaisseur={1.8}
          className="ml-auto flex-none text-encre-tenue"
        />
      </button>

      {ouvert && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 flex flex-col gap-2 rounded-none border border-bordure-forte bg-surface p-2 shadow-[0_8px_24px_rgba(16,24,40,.12)]">
          <ChampRecherche
            valeur={recherche}
            onChange={setRecherche}
            placeholder="Filtrer par sigle ou par intitulé…"
            autoFocus
          />

          <div role="listbox" aria-label={libelle} className="max-h-[280px] overflow-y-auto">
            {visibles.length === 0 ? (
              <p className="px-3 py-5 text-center text-[11.5px] font-medium text-encre-tenue">
                Aucune structure ne correspond.
              </p>
            ) : (
              visibles.map((ligne, index) => {
                const on = ligne.sigle === actif;

                return (
                  <button
                    key={ligne.sigle}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => retenir(ligne.sigle)}
                    /* Le trait ne separe que les racines : il marque le passage
                       d'une direction a la suivante, ce que l'indentation seule
                       ne montre pas quand la precedente descend de trois crans. */
                    className={`flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left transition-colors duration-150 ${
                      index > 0 && ligne.decalage === 0 ? "border-t border-separateur" : ""
                    } ${on ? "bg-accent-voile" : "hover:bg-surface-douce"}`}
                  >
                    <span
                      className="flex min-w-0 flex-1 items-center gap-2"
                      style={{ paddingLeft: ligne.decalage * 14 }}
                    >
                      <span
                        className={`flex-none text-[11px] leading-none font-bold ${
                          on ? "text-accent-fonce" : "text-encre-douce"
                        }`}
                      >
                        {ligne.sigle}
                      </span>
                      {ligne.libelle && (
                        <span className="min-w-0 truncate text-[11px] leading-none font-medium text-encre-tenue">
                          {ligne.libelle}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LigneStructure {
  sigle: string;
  libelle: string;
  /** Nombre d'ancetres **retenus**, jamais la profondeur absolue. */
  decalage: number;
}

/**
 * Remet les sigles proposes dans l'ordre de l'organigramme, chacun avec son
 * decalage.
 *
 * Un sigle absent du referentiel n'est pas perdu : il tombe a la fin, a plat.
 * C'est le cas d'une structure retiree de l'organigramme mais encore portee par
 * une mesure du mois — la taire aurait fait disparaitre la ligne du selecteur
 * sans que personne ne comprenne pourquoi.
 */
function ordonner(
  sigles: readonly string[],
  sigleTout: string | undefined,
  referentiel: readonly StructureRef[] | undefined,
): LigneStructure[] {
  const attendus = new Set(sigles.filter((sigle) => sigle !== sigleTout));
  const lignes: LigneStructure[] = [];

  if (sigleTout && sigles.includes(sigleTout)) {
    lignes.push({ sigle: sigleTout, libelle: "", decalage: 0 });
  }

  if (referentiel) {
    // La pile porte les profondeurs des seuls noeuds retenus de la branche en
    // cours : c'est ce qui donne un decalage relatif au perimetre, et non a
    // l'organigramme entier.
    const pile: number[] = [];

    for (const noeud of construireArbre(referentiel)) {
      while (pile.length > 0 && pile[pile.length - 1] >= noeud.profondeur) pile.pop();
      if (!attendus.has(noeud.structure.sigle)) continue;

      lignes.push({
        sigle: noeud.structure.sigle,
        libelle: noeud.structure.libelle,
        decalage: pile.length,
      });
      pile.push(noeud.profondeur);
      attendus.delete(noeud.structure.sigle);
    }
  }

  for (const sigle of sigles) {
    if (attendus.has(sigle)) {
      lignes.push({ sigle, libelle: "", decalage: 0 });
      attendus.delete(sigle);
    }
  }

  return lignes;
}
