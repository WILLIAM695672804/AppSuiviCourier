import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import {
  referentielQuery,
  useValiderRegle,
  type RegleConservation,
  type SortFinal,
} from "@/features/archivage/api";
import { ModaleNouvelleRegle } from "@/features/archivage/components/ModalesArchivage";
import { formaterDate } from "@/lib/format";

/**
 * Référentiel de conservation — RF-GED-06 et RF-ADM-05.
 *
 * Deux notions à ne jamais confondre, et que l'écran sépare visuellement :
 *
 *  — la **durée d'utilité administrative** court depuis la clôture et dit
 *    combien de temps le dossier reste utile au service ;
 *  — le **sort final** dit ce qu'on en fait une fois cette durée écoulée.
 *
 * Une règle sans visa du service des archives figure au référentiel mais n'est
 * opposable à personne : c'est exactement ce que RF-ADM-05 impose en exigeant
 * « validation par le service des archives ». L'écran ne la masque pas, il la
 * signale — une règle invisible aurait été appliquée sans qu'on sache qu'elle
 * ne valait rien.
 */
const TONS_SORT: Record<SortFinal, TonEtiquette> = {
  "Conservation définitive": "accent",
  Destruction: "danger",
  Tri: "alerte",
};

export function ReferentielConservation() {
  const [choisie, setChoisie] = useState<number | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const { data, isPending } = useQuery(referentielQuery());
  const valider = useValiderRegle();

  const regles = data?.regles ?? [];
  const ouverte = regles.find((r) => r.id === choisie) ?? regles[0];

  const colonnes: Colonne<RegleConservation>[] = [
    {
      cle: "typologie",
      entete: "Typologie documentaire",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (r) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {r.typologie}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {r.dossiersConcernes} dossier{r.dossiersConcernes > 1 ? "s" : ""}{" "}
            concerné
            {r.dossiersConcernes > 1 ? "s" : ""}
          </span>
        </span>
      ),
    },
    {
      cle: "dua",
      entete: "Durée d'utilité",
      largeur: "116px",
      rendu: (r) => (
        <span className="text-[12px] leading-none font-bold text-encre tabular-nums">
          {r.dua} ans
        </span>
      ),
    },
    {
      cle: "sort",
      entete: "Sort final",
      largeur: "168px",
      rendu: (r) => (
        <Etiquette ton={TONS_SORT[r.sortFinal]}>{r.sortFinal}</Etiquette>
      ),
    },
    {
      cle: "visa",
      entete: "Visa des archives",
      largeur: "minmax(140px,1fr)",
      rendu: (r) =>
        r.valideePar ? (
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
              {r.valideePar}
            </span>
            <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
              {formaterDate(r.valideeLe)}
            </span>
          </span>
        ) : (
          <Etiquette ton="danger">Non validée</Etiquette>
        ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "96px",
      role: "meta",
      rendu: (r) =>
        r.actif ? (
          <Etiquette ton="succes">Active</Etiquette>
        ) : (
          <Etiquette ton="neutre">Retirée</Etiquette>
        ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Référentiel de conservation"
        compte={regles.length}
        sousTitre="Durée d'utilité administrative et sort final, par typologie documentaire"
        actions={
          <Bouton
            variante="principal"
            icone="plus"
            onClick={() => setModaleOuverte(true)}
          >
            Ajouter une règle
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs
            compteurs={data?.compteurs ?? []}
            chargement={isPending}
          />

          {(data?.enAttenteValidation ?? 0) > 0 && (
            <Encart ton="danger" icone="bouclier">
              {data?.enAttenteValidation} règle
              {(data?.enAttenteValidation ?? 0) > 1 ? "s" : ""} sans visa du
              service des archives. Tant que le visa manque, le sort final
              proposé n'est opposable à personne et aucun dossier de cette
              typologie ne peut être éliminé.
            </Encart>
          )}

          <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
            <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={regles}
                cleLigne={(r) => r.id}
                onLigneClick={(r) => setChoisie(r.id)}
                ligneActive={(r) => r.id === ouverte?.id}
                vide="Aucune règle au référentiel."
              />
            </div>

            {ouverte && (
              <Carte
                titre={ouverte.typologie}
                aDroite={
                  <Etiquette ton={TONS_SORT[ouverte.sortFinal]}>
                    {ouverte.sortFinal}
                  </Etiquette>
                }
              >
                <div className="mt-3.5 flex flex-col gap-3.5">
                  <Definition libelle="Description">
                    {ouverte.description}
                  </Definition>
                  <Definition libelle="Durée d'utilité administrative">
                    {ouverte.dua} ans à compter de la clôture du dossier
                  </Definition>
                  <Definition libelle="Fondement juridique">
                    {ouverte.fondementJuridique}
                  </Definition>
                  <Definition libelle="Visa du service des archives">
                    {ouverte.valideePar
                      ? `${ouverte.valideePar} — ${formaterDate(ouverte.valideeLe)}`
                      : "Non validée"}
                  </Definition>
                </div>

                {!ouverte.valideePar && (
                  <div className="mt-4 flex flex-col gap-3">
                    <Encart ton="danger" icone="bouclier">
                      Cette règle n'a pas reçu le visa du service des archives.
                      Elle ne peut fonder ni une élimination, ni une
                      conservation définitive.
                    </Encart>
                    <Bouton
                      variante="principal"
                      icone="coche"
                      chargement={valider.isPending}
                      onClick={() => valider.mutate({ regleId: ouverte.id })}
                    >
                      {valider.isPending ? "Validation…" : "Apposer le visa"}
                    </Bouton>
                  </div>
                )}

                <p className="mt-4 border-t border-separateur pt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  Le sort final se propose, il ne s'exécute pas. L'élimination
                  d'archives publiques suppose un bordereau et un visa que
                  l'application ne délivre pas.
                </p>
              </Carte>
            )}
          </div>
        </div>
      </div>

      <ModaleNouvelleRegle
        ouverte={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
      />
    </>
  );
}
