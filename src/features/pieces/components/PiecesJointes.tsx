import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { ChargementComposant } from "@/components/ui/EtatChargement";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import {
  adresseContenu,
  piecesQuery,
  useDeposerPiece,
  useRetirerPiece,
  type PieceJointe,
  type TypeRattachable,
} from "@/features/pieces/api";
import { ErreurApi } from "@/lib/api";

/**
 * Le panneau des pièces jointes — RF-GED-04 et RF-GED-09.
 *
 * **Un seul composant pour tous les piliers.** Une activité, un dossier et une
 * demande d'usager portent leurs pièces par la même route ; ce qui change est
 * l'objet passé en propriété. Un panneau par pilier aurait fait trois fois le
 * même écran, dont deux auraient fini par oublier l'empreinte ou le retrait.
 *
 * Trois partis pris que l'écran doit rendre visibles :
 *
 *  - **Une nouvelle version n'écrase pas la précédente.** Le bouton s'appelle
 *    « Nouvelle version », jamais « Remplacer », et les versions antérieures
 *    restent listées sous la ligne courante, téléchargeables.
 *  - **Retirer n'est pas supprimer.** La ligne reste, marquée. Faire disparaître
 *    une pièce d'un dossier qu'on relit est pire que la voir barrée.
 *  - **L'empreinte est affichée.** C'est la preuve d'intégrité de RF-GED-09, et
 *    une preuve qu'on ne peut pas lire ne prouve rien.
 *
 * Le téléchargement est un lien, pas un appel : le navigateur porte le cookie
 * de session, et le serveur répond en pièce attachée. Passer par `fetch`
 * obligerait à garder tout le binaire en mémoire pour reconstruire un `blob:`.
 */
