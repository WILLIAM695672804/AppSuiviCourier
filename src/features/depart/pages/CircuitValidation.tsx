import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { circuitQuery, useViser } from "@/features/depart/api";
import { usePermission } from "@/lib/contexteSession";
import { formaterDateHeure } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * B-02 — circuit de validation d'un projet de reponse.
 *
 * Trois actions seulement, et elles s'excluent : viser, renvoyer, deleguer.
 * Le renvoi n'est pas un refus — il ramene le projet au redacteur avec un
 * motif, et le circuit repart de la. C'est pourquoi le motif est exige.
 */
export function CircuitValidation() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const departId = Number(id);

  const { data, isPending } = useQuery(circuitQuery(departId));
  const viser = useViser(departId);
  const peutViser = usePermission(PERMISSIONS.VAL);

  const [observation, setObservation] = useState("");
  const [modeRenvoi, setModeRenvoi] = useState(false);

  if (isPending || !data) {
    return (
      <>
        <EnTetePage
          titre="Circuit de validation"
          miettes={[{ libelle: "Courriers départ", chemin: "/courriers/departs" }]}
        />
        <EtatChargement message="Chargement du circuit…" />
      </>
    );
  }

  const monTour = data.etapes.find((e) => e.etat === "attendu" && e.estMoi);

  async function agir(action: "viser" | "renvoyer") {
    await viser.mutateAsync({ action, observation: observation.trim() });
    setObservation("");
    setModeRenvoi(false);
  }

  return (
    <>
      <EnTetePage
        titre="Circuit de validation"
        miettes={[
          { libelle: "Courriers départ", chemin: "/courriers/departs" },
          { libelle: data.numero ?? "Projet", chemin: `/courriers/departs/${departId}` },
          { libelle: "Circuit" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Bouton onClick={() => naviguer(`/courriers/departs/${departId}`)}>Voir le projet</Bouton>
            {peutViser && monTour && (
              <>
                <Bouton icone="croix" onClick={() => setModeRenvoi(true)}>
                  Renvoyer pour correction
                </Bouton>
                <Bouton
                  variante="principal"
                  icone="coche"
                  onClick={() => agir("viser")}
                  chargement={viser.isPending}
                >
                  Apposer mon visa
                </Bouton>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <Carte
            titre="Étapes du circuit"
            aDroite={
              <span className="rounded-none bg-[#f2f4f7] px-2 py-[5px] text-[11px] leading-none font-semibold text-encre-faible">
                Mode {data.mode === "CASCADE" ? "cascade" : "parallèle"}
              </span>
            }
          >
            <ol className="mt-4">
              {data.etapes.map((etape, i) => {
                const derniere = i === data.etapes.length - 1;
                return (
                  <li key={etape.ordre} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3.5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="relative">
                        <Avatar initiales={etape.initiales} titre={etape.nomComplet} />
                        {etape.etat === "vise" && (
                          <span className="absolute -right-0.5 -bottom-0.5 grid size-3.5 place-items-center rounded-none border-2 border-white bg-succes text-white">
                            <Icone nom="coche" taille={7} epaisseur={3} />
                          </span>
                        )}
                        {etape.etat === "renvoye" && (
                          <span className="absolute -right-0.5 -bottom-0.5 grid size-3.5 place-items-center rounded-none border-2 border-white bg-danger-vif text-white">
                            <Icone nom="croix" taille={7} epaisseur={3} />
                          </span>
                        )}
                      </span>
                      {!derniere && <div className="w-[1.5px] flex-1 bg-bordure" />}
                    </div>

                    <div className="flex flex-col gap-1.5 pb-[18px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] leading-none font-bold text-encre">
                          {etape.nomComplet}
                        </span>
                        {etape.etat === "vise" && <Etiquette ton="succes">Visé</Etiquette>}
                        {etape.etat === "renvoye" && <Etiquette ton="danger">Renvoyé</Etiquette>}
                        {etape.etat === "attendu" && (
                          <Etiquette ton="alerte">
                            En attente{etape.depuis ? ` · depuis ${etape.depuis}` : ""}
                          </Etiquette>
                        )}
                      </div>
                      <span className="text-[11.5px] leading-[1.5] font-medium text-encre-faible">
                        {etape.estMoi && etape.etat === "attendu"
                          ? `${etape.fonction} — votre visa est attendu`
                          : etape.fonction}
                      </span>
                      {etape.horodatage && (
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          {formaterDateHeure(etape.horodatage)}
                        </span>
                      )}
                      {etape.observation && (
                        <blockquote className="mt-1 border-l-2 border-bordure pl-3">
                          <p className="text-xs leading-[1.6] font-medium text-encre-moyenne">
                            {etape.observation}
                          </p>
                        </blockquote>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Carte>

          <div className="flex min-w-0 flex-col gap-4">
            {peutViser && monTour ? (
              <Carte titre={modeRenvoi ? "Motif du renvoi" : "Mon visa"}>
                <div className="mt-3.5 flex flex-col gap-3">
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={4}
                    placeholder={
                      modeRenvoi
                        ? "Indiquez ce qui doit être corrigé avant nouvelle soumission."
                        : "Observation transmise avec le visa (facultative)"
                    }
                    className="w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
                  />

                  {modeRenvoi ? (
                    <>
                      <Bouton
                        variante="principal"
                        className="w-full justify-center"
                        onClick={() => agir("renvoyer")}
                        disabled={!observation.trim() || viser.isPending}
                      >
                        Renvoyer au rédacteur
                      </Bouton>
                      <Bouton className="w-full justify-center" onClick={() => setModeRenvoi(false)}>
                        Annuler
                      </Bouton>
                    </>
                  ) : (
                    <>
                      <Bouton
                        variante="principal"
                        icone="coche"
                        className="w-full justify-center"
                        onClick={() => agir("viser")}
                        disabled={viser.isPending}
                      >
                        Viser et transmettre
                      </Bouton>
                      <Bouton className="w-full justify-center" onClick={() => setModeRenvoi(true)}>
                        Renvoyer au rédacteur
                      </Bouton>
                      <Bouton icone="personnes" className="w-full justify-center">
                        Déléguer
                      </Bouton>
                    </>
                  )}
                </div>
              </Carte>
            ) : (
              <Carte>
                <Encart ton="succes" icone="coche">
                  {data.etapes.some((e) => e.estMoi && e.etat === "vise")
                    ? "Visa apposé — transmis à la signature."
                    : "Ce projet n'attend pas votre visa."}
                </Encart>
              </Carte>
            )}

            <Carte titre="Le projet">
              <div className="mt-3 flex flex-col gap-2">
                <span className="text-[12.5px] leading-[1.4] font-bold text-encre">{data.objet}</span>
                <span className="text-[11px] leading-none font-medium text-encre-faible">
                  {data.destinataire} · {data.redacteur}
                </span>
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </>
  );
}
