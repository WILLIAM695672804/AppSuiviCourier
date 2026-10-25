import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Etiquette } from "@/components/ui/Etiquette";
import { Onglets, type Onglet } from "@/components/ui/Onglets";
import { SqueletteTexte } from "@/components/ui/Squelette";
import {
  LIBELLES_MOTIF_SORTIE,
  bureauOrdreQuery,
  useAccuserReception,
  type EtatPassage,
  type LignePassage,
} from "@/features/courrier/api";
import { ModaleSortieStructure } from "@/features/courrier/components/ModaleSortieStructure";

/**
 * A-02b — le registre du bureau d'ordre de la structure.
 *
 * **Au Port, le bureau d'ordre d'une structure est son point focal.** Cet écran
 * est son cahier : ce qui est arrivé, ce qui est chez lui, ce qui est reparti.
 *
 * Trois onglets, et ce sont trois piles réelles, pas trois filtres décoratifs.
 * « À accuser » est la pile du matin — le courrier est arrivé et personne ne l'a
 * encore ouvert. C'est la seule des trois qui appelle un geste, et c'est pour
 * cela qu'elle est en tête.
 *
 * **L'entrée ne se saisit pas** : elle est posée par le moteur au moment où la
 * cotation nomme la structure. L'écran n'offre donc aucun bouton « déclarer une
 * entrée », et ce n'est pas un manque — datée de l'accusé de réception, la durée
 * de détention aurait toujours été flatteuse.
 *
 * Le « temps d'attente » de la colonne de droite est l'écart entre l'entrée et
 * le tampon : c'est le temps mort du bureau d'ordre, celui que personne ne
 * voyait parce que rien ne le mesurait.
 */
const ONGLETS: readonly Onglet<EtatPassage>[] = [
  { cle: "a_accuser", libelle: "À accuser" },
  { cle: "en_cours", libelle: "Chez nous" },
  { cle: "sortis", libelle: "Sortis" },
];

const GRILLE =
  "grid grid-cols-[minmax(200px,1.8fr)_minmax(120px,.8fr)_110px_minmax(130px,1fr)_minmax(120px,.9fr)] items-center gap-2.5 px-[26px]";

export function BureauOrdre() {
  const [etat, setEtat] = useState<EtatPassage>("a_accuser");
  const [aSortir, setASortir] = useState<LignePassage | null>(null);

  const { data: passages = [], isPending } = useQuery(bureauOrdreQuery(etat));
  const accuser = useAccuserReception();

  const colonnes =
    etat === "sortis"
      ? ["Courrier", "Structure", "Séjour", "Sortie", "Motif"]
      : ["Courrier", "Structure", "Séjour", "Entrée", etat === "en_cours" ? "Accusé" : ""];

  return (
    <>
      <EnTetePage
        titre="Bureau d'ordre"
        compte={passages.length}
        sousTitre="Entrées et sorties de votre structure"
      />

      <div className="flex-none">
        <Onglets onglets={ONGLETS} actif={etat} onChange={setEtat} />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[860px]">
          <div
            className={`${GRILLE} sticky top-0 z-2 border-b border-bordure bg-surface-tete py-2.5`}
          >
            {colonnes.map((titre, index) => (
              <span
                key={titre || `vide-${index}`}
                className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
              >
                {titre}
              </span>
            ))}
          </div>

          {isPending && (
            <div className="px-[26px] py-4">
              <SqueletteTexte lignes={6} />
            </div>
          )}

          {!isPending && passages.length === 0 && (
            <p className="px-[26px] py-8 text-[12.5px] font-medium text-encre-tenue">
              {etat === "a_accuser"
                ? "Aucun courrier en attente d'accusé de réception."
                : etat === "en_cours"
                  ? "Aucun courrier en cours dans la structure."
                  : "Aucune sortie enregistrée."}
            </p>
          )}

          {passages.map((passage) => (
            <div key={passage.id} className={`${GRILLE} border-b border-separateur py-3`}>
              <Link to={`/courriers/${passage.courrierId}`} className="flex min-w-0 flex-col gap-1">
                <span className="text-[11px] leading-none font-semibold text-encre-faible tabular-nums">
                  {passage.numero}
                </span>
                <span className="truncate text-xs leading-none font-semibold text-encre">
                  {passage.objet}
                </span>
                <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                  {passage.correspondant}
                </span>
              </Link>

              <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
                {passage.structure}
              </span>

              {/* Le séjour dans la structure, arrêté à la sortie. C'est le
                  chiffre que le bureau d'ordre peut opposer à une relance. */}
              <span className="text-[11.5px] leading-none font-semibold text-encre tabular-nums">
                {passage.joursDansLaStructure} j
              </span>

              {etat === "sortis" ? (
                <>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                      {formaterDate(passage.sortiLe)}
                    </span>
                    <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                      {passage.sortiPar}
                    </span>
                  </span>
                  <span className="justify-self-start">
                    <Etiquette ton={passage.motifSortie === "reponse" ? "succes" : "neutre"}>
                      {passage.motifSortie
                        ? LIBELLES_MOTIF_SORTIE[passage.motifSortie]
                        : "Non précisé"}
                    </Etiquette>
                  </span>
                </>
              ) : (
                <>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                      {formaterDate(passage.entreLe)}
                    </span>
                    {passage.accuseLe === null && (
                      <span className="text-[10.5px] leading-none font-semibold text-alerte">
                        En attente d'accusé
                      </span>
                    )}
                  </span>

                  <span className="flex items-center gap-2 justify-self-start">
                    {passage.accuseLe === null ? (
                      <Bouton
                        icone="coche"
                        disabled={accuser.isPending}
                        onClick={() => accuser.mutate(passage.id)}
                      >
                        Accuser réception
                      </Bouton>
                    ) : (
                      <>
                        <Etiquette ton="succes">Reçu</Etiquette>
                        <Bouton onClick={() => setASortir(passage)}>Sortie</Bouton>
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {aSortir && (
        <ModaleSortieStructure passage={aSortir} onFermer={() => setASortir(null)} />
      )}
    </>
  );
}

/**
 * Date et heure, en clair.
 *
 * L'heure n'est pas un ornement : l'exigence demande « date, heure, responsable
 * exact », et deux courriers arrivés le même jour à trois heures d'intervalle ne
 * se distinguent que par elle.
 */
function formaterDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