export function PiecesJointes({
  objetType,
  objetId,
  titre = "Pièces jointes",
  lectureSeule = false,
}: {
  objetType: TypeRattachable;
  objetId: number;
  titre?: string;
  /** Masque le dépôt et le retrait, sans masquer les pièces. */
  lectureSeule?: boolean;
}) {
  const entree = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const [remplace, setRemplace] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const { data, isPending } = useQuery(piecesQuery(objetType, objetId));
  const deposer = useDeposerPiece(objetType, objetId);
  const retirer = useRetirerPiece(objetType, objetId);

  const pieces = data ?? [];

  function envoyer(liste: FileList | null) {
    const fichier = liste?.[0];
    if (!fichier) return;
    setErreur(null);
    deposer.mutate(
      { fichier, remplaceUid: remplace ?? undefined },
      {
        // Le message vient du serveur : c'est lui qui tient le plafond et la
        // liste des extensions, et les recopier ici ferait afficher une règle
        // fausse le jour où la direction tranche A49 ou A50.
        onError: (e) => setErreur(e instanceof ErreurApi ? e.message : "Le dépôt n'a pas abouti."),
        onSettled: () => setRemplace(null),
      },
    );
  }

  function demanderRetrait(piece: PieceJointe) {
    const motif = window.prompt(
      `Motif du retrait de « ${piece.nom} » — il restera au journal, et la pièce ne sera pas effacée.`,
    );
    if (!motif) return;
    setErreur(null);
    retirer.mutate(
      { uid: piece.uid, motif },
      {
        onError: (e) =>
          setErreur(e instanceof ErreurApi ? e.message : "Le retrait n'a pas abouti."),
      },
    );
  }

  return (
    <Carte>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] leading-none font-bold text-encre">
            {titre}
            {pieces.length > 0 && (
              <span className="ml-2 font-semibold text-encre-tenue tabular-nums">
                {pieces.length}
              </span>
            )}
          </span>
          {!lectureSeule && (
            <Bouton
              icone="plus"
              chargement={deposer.isPending}
              onClick={() => {
                setRemplace(null);
                entree.current?.click();
              }}
            >
              Déposer
            </Bouton>
          )}
        </div>

        {erreur && (
          <Encart ton="danger" icone="aide">
            {erreur}
          </Encart>
        )}

        {isPending ? (
          <ChargementComposant message="Chargement des pièces…" compact />
        ) : pieces.length === 0 ? (
          <p className="text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
            Aucune pièce jointe.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pieces.map((piece) => (
              <li key={piece.uid} className="border border-bordure px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Icone nom="document" taille={15} className="flex-none text-encre-tenue" />
                  {/* Sans binaire, pas de lien. Une ligne « pièce jointe » qui
                      renvoie une erreur au clic use la confiance dans toutes les
                      autres — voir docs/pieges.md. */}
                  {piece.telechargeable ? (
                    <a
                      href={adresseContenu(piece.uid)}
                      className={`min-w-0 flex-1 truncate text-[12px] leading-none font-semibold hover:underline ${
                        piece.retiree ? "text-encre-tenue line-through" : "text-encre"
                      }`}
                    >
                      {piece.nom}
                    </a>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[12px] leading-none font-semibold text-encre-tenue">
                      {piece.nom}
                    </span>
                  )}
                  {piece.version > 1 && <Etiquette ton="accent">v{piece.version}</Etiquette>}
                  {piece.retiree && <Etiquette ton="danger">Retirée</Etiquette>}
                  {!piece.telechargeable && <Etiquette ton="alerte">Sans fichier</Etiquette>}
                  <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                    {piece.tailleLisible} · {piece.deposeeLe}
                  </span>
                  {!lectureSeule && !piece.retiree && (
                    <>
                      <Bouton
                        icone="exporter"
                        onClick={() => {
                          setRemplace(piece.uid);
                          entree.current?.click();
                        }}
                      >
                        Nouvelle version
                      </Bouton>
                      <Bouton icone="croix" onClick={() => demanderRetrait(piece)}>
                        Retirer
                      </Bouton>
                    </>
                  )}
                </div>

                {/* L'empreinte, en clair. Elle est ce qui permet, des années plus
                    tard, de dire que le fichier téléchargé est bien celui qui a
                    été déposé ce jour-là (RF-GED-09). Une mention sans fichier
                    n'en a pas : afficher « SHA-256 » suivi du vide donnerait à
                    croire à une empreinte perdue plutôt qu'à un dépôt qui n'a
                    pas eu lieu. */}
                {piece.telechargeable ? (
                  <p className="mt-1.5 truncate font-mono text-[10px] leading-none text-encre-tenue">
                    SHA-256 {piece.empreinte}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[10.5px] leading-[1.5] font-medium text-encre-tenue">
                    Mention sans fichier : seuls le nom et le poids ont été inscrits, le document
                    lui-même n'a jamais été versé. Déposez-le pour qu'il devienne consultable.
                  </p>
                )}

                {piece.versions.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 border-l border-bordure pl-3">
                    {piece.versions.map((version) => (
                      <li key={version.uid} className="flex items-center gap-2">
                        <a
                          href={adresseContenu(version.uid)}
                          className="text-[11px] leading-none font-semibold text-encre-faible hover:underline"
                        >
                          Version {version.version}
                        </a>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                          {version.tailleLisible} · {version.deposeeLe}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}

        {!lectureSeule && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(false);
              envoyer(e.dataTransfer.files);
            }}
            className={`border border-dashed px-4 py-4 text-center transition-colors duration-150 ${
              survol ? "border-accent bg-accent-voile" : "border-bordure-forte bg-surface-douce"
            }`}
          >
            <span className="text-[11px] leading-none font-medium text-encre-tenue">
              Glisser un fichier ici, ou utiliser « Déposer ».
            </span>
          </div>
        )}

        {/* Un seul fichier à la fois : le dépôt est un acte, et un envoi groupé
            rendrait indécidable ce que « Nouvelle version » remplace. */}
        <input
          ref={entree}
          type="file"
          onChange={(e) => {
            envoyer(e.target.files);
            // Remis à zéro pour que redéposer le même fichier déclenche l'événement.
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
    </Carte>
  );
}
