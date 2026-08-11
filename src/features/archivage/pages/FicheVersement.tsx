import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition, GrilleDefinitions } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { versementQuery, type EtatVersement } from "@/features/archivage/api";
import {
  ModalePreuveIntegrite,
  ModaleVerser,
} from "@/features/archivage/components/ModalesArchivage";
import { formaterDate, formaterDateHeure } from "@/lib/format";

/**
 * Fiche d'un dossier à verser : contrôle de conformité et preuve d'intégrité.
 *
 * L'écran répond à trois questions dans cet ordre : le dossier est-il complet,
 * sa durée d'utilité est-elle échue, et que peut-on produire à un tiers qui le
 * réclame.
 *
 * La chaîne d'empreintes est la pièce maîtresse. Chaque étape — clôture,
 * contrôle, versement — scelle l'état du dossier à ce moment. C'est ce qui
 * permet de démontrer, des années plus tard, qu'aucune pièce n'a été ajoutée
 * ni retirée depuis la clôture. Une preuve d'intégrité sans chaîne ne prouve
 * que l'état du jour où on l'a produite.
 */
const TONS_ETAT: Record<EtatVersement, TonEtiquette> = {
  "À verser": "accent",
  "En cours": "alerte",
  Versé: "succes",
  Anomalie: "danger",
};

