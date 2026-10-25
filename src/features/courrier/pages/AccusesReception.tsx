import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { SqueletteTexte } from "@/components/ui/Squelette";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { EtatErreur } from "@/components/ui/EtatChargement";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Onglets, type Onglet } from "@/components/ui/Onglets";
import {
  accusesQuery,
  useAccepterCourrier,
  type LigneDecharge,
} from "@/features/courrier/api";
import { useSession } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";

/**
 * A-11 — le cahier de decharge.
 *
 * Au Port, l'agent cote signe un cahier pour prouver qu'il a recu le pli
 * (entretien du 26 aout 2026). Cet ecran est ce cahier : une ligne par
 * affectation, l'etat de sa decharge, et de quoi signer pour un agent absent.
 *
 * **Ce que cet ecran ne fait plus.** Il portait un recepisse imprimable, un
 * depot de scan de decharge et un bouton de relance, dont aucun ne partait
 * nulle part. Ils ont ete retires le 26 aout 2026 : un controle qui promet un
 * geste inexistant se lit comme une panne, et fait croire l'ecran livre.
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
  const [choisi, setChoisi] = useState<LigneDecharge | null>(null);
  const [remisPar, setRemisPar] = useState("");
  const [referenceCahier, setReferenceCahier] = useState("");
  const session = useSession();

  // `isError` est traité, et ce n'est pas une politesse : sans lui, le `= []`
  // transforme une panne en « il n'y a rien à traiter ». Voir docs/pieges.md.
  const { data: accuses = [], isPending, isError, error } = useQuery(accusesQuery(vue));
  const enAttente = accuses.filter((ligne) => ligne.etat !== "Signé").length;

  // Le hook est lie a UN courrier : c'est celui de la ligne choisie. Il se
  // reconstruit a chaque selection, ce qui est exactement le comportement
  // voulu — signer une ligne n'a rien a voir avec la suivante.
  const accepter = useAccepterCourrier(choisi?.courrierId ?? 0);

  function signer() {
    if (!choisi) return;
    accepter.mutate(
      {
        affectationId: choisi.id,
        remisPar: remisPar.trim() || undefined,
        referenceCahier: referenceCahier.trim() || undefined,
      },
      {
        onSuccess: () => {
          setChoisi(null);
          setRemisPar("");
          setReferenceCahier("");
        },
      },
    );
  }

  return (
    <>
      <EnTetePage
        titre="Accusés de réception physiques"
        compte={accuses.length}
        actions={
          enAttente > 0 ? (
            <Etiquette ton="alerte">
              {enAttente} décharge{enAttente > 1 ? "s" : ""} en attente
            </Etiquette>
          ) : undefined
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

            {isError && (
              <div className="px-[26px] py-4">
                <EtatErreur
                  message={
                    error instanceof Error
                      ? error.message
                      : "Le cahier de décharge n'a pas pu être chargé."
                  }
                />
              </div>
            )}

            {!isPending && !isError && accuses.length === 0 && (
              <p className="px-[26px] py-4 text-[12.5px] font-medium text-encre-tenue">
                Aucun pli remis dans cette vue.
              </p>
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
              <Carte titre="Décharge">
                <div className="mt-3.5 rounded-none border border-bordure bg-neutre-voile p-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
                      {choisi.reference}
                    </span>
                    <span className="text-[11px] leading-[1.4] font-medium text-encre-moyenne">
                      {choisi.objet}
                    </span>
                    <span className="text-[11px] leading-[1.4] font-medium text-encre-faible">
                      Remis à {choisi.destinataire} ({choisi.structure}) le{" "}
                      {formaterDate(choisi.remise)}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/courriers/${choisi.courrierId}`}
                  className="mt-3 inline-block text-[11.5px] font-semibold text-accent"
                >
                  Ouvrir le courrier
                </Link>
              </Carte>

              {choisi.etat === "Signé" ? (
                <Encart ton="succes" icone="coche">
                  Reçu par {choisi.recepteur} le {formaterDate(choisi.decharge)}.
                  {choisi.coursier !== "—" && ` Remis par ${choisi.coursier}.`}
                </Encart>
              ) : (
                <Carte titre="Signer la décharge">
                  {/*
                    Deux champs, tous deux facultatifs : un pli remis en main
                    propre n'a pas de coursier, et une structure qui a cessé de
                    tenir le cahier papier ne doit pas être empêchée de signer.
                  */}
                  <div className="mt-3.5 flex flex-col gap-3">
                    <label className="flex flex-col gap-[7px]">
                      <span className="text-[11px] leading-none font-semibold text-encre-faible">
                        Remis par (coursier, ou en main propre)
                      </span>
                      <input
                        value={remisPar}
                        onChange={(e) => setRemisPar(e.target.value)}
                        placeholder="Facultatif"
                        className="w-full rounded-none border border-bordure-forte px-3 py-2.5 text-[12.5px] leading-none font-medium text-encre outline-none placeholder:text-encre-tenue focus:border-accent"
                      />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className="text-[11px] leading-none font-semibold text-encre-faible">
                        Référence au cahier
                      </span>
                      <input
                        value={referenceCahier}
                        onChange={(e) => setReferenceCahier(e.target.value)}
                        placeholder="Facultatif — page, numéro d'ordre"
                        className="w-full rounded-none border border-bordure-forte px-3 py-2.5 text-[12.5px] leading-none font-medium text-encre outline-none placeholder:text-encre-tenue focus:border-accent"
                      />
                    </label>
                  </div>

                  <Bouton
                    variante="principal"
                    className="mt-3.5 w-full justify-center"
                    onClick={signer}
                    disabled={accepter.isPending}
                  >
                    {choisi.destinataire === session.nomComplet
                      ? "J'ai reçu ce courrier"
                      : `Signer pour ${choisi.destinataire}`}
                  </Bouton>

                  {accepter.isError && (
                    <p className="mt-2.5 text-[11px] leading-[1.5] font-semibold text-danger">
                      {accepter.error instanceof Error
                        ? accepter.error.message
                        : "La décharge n'a pas pu être enregistrée."}
                    </p>
                  )}

                  <p className="mt-2.5 text-[10.5px] leading-[1.5] font-medium text-encre-tenue">
                    La signature ouvre le traitement et inscrit l'événement au journal
                    du courrier. Elle ne se reprend pas.
                  </p>
                </Carte>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] font-medium text-encre-tenue">
              Choisissez un pli pour signer sa décharge.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
