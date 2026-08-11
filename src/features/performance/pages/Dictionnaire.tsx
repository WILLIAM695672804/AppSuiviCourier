import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Onglets } from "@/components/ui/Onglets";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ModaleNouvelIndicateur } from "@/features/performance/components/ModalesPerformance";
import { dictionnaireQuery, type IndicateurDictionnaire } from "@/features/performance/api";

/**
 * Dictionnaire des indicateurs et grille de cotation des risques — §3.3.
 *
 * « Maintenir le dictionnaire des indicateurs : définition, formule de calcul,
 * source, périodicité, responsable. » Ces cinq champs sont ce qui empêche deux
 * directions de calculer le même taux de deux façons et de se présenter au
 * comité de direction avec des chiffres inconciliables.
 *
 * La formule est affichée en clair, pas cachée dans le code. C'est une
 * exigence de gouvernance : un indicateur dont personne ne sait comment il se
 * calcule ne peut fonder aucune décision, et un responsable qui conteste sa
 * note doit pouvoir refaire l'opération.
 *
 * Un indicateur désactivé reste visible plutôt que supprimé : les scores des
 * mois passés ont été calculés avec, et les effacer rendrait l'historique
 * incompréhensible.
 */
const ONGLETS = [
  { cle: "indicateurs", libelle: "Dictionnaire des indicateurs" },
  { cle: "risques", libelle: "Grille de cotation des risques" },
] as const;

export function Dictionnaire() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["cle"]>("indicateurs");
  const [choisi, setChoisi] = useState<number | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const { data, isPending } = useQuery(dictionnaireQuery());
  const indicateurs = data?.indicateurs ?? [];
  const ouvert = indicateurs.find((i) => i.id === choisi) ?? indicateurs[0];

  const colonnes: Colonne<IndicateurDictionnaire>[] = [
    {
      cle: "code",
      entete: "Code",
      largeur: "104px",
      role: "resume",
      rendu: (i) => (
        <span className="text-[11px] leading-none font-bold text-accent tabular-nums">{i.code}</span>
      ),
    },
    {
      cle: "libelle",
      entete: "Indicateur",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (i) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {i.libelle}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {i.critere ?? "Hors matrice de scoring"}
          </span>
        </span>
      ),
    },
    {
      cle: "periodicite",
      entete: "Périodicité",
      largeur: "116px",
      rendu: (i) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce">
          {i.periodicite}
        </span>
      ),
    },
    {
      cle: "responsable",
      entete: "Responsable",
      largeur: "104px",
      rendu: (i) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce">
          {i.responsable}
        </span>
      ),
    },
    {
      cle: "seuils",
      entete: "Seuils",
      largeur: "136px",
      role: "meta",
      rendu: (i) => (
        <span className="text-[11px] leading-none font-medium text-encre-tenue tabular-nums">
          vert ≥ {i.seuilVert} {i.unite} · orange ≥ {i.seuilOrange}
        </span>
      ),
    },
    {
      cle: "actif",
      entete: "État",
      largeur: "96px",
      rendu: (i) =>
        i.actif ? (
          <Etiquette ton="succes">Actif</Etiquette>
        ) : (
          <Etiquette ton="neutre">Désactivé</Etiquette>
        ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Indicateurs et cotation des risques"
        sousTitre="Le référentiel commun de mesure : définition, formule, source, périodicité"
        actions={
          <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
            Ajouter un indicateur
          </Bouton>
        }
      />

      <Onglets onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        {onglet === "indicateurs" ? (
          <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
            <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={indicateurs}
                cleLigne={(i) => i.id}
                onLigneClick={(i) => setChoisi(i.id)}
                ligneActive={(i) => i.id === ouvert?.id}
                vide="Aucun indicateur au dictionnaire."
              />
            </div>

            {ouvert && (
              <Carte
                titre={ouvert.code}
                aDroite={
                  ouvert.actif ? (
                    <Etiquette ton="succes">Actif</Etiquette>
                  ) : (
                    <Etiquette ton="neutre">Désactivé</Etiquette>
                  )
                }
              >
                <p className="mt-3 text-[13px] leading-[1.4] font-bold text-encre">{ouvert.libelle}</p>

                <div className="mt-4 flex flex-col gap-3.5">
                  <Definition libelle="Définition">{ouvert.definition}</Definition>

                  <Definition libelle="Formule de calcul">
                    <code className="block rounded-none bg-surface-douce px-2.5 py-2 font-mono text-[11.5px] leading-[1.5] font-medium text-encre-douce">
                      {ouvert.formule}
                    </code>
                  </Definition>

                  <Definition libelle="Source">{ouvert.source}</Definition>
                  <Definition libelle="Périodicité">{ouvert.periodicite}</Definition>
                  <Definition libelle="Responsable de la production">{ouvert.responsable}</Definition>

                  <Definition libelle="Seuils de cotation">
                    <span className="flex flex-col gap-2">
                      <Feu niveau="vert" libelle={`À partir de ${ouvert.seuilVert} ${ouvert.unite}`} />
                      <Feu
                        niveau="orange"
                        libelle={`De ${ouvert.seuilOrange} à ${ouvert.seuilVert} ${ouvert.unite}`}
                      />
                      <Feu niveau="rouge" libelle={`En deçà de ${ouvert.seuilOrange} ${ouvert.unite}`} />
                    </span>
                  </Definition>

                  <Definition libelle="Critère alimenté">
                    {ouvert.critere ?? "Aucun — indicateur de suivi seul"}
                  </Definition>
                </div>

                {!ouvert.actif && (
                  <div className="mt-4">
                    <Encart ton="alerte" icone="horloge">
                      Indicateur désactivé : il n'entre plus dans le calcul du mois en cours, mais
                      reste au dictionnaire parce que les scores passés ont été établis avec lui.
                    </Encart>
                  </div>
                )}
              </Carte>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <Encart ton="accent" icone="bouclier">
              La grille de cotation traduit un score en conduite à tenir. Elle est le seul endroit
              où l'application dit ce qu'il faut faire d'un chiffre — ailleurs, elle se contente de
              le mesurer.
            </Encart>

            <div className="grid gap-3.5 md:grid-cols-2">
              {(data?.risques ?? []).map((risque) => (
                <Carte
                  key={risque.niveau}
                  titre={`Niveau ${risque.niveau} — ${risque.libelle}`}
                  aDroite={<Feu niveau={risque.feu} muet />}
                >
                  <p className="mt-3 text-[12px] leading-[1.55] font-medium text-encre-moyenne">
                    {risque.description}
                  </p>
                  <div className="mt-3.5 border-t border-separateur pt-3.5">
                    <Definition libelle="Conduite à tenir">{risque.conduite}</Definition>
                  </div>
                </Carte>
              ))}
            </div>
          </div>
        )}
      </div>

      <ModaleNouvelIndicateur ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
