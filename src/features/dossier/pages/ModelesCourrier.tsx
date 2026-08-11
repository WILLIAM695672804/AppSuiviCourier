import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { modelesQuery, type ModeleCourrier } from "@/features/dossier/api";
import { formaterDate } from "@/lib/format";

/**
 * Bibliothèque des courriers-type — RF-SUI-05.
 *
 * « Génération automatique de courriers-type par fusion de documents à partir
 * de modèles. » L'écran sert deux usages qui n'ont pas le même public :
 * l'instructeur vient vérifier ce que dit un modèle avant de l'employer,
 * l'administrateur fonctionnel vient le corriger.
 *
 * Le corps du modèle est montré en entier, variables comprises. Un modèle dont
 * on ne voit que le titre s'emploie à l'aveugle — et c'est ainsi que partent
 * des courriers où subsistent des `{{variables}}` non remplacées.
 *
 * Les modèles de rejet portent les mentions de recours. C'est la raison pour
 * laquelle ils existent : un rejet notifié sans voies de recours est
 * attaquable, quel que soit son bien-fondé.
 */
export function ModelesCourrier() {
  const [choisi, setChoisi] = useState<number | null>(null);
  const { data, isPending } = useQuery(modelesQuery());

  const modeles = data?.modeles ?? [];
  const ouvert = modeles.find((m) => m.id === choisi) ?? modeles[0];

  const colonnes: Colonne<ModeleCourrier>[] = [
    {
      cle: "code",
      entete: "Code",
      largeur: "112px",
      role: "resume",
      rendu: (m) => (
        <span className="text-[11px] leading-none font-bold text-accent tabular-nums">{m.code}</span>
      ),
    },
    {
      cle: "libelle",
      entete: "Modèle",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (m) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {m.libelle}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {m.typologie}
          </span>
        </span>
      ),
    },
    {
      cle: "variables",
      entete: "Variables",
      largeur: "104px",
      rendu: (m) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {m.variables.length}
        </span>
      ),
    },
    {
      cle: "usage",
      entete: "Utilisations",
      largeur: "112px",
      alignement: "droite",
      rendu: (m) => (
        <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
          {m.utilisations}
        </span>
      ),
    },
    {
      cle: "maj",
      entete: "Mis à jour",
      largeur: "128px",
      role: "meta",
      rendu: (m) => (
        <span className="text-[11px] leading-none font-medium text-encre-tenue tabular-nums">
          {formaterDate(m.misAJourLe)}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Courriers-type"
        compte={modeles.length}
        sousTitre="Modèles employés à la fusion, depuis la fiche d'un dossier"
        actions={
          <Bouton variante="principal" icone="plus">
            Ajouter un modèle
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={modeles}
              cleLigne={(m) => m.id}
              onLigneClick={(m) => setChoisi(m.id)}
              ligneActive={(m) => m.id === ouvert?.id}
              vide="Aucun modèle en bibliothèque."
            />
          </div>

          {ouvert && (
            <Carte titre={ouvert.code}>
              <p className="mt-3 text-[13px] leading-[1.4] font-bold text-encre">{ouvert.libelle}</p>

              <div className="mt-3.5 flex flex-col gap-3.5">
                <Definition libelle="Objet">{ouvert.description}</Definition>
                <Definition libelle="Typologie">{ouvert.typologie}</Definition>

                <Definition libelle="Variables">
                  <span className="flex flex-wrap gap-1.5">
                    {ouvert.variables.map((variable) => (
                      <code
                        key={variable}
                        className="rounded-none bg-accent-voile px-1.5 py-1 font-mono text-[10px] leading-none font-semibold text-accent-fonce"
                      >
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </span>
                </Definition>

                <Definition libelle="Corps du modèle">
                  <span className="mt-1 block max-h-[280px] overflow-y-auto rounded-none border border-bordure bg-surface-douce px-3 py-2.5">
                    <span className="block text-[11.5px] leading-[1.65] font-medium whitespace-pre-line text-encre-douce">
                      {ouvert.corps}
                    </span>
                  </span>
                </Definition>

                <Definition libelle="Dernière mise à jour">
                  {formaterDate(ouvert.misAJourLe)} par {ouvert.misAJourPar}
                </Definition>
              </div>

              {ouvert.code === "REJ-MOT" && (
                <div className="mt-4">
                  <Encart ton="alerte" icone="bouclier">
                    Ce modèle porte les mentions de recours. Un rejet notifié sans elles est
                    attaquable, quel que soit son bien-fondé : ne les retirez pas.
                  </Encart>
                </div>
              )}
            </Carte>
          )}
        </div>
      </div>
    </>
  );
}
