import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Feu } from "@/components/ui/Feu";
import { NuageDePoints } from "@/components/ui/NuageDePoints";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { analysesQuery, type LigneCroisee } from "@/features/pilotage/apiCockpit";

/**
 * Analyses croisées — §3.11.
 *
 * « Exploiter l'entrepôt de données consolidé pour produire des analyses
 * croisées entre exécution des activités, traitement du courrier, avancement
 * des dossiers et respect des délais. »
 *
 * Le contrôleur de gestion ne vient pas chercher un chiffre — il en a partout
 * ailleurs. Il vient chercher un **lien** : une structure qui exécute mal son
 * plan traite-t-elle aussi mal son courrier, ou les deux sont-ils sans rapport ?
 *
 * D'où les deux vues de la même matière. Le tableau porte les quatre mesures
 * côte à côte, avec leur dispersion — une structure à 90 partout n'appelle pas
 * la même réponse qu'une structure à 90 d'un côté et 45 de l'autre. Le nuage
 * rapproche deux mesures au choix, pour voir si elles varient ensemble.
 *
 * Les constats sont produits par le serveur et décrivent ce qu'on voit. Aucun
 * n'explique quoi que ce soit : c'est le travail du contrôleur, pas celui de
 * l'application.
 */
type Axe = "activites" | "courrier" | "dossiers" | "delais";

const LIBELLES_AXE: Record<Axe, string> = {
  activites: "Exécution des activités",
  courrier: "Traitement du courrier",
  dossiers: "Instruction des dossiers",
  delais: "Respect des délais",
};

const AXES = (Object.keys(LIBELLES_AXE) as Axe[]).map((cle) => ({
  valeur: cle,
  libelle: LIBELLES_AXE[cle],
}));

export function Analyses() {
  const [axeX, setAxeX] = useState<Axe>("activites");
  const [axeY, setAxeY] = useState<Axe>("courrier");

  const { data, isPending } = useQuery(analysesQuery());
  const lignes = data?.lignes ?? [];

  const mesure = (cle: Axe): Colonne<LigneCroisee> => ({
    cle,
    entete: LIBELLES_AXE[cle],
    largeur: "minmax(120px,1fr)",
    rendu: (l) => <BarreProgression taux={l[cle]} />,
  });

  const colonnes: Colonne<LigneCroisee>[] = [
    {
      cle: "structure",
      entete: "Structure",
      largeur: "minmax(180px,1.4fr)",
      role: "titre",
      rendu: (l) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[12.5px] leading-none font-bold text-encre">{l.sigle}</span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {l.libelle}
          </span>
        </span>
      ),
    },
    mesure("activites"),
    mesure("courrier"),
    mesure("dossiers"),
    mesure("delais"),
    {
      cle: "dispersion",
      entete: "Dispersion",
      largeur: "116px",
      alignement: "droite",
      rendu: (l) => (
        <span className="flex min-w-0 flex-col items-end gap-1.5">
          <span
            className={`text-[12px] leading-none font-bold tabular-nums ${
              l.dispersion > 20 ? "text-alerte" : "text-encre"
            }`}
          >
            {l.dispersion} pts
          </span>
          {l.dispersion > 20 && <Feu niveau="orange" libelle="hétérogène" />}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Analyses croisées"
        sousTitre={
          data ? `Activités, courrier, dossiers et délais — ${data.periode}` : undefined
        }
        actions={<Bouton icone="exporter">Exporter en CSV</Bouton>}
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <div className="grid gap-3.5 md:grid-cols-4">
            {(Object.keys(LIBELLES_AXE) as Axe[]).map((cle) => (
              <div
                key={cle}
                className="flex flex-col gap-2 rounded-none border border-bordure bg-surface px-4 py-3.5"
              >
                <span className="truncate text-[11px] leading-none font-semibold text-encre-moyenne">
                  {LIBELLES_AXE[cle]}
                </span>
                <span className="text-[22px] leading-none font-extrabold text-encre tabular-nums">
                  {data?.moyennes[cle] ?? 0}
                </span>
                <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                  moyenne institutionnelle
                </span>
              </div>
            ))}
          </div>

          <Carte titre="Ce que montrent les données">
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {(data?.constats ?? []).map((constat) => (
                <li key={constat.texte} className="flex items-start gap-2.5">
                  <span className="mt-[3px] flex-none">
                    <Feu niveau={constat.feu} muet />
                  </span>
                  <span className="text-[12px] leading-[1.55] font-medium text-encre-moyenne">
                    {constat.texte}
                  </span>
                </li>
              ))}
            </ul>
          </Carte>

          <Carte
            titre="Croisement de deux mesures"
            aDroite={
              <div className="flex flex-wrap items-center gap-2">
                <SelecteurSegments
                  options={AXES}
                  valeur={axeX}
                  onChange={setAxeX}
                  libelle="Mesure en abscisse"
                />
              </div>
            }
          >
            <div className="mt-3 flex flex-col gap-3">
              <SelecteurSegments
                options={AXES}
                valeur={axeY}
                onChange={setAxeY}
                libelle="Mesure en ordonnée"
              />

              <NuageDePoints
                points={lignes.map((l) => ({
                  libelle: l.sigle,
                  x: l[axeX],
                  y: l[axeY],
                  feu: l.feu,
                }))}
                libelleX={LIBELLES_AXE[axeX]}
                libelleY={LIBELLES_AXE[axeY]}
              />
            </div>
          </Carte>

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={lignes}
              cleLigne={(l) => l.sigle}
              vide="Aucune donnée sur cette période."
            />
          </div>
        </div>
      </div>
    </>
  );
}
