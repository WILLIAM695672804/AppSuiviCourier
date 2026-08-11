import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTeteAdmin, OngletsAdmin } from "@/components/EnTeteAdmin";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Champ, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import {
  niveauxQuery,
  postesQuery,
  useEnregistrerNiveau,
  type NiveauHierarchique,
} from "@/features/organisation/api";

/**
 * F-02 / F-03 / F-04 — ossature de l'institution.
 *
 * Deux onglets seulement ici : les habilitations ont leur propre ecran, parce
 * qu'elles relevent d'une autre permission. Un administrateur qui organise les
 * structures n'est pas forcement celui qui distribue les droits, et
 * l'institution a tenu a ce que ces deux mains soient distinctes.
 *
 * Ce que l'on cree ici n'est jamais un « role » : c'est un niveau et un poste.
 * Le code de l'application n'en connaitra que les permissions.
 */
const ONGLETS: readonly { cle: string; libelle: string }[] = [
  { cle: "niveaux", libelle: "Niveaux hiérarchiques" },
  { cle: "postes", libelle: "Postes de travail" },
];

export function Organisation() {
  const [onglet, setOnglet] = useState("niveaux");
  const [choisi, setChoisi] = useState<NiveauHierarchique | null>(null);

  const { data: niveaux = [] } = useQuery(niveauxQuery());
  const { data: postes = [] } = useQuery(postesQuery());
  const enregistrer = useEnregistrerNiveau();

  return (
    <>
      <EnTeteAdmin
        titre="Organisation et profils"
        actions={
          <Bouton icone="horloge">Journal des modifications</Bouton>
        }
      />

      <OngletsAdmin onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex-1">
        {onglet === "niveaux" ? (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
            <Carte titre="Niveaux hiérarchiques">
              <div className="mt-3.5 overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[60px_minmax(150px,1.4fr)_100px_120px_minmax(120px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                    {["Rang", "Libellé du niveau", "Structures", "Postes rattachés", "Cotation"].map(
                      (t) => (
                        <span
                          key={t}
                          className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                        >
                          {t}
                        </span>
                      ),
                    )}
                  </div>

                  {niveaux.map((niveau) => (
                    <button
                      key={niveau.id}
                      type="button"
                      onClick={() => setChoisi(niveau)}
                      className={`grid w-full grid-cols-[60px_minmax(150px,1.4fr)_100px_120px_minmax(120px,1fr)] items-center gap-2.5 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                        choisi?.id === niveau.id ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
                      }`}
                    >
                      <span className="text-[11.5px] leading-none font-bold text-encre-faible tabular-nums">
                        {niveau.rang}
                      </span>
                      <span className="truncate text-xs leading-none font-semibold text-encre">
                        {niveau.libelle}
                      </span>
                      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                        {niveau.nombreStructures}
                      </span>
                      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                        {niveau.nombrePostes}
                      </span>
                      <span className="justify-self-start">
                        {niveau.porteSignature ? (
                          <Etiquette ton="confidentiel">Signature</Etiquette>
                        ) : niveau.peutCoter && niveau.peutRecevoirCotation ? (
                          <Etiquette ton="accent">Cote et reçoit</Etiquette>
                        ) : niveau.peutRecevoirCotation ? (
                          <Etiquette ton="neutre">Reçoit seulement</Etiquette>
                        ) : (
                          <Etiquette ton="neutre">—</Etiquette>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Carte>

            <Carte titre={choisi ? "Modifier le niveau" : "Ajouter un niveau"}>
              <div className="mt-3.5 flex flex-col gap-3.5">
                <Champ
                  libelle="Libellé"
                  defaultValue={choisi?.libelle ?? ""}
                  placeholder="Direction, Service, Bureau…"
                />
                <Liste
                  libelle="Niveau parent autorisé"
                  invite="Aucun — niveau racine"
                  options={niveaux.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
                  defaultValue={choisi?.niveauParentId ? String(choisi.niveauParentId) : ""}
                />

                <div className="flex flex-col gap-2.5 border-t border-separateur pt-3.5">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible">
                    Ce que le niveau autorise
                  </span>
                  <CaseLibellee
                    cochee={choisi?.peutCoter ?? false}
                    onChange={() => {}}
                    libelle="Peut coter vers un niveau inférieur"
                  />
                  <CaseLibellee
                    cochee={choisi?.peutRecevoirCotation ?? true}
                    onChange={() => {}}
                    libelle="Peut recevoir une cotation"
                  />
                  <CaseLibellee
                    cochee={choisi?.porteSignature ?? false}
                    onChange={() => {}}
                    libelle="Porte la signature des courriers départ"
                  />
                  <CaseLibellee
                    cochee={choisi?.ligneStatistiques ?? true}
                    onChange={() => {}}
                    libelle="Apparaît comme ligne des statistiques"
                  />
                </div>

                {choisi && choisi.nombreStructures > 0 && (
                  <Encart ton="alerte" icone="aide">
                    {choisi.nombreStructures} structures utilisent ce niveau. Modifier ce qu'il
                    autorise change le circuit de tous leurs courriers en cours.
                  </Encart>
                )}

                <div className="flex items-center gap-2">
                  <Bouton
                    variante="principal"
                    className="flex-1 justify-center"
                    disabled={enregistrer.isPending}
                  >
                    Enregistrer
                  </Bouton>
                  {choisi && (
                    <Bouton className="flex-1 justify-center" disabled={choisi.nombreStructures > 0}>
                      Supprimer
                    </Bouton>
                  )}
                </div>
              </div>
            </Carte>
          </div>
        ) : (
          <Carte titre="Postes de travail">
            <div className="mt-3.5 overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[minmax(180px,1.6fr)_130px_100px_140px_100px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                  {["Poste de travail", "Structure", "Niveau", "Profil par défaut", "Titulaires"].map(
                    (t) => (
                      <span
                        key={t}
                        className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                      >
                        {t}
                      </span>
                    ),
                  )}
                </div>

                {postes.map((poste) => {
                  const incomplet = poste.titulaires < poste.postesPrevus;
                  return (
                    <div
                      key={poste.id}
                      className="grid grid-cols-[minmax(180px,1.6fr)_130px_100px_140px_100px] items-center gap-2.5 border-b border-separateur py-3"
                    >
                      <span className="truncate text-xs leading-none font-semibold text-encre">
                        {poste.libelle}
                      </span>
                      <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                        {poste.structure}
                      </span>
                      <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                        {poste.niveau}
                      </span>
                      <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                        {poste.profilParDefaut}
                      </span>
                      {/* Un poste vacant est un trou dans le circuit : il se voit. */}
                      <span
                        className={`text-[11.5px] leading-none font-bold tabular-nums ${
                          incomplet ? "text-alerte" : "text-encre-faible"
                        }`}
                      >
                        {poste.titulaires} / {poste.postesPrevus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Carte>
        )}
      </div>
    </>
  );
}
