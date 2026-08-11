import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { SqueletteTexte } from "@/components/ui/Squelette";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { Onglets, type Onglet } from "@/components/ui/Onglets";
import { accusesQuery, type AccusePhysique } from "@/features/courrier/api";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * A-11 — accuses de reception physiques.
 *
 * Le pli papier circule contre decharge : un recepisse signe prouve la remise.
 * Cet ecran suit ce qui n'est pas encore revenu — sans lui, la seule preuve de
 * transmission serait un souvenir de coursier.
 */
const ONGLETS: readonly Onglet<string>[] = [
  { cle: "tous", libelle: "Tous" },
  { cle: "attente", libelle: "En attente" },
  { cle: "nonRetourne", libelle: "Non retourné" },
];

const TONS: Record<string, TonEtiquette> = {
  Signé: "succes",
  "En attente": "alerte",
  "Non retourné": "danger",
};

const GRILLE =
  "grid grid-cols-[minmax(200px,1.6fr)_minmax(160px,1.2fr)_130px_minmax(150px,1fr)_110px] items-center gap-2.5 px-[26px]";

export function AccusesReception() {
  const [vue, setVue] = useState("tous");
  const [choisi, setChoisi] = useState<AccusePhysique | null>(null);
  const peutImprimer = usePermission(PERMISSIONS.IMP);

  const { data: accuses = [], isPending } = useQuery(accusesQuery(vue));
  const enAttente = accuses.filter((a) => a.etat !== "Signé").length;

  return (
    <>
      <EnTetePage
        titre="Accusés de réception physiques"
        compte={accuses.length}
        actions={
          <div className="flex items-center gap-2">
            <Bouton icone="cloche" disabled={enAttente === 0}>
              Relancer les retards
            </Bouton>
            {peutImprimer && (
              <Bouton variante="principal" icone="imprimante" disabled={!choisi}>
                Imprimer le récépissé
              </Bouton>
            )}
          </div>
        }
      />

      <div className="flex-none">
        <Onglets onglets={ONGLETS} actif={vue} onChange={setVue} />
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-auto">
          <div className="min-w-[860px]">
            <div
              className={`${GRILLE} sticky top-0 z-2 border-b border-bordure bg-surface-tete py-2.5`}
            >
              {["Courrier", "Remis à", "Remise", "Décharge", "État"].map((titre) => (
                <span
                  key={titre}
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

            {accuses.map((accuse) => (
              <button
                key={accuse.id}
                type="button"
                onClick={() => setChoisi(accuse)}
                className={`${GRILLE} w-full border-b border-separateur py-3 text-left transition-colors duration-150 ${
                  choisi?.id === accuse.id ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
                }`}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible tabular-nums">
                    {accuse.reference}
                  </span>
                  <span className="truncate text-xs leading-none font-semibold text-encre">
                    {accuse.objet}
                  </span>
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {accuse.destinataire}
                </span>
                <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                  {accuse.remise}
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-faible">
                  {accuse.recepteur === "—" ? accuse.decharge : accuse.recepteur}
                </span>
                <span className="justify-self-start">
                  <Etiquette ton={TONS[accuse.etat] ?? "neutre"}>{accuse.etat}</Etiquette>
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="overflow-y-auto border-l border-bordure bg-fond p-5">
          {choisi ? (
            <div className="flex flex-col gap-4">
              <Carte titre="Récépissé de remise">
                <div className="mt-3.5 rounded-none border border-bordure bg-neutre-voile p-4">
                  <p className="text-center text-[11px] leading-none font-bold tracking-[.5px] text-encre-faible uppercase">
                    Récépissé de remise
                  </p>
                  <p className="mt-2 text-center text-[10.5px] leading-none font-medium text-encre-tenue">
                    Direction des services rattachés
                  </p>
                  <div className="mt-4 flex flex-col gap-2 border-t border-bordure pt-3">
                    <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
                      {choisi.reference}
                    </span>
                    <span className="text-[11px] leading-[1.4] font-medium text-encre-moyenne">
                      {choisi.objet}
                    </span>
                    <span className="text-[11px] leading-[1.4] font-medium text-encre-faible">
                      Remis à {choisi.destinataire} le {choisi.remise} par {choisi.coursier}
                    </span>
                  </div>
                  <div className="mt-5 border-t border-dashed border-bordure-champ pt-3">
                    <span className="text-[10px] leading-none font-medium text-encre-tenue">
                      Nom, qualité et signature du récepteur
                    </span>
                    <div className="mt-6 h-px bg-bordure-champ" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Bouton className="flex-1 justify-center py-2.5">Imprimer</Bouton>
                  <Bouton className="flex-1 justify-center py-2.5">Dupliquer</Bouton>
                </div>
              </Carte>

              <Carte titre="Enregistrer la décharge signée">
                <label className="mt-3.5 flex cursor-pointer flex-col items-center gap-2 rounded-none border border-dashed border-bordure-champ px-4 py-6 text-center transition-colors duration-150 hover:bg-surface-douce">
                  <Icone nom="numeriser" taille={20} className="text-encre-tenue" />
                  <span className="text-[11.5px] leading-[1.4] font-semibold text-encre-douce">
                    Déposer la photo ou le scan du récépissé signé
                  </span>
                  <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                    JPEG ou PDF, 5 Mo maximum
                  </span>
                  <input type="file" accept="image/jpeg,application/pdf" className="hidden" />
                </label>

                <div className="mt-3.5 flex flex-col gap-[7px]">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible">
                    Date et heure de la décharge
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-none border border-bordure-forte px-3 py-2.5 text-[12.5px] leading-none font-semibold text-encre outline-none focus:border-accent"
                  />
                </div>

                <Bouton variante="principal" className="mt-3.5 w-full justify-center">
                  Valider la décharge
                </Bouton>

                <p className="mt-2.5 text-[10.5px] leading-[1.5] font-medium text-encre-tenue">
                  La validation clôt l'attente d'accusé et inscrit l'événement au journal du courrier.
                </p>
              </Carte>
            </div>
          ) : (
            <p className="text-[12.5px] font-medium text-encre-tenue">
              Choisissez un pli pour afficher son récépissé.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