export function FicheVersement() {
  const { id } = useParams();
  const [modale, setModale] = useState<"verser" | "preuve" | null>(null);
  const { data: versement } = useQuery(versementQuery(Number(id)));

  if (!versement) {
    return (
      <>
        <EnTetePage
          titre="Versement"
          miettes={[{ libelle: "Versements", chemin: "/archivage/versements" }]}
        />
        <EtatChargement message="Ouverture du versement…" />
      </>
    );
  }

  const bloquantes = versement.anomalies.filter((a) => a.bloquante);
  const echeanceDepassee =
    versement.echeanceSortFinal < new Date().toISOString().slice(0, 10) &&
    versement.etat !== "Versé";

  return (
    <>
      <EnTetePage
        titre={versement.objet}
        sousTitre={`${versement.reference} · ${versement.typologie}`}
        miettes={[
          { libelle: "Versements", chemin: "/archivage/versements" },
          { libelle: versement.reference },
        ]}
        actions={
          <>
            <Bouton icone="bouclier" onClick={() => setModale("preuve")}>
              Produire une preuve
            </Bouton>
            {versement.etat !== "Versé" && (
              <Bouton
                variante="principal"
                icone="archive"
                disabled={bloquantes.length > 0}
                title={
                  bloquantes.length > 0
                    ? "Une anomalie bloquante empêche le versement."
                    : undefined
                }
                onClick={() => setModale("verser")}
              >
                Verser au système d'archivage
              </Bouton>
            )}
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <Carte
              titre="Le dossier"
              aDroite={<Etiquette ton={TONS_ETAT[versement.etat]}>{versement.etat}</Etiquette>}
            >
              <GrilleDefinitions>
                <Definition libelle="Structure d'origine">{versement.structure}</Definition>
                <Definition libelle="Clos le">{formaterDate(versement.closLe)}</Definition>
                <Definition libelle="Durée d'utilité administrative">
                  {versement.dua} ans
                </Definition>
                <Definition libelle="Sort final">{versement.sortFinal}</Definition>
                <Definition libelle="Échéance du sort final">
                  {formaterDate(versement.echeanceSortFinal)}
                </Definition>
                <Definition libelle="Versé le">
                  {versement.verseLe
                    ? `${formaterDate(versement.verseLe)} par ${versement.versePar}`
                    : "Non versé"}
                </Definition>
              </GrilleDefinitions>

              <div className="mt-4 border-t border-separateur pt-4">
                <Definition libelle="Fondement juridique">{versement.fondementJuridique}</Definition>
              </div>

              {echeanceDepassee && (
                <div className="mt-4">
                  <Encart ton="danger" icone="horloge">
                    La durée d'utilité administrative est échue depuis le{" "}
                    {formaterDate(versement.echeanceSortFinal)}. Le sort final aurait dû être
                    proposé à cette date : c'est une non-conformité opposable en cas de contrôle.
                  </Encart>
                </div>
              )}
            </Carte>

            <Carte
              titre="Contrôle de conformité"
              aDroite={
                versement.anomalies.length === 0 ? (
                  <Etiquette ton="succes">Conforme</Etiquette>
                ) : (
                  <Etiquette ton={bloquantes.length > 0 ? "danger" : "alerte"}>
                    {versement.anomalies.length} anomalie
                    {versement.anomalies.length > 1 ? "s" : ""}
                  </Etiquette>
                )
              }
            >
              {versement.anomalies.length === 0 ? (
                <p className="mt-3.5 text-[12px] leading-[1.5] font-medium text-encre-tenue">
                  Aucune anomalie. Le dossier est complet et sa règle de conservation est validée.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {versement.anomalies.map((anomalie) => (
                    <li
                      key={anomalie.libelle}
                      className={`flex flex-col gap-1.5 rounded-none border px-3.5 py-3 ${
                        anomalie.bloquante
                          ? "border-danger-trait bg-danger-voile"
                          : "border-alerte-trait bg-alerte-voile"
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] leading-none font-bold text-encre">
                          {anomalie.libelle}
                        </span>
                        {anomalie.bloquante && <Etiquette ton="danger">Bloquante</Etiquette>}
                      </span>
                      <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                        {anomalie.precision}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>

            <Carte
              titre="Pièces du dossier"
              aDroite={
                <span
                  className={`text-[11px] leading-none font-bold tabular-nums ${
                    versement.pieces < versement.piecesAttendues ? "text-danger" : "text-encre-tenue"
                  }`}
                >
                  {versement.pieces} / {versement.piecesAttendues}
                </span>
              }
            >
              <ul className="mt-3.5 flex flex-col">
                {versement.piecesJointes.map((piece, index) => (
                  <li
                    key={piece.id}
                    className={`flex items-center gap-2.5 py-2.5 ${
                      index > 0 ? "border-t border-separateur" : ""
                    }`}
                  >
                    <Icone
                      nom={piece.presente ? "document" : "croix"}
                      taille={14}
                      className={`flex-none ${piece.presente ? "text-encre-tenue" : "text-danger"}`}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-[12px] leading-none font-semibold ${
                        piece.presente ? "text-encre" : "text-danger"
                      }`}
                    >
                      {piece.nom}
                    </span>
                    <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                      {piece.presente ? `${piece.format} · ${piece.taille}` : "manquante"}
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          </div>

          <Carte titre="Chaîne d'intégrité">
            <p className="mt-2.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Chaque étape scelle l'état du dossier à ce moment. C'est cette chaîne qui permet de
              démontrer qu'aucune pièce n'a été ajoutée ni retirée depuis la clôture.
            </p>

            <ul className="mt-3.5 flex flex-col gap-3.5">
              {versement.chaineIntegrite.map((maillon, index) => (
                <li key={maillon.empreinte} className="flex gap-3">
                  <span className="flex flex-none flex-col items-center">
                    <span className="grid size-6 place-items-center rounded-none border border-accent-trait bg-accent-voile text-[10px] font-bold text-accent-fonce tabular-nums">
                      {index + 1}
                    </span>
                    {index < versement.chaineIntegrite.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-bordure" />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1.5 pb-1">
                    <span className="text-[12px] leading-none font-semibold text-encre">
                      {maillon.etape}
                    </span>
                    <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                      {formaterDateHeure(maillon.horodatage)}
                    </span>
                    <code className="mt-0.5 rounded-none bg-surface-douce px-2 py-1.5 font-mono text-[9.5px] leading-[1.5] break-all text-encre-faible">
                      {maillon.empreinte}
                    </code>
                  </span>
                </li>
              ))}
            </ul>
          </Carte>
        </div>
      </div>

      <ModaleVerser
        ouverte={modale === "verser"}
        onFermer={() => setModale(null)}
        versement={versement}
      />
      <ModalePreuveIntegrite
        ouverte={modale === "preuve"}
        onFermer={() => setModale(null)}
        versement={versement}
      />
    </>
  );
}
