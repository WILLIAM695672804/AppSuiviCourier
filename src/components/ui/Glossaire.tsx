import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Icone } from "@/components/ui/Icone";
import { Modale } from "@/components/ui/Modale";
import { chercherGlossaire, GLOSSAIRE, type EntreeGlossaire } from "@/lib/glossaire";
import { structuresQuery, type StructureRef } from "@/lib/referentiel";

/**
 * Glossaire des sigles, accessible depuis n'importe quel écran.
 *
 * Une modale plutôt qu'une page : on cherche un sigle **en lisant autre
 * chose**, et l'envoyer sur un autre écran lui ferait perdre ce qu'il était en
 * train de lire.
 *
 * Le champ de recherche prend le focus à l'ouverture. Qui ouvre un glossaire a
 * déjà un sigle en tête ; l'obliger à cliquer avant de le taper ajoute un
 * geste à une consultation qui doit durer trois secondes.
 *
 * Aux trois familles écrites dans `lib/glossaire.ts` s'ajoute l'organigramme,
 * versé depuis le référentiel des structures. C'est ce qui manquait : les
 * sigles qui arrêtent la lecture d'un tableau de bord sont `DAG-MP` et
 * `REP-NDJ`, pas `GED` — et le glossaire ne les connaissait pas.
 */
const FAMILLES: EntreeGlossaire["famille"][] = [
  "Institution",
  "Programme",
  "Métier",
  "Organigramme",
];

export function Glossaire({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const [recherche, setRecherche] = useState("");
  // Le référentiel n'est demandé que lorsque la modale est ouverte : le
  // glossaire est présent sur tous les écrans, le charger partout ferait payer
  // une requête à chaque page pour une modale qui s'ouvre rarement.
  const { data: structures } = useQuery({ ...structuresQuery(), enabled: ouverte });
  const entrees = useMemo(() => [...GLOSSAIRE, ...versEntrees(structures)], [structures]);
  const resultats = chercherGlossaire(recherche, entrees);

  function fermer() {
    setRecherche("");
    onFermer();
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Glossaire"
      sousTitre="Sigles de l'institution, du programme, du métier administratif et de l'organigramme"
      largeur={640}
    >
      <div className="flex flex-col gap-4">
        <ChampRecherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Chercher un sigle ou un mot…"
          autoFocus
        />

        {resultats.length === 0 ? (
          <p className="py-8 text-center text-[12.5px] font-medium text-encre-tenue">
            Aucun sigle ne correspond à « {recherche} ».
          </p>
        ) : (
          FAMILLES.map((famille) => {
            const entrees = resultats.filter((e) => e.famille === famille);
            if (entrees.length === 0) return null;

            return (
              <section key={famille} className="flex flex-col gap-2">
                <h3 className="text-[9.5px] leading-none font-bold tracking-[.5px] text-encre-tenue uppercase">
                  {famille}
                </h3>

                <dl className="flex flex-col">
                  {entrees.map((entree, index) => (
                    <div
                      key={entree.sigle}
                      className={`flex flex-col gap-1.5 py-2.5 md:flex-row md:gap-4 ${
                        index > 0 ? "border-t border-separateur" : ""
                      }`}
                    >
                      <dt className="flex-none md:w-[130px]">
                        <span className="text-[12px] leading-none font-bold text-encre">
                          {entree.sigle}
                        </span>
                      </dt>
                      <dd className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-[12px] leading-[1.35] font-semibold text-encre-douce">
                          {entree.intitule}
                        </span>
                        <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                          {entree.definition}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })
        )}
      </div>
    </Modale>
  );
}

/**
 * Les structures du référentiel, en entrées de glossaire.
 *
 * La définition dit le rattachement, parce que c'est ce qu'on cherche quand un
 * sigle de structure arrête la lecture : pas ce que fait la division, mais de
 * quelle direction elle relève.
 */
function versEntrees(structures: readonly StructureRef[] | undefined): EntreeGlossaire[] {
  if (!structures) return [];

  const parId = new Map(structures.map((structure) => [structure.id, structure]));

  return structures.map((structure) => {
    const parent = structure.parentId === null ? null : parId.get(structure.parentId);

    return {
      sigle: structure.sigle,
      intitule: structure.libelle,
      definition: parent
        ? `${structure.nature} rattachée à ${parent.sigle} — ${parent.libelle}.`
        : `${structure.nature} au sommet de l'organigramme.`,
      famille: "Organigramme" as const,
    };
  });
}

/** Bouton d'ouverture, à poser dans les barres d'outils. */
export function BoutonGlossaire({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ouvrir le glossaire des sigles"
      title="Glossaire des sigles"
      className="cursor-pointer text-encre-tenue transition-colors duration-150 hover:text-encre-faible"
    >
      <Icone nom="aide" taille={17} />
    </button>
  );
}
