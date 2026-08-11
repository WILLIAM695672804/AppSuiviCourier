import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Etiquette } from "@/components/ui/Etiquette";
import { Interrupteur } from "@/components/ui/Interrupteur";
import { statutAffiche } from "@/features/courrier/statut";
import {
  rechercheQuery,
  recherchesEnregistreesQuery,
  type CriteresRecherche,
} from "@/features/suivi/api";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { naturesQuery, structuresQuery } from "@/lib/referentiel";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * A-14 / C-01 — recherche et archives.
 *
 * Deux fonds en un seul ecran : le registre courant et l'archive. C'est
 * volontaire — l'agent qui cherche un courrier ne sait pas s'il est archive,
 * et lui demander de choisir d'abord serait lui demander la reponse.
 *
 * La session « Confidentiel » n'apparait que si l'habilitation l'ouvre : ce
 * n'est pas un filtre, c'est une porte.
 */
const SESSIONS = [
  { code: "ARRIVE", libelle: "Arrivé" },
  { code: "DEPART", libelle: "Départ" },
  { code: "INTERNE", libelle: "Interne" },
] as const;

const STATUTS = [
  { code: "enCours", libelle: "En cours" },
  { code: "cloture", libelle: "Clôturé" },
  { code: "horsDelai", libelle: "Hors délai" },
  { code: "archive", libelle: "Archivé" },
] as const;

const VIDE: CriteresRecherche = {
  motsCles: "",
  du: "",
  au: "",
  sessions: [],
  statuts: [],
  structureId: "",
  natureId: "",
  inclureArchives: false,
};

const GRILLE =
  "grid grid-cols-[70px_minmax(200px,2fr)_minmax(140px,1fr)_100px_110px_110px] items-center gap-2.5 px-5";

export function Recherche() {
  const [criteres, setCriteres] = useState<CriteresRecherche>(VIDE);
  const [lances, setLances] = useState<CriteresRecherche | null>(null);

  const peutVoirConfidentiel = usePermission(PERMISSIONS.CONF);
  const { data: structures = [] } = useQuery(structuresQuery());
  const { data: natures = [] } = useQuery(naturesQuery());
  const { data: enregistrees = [] } = useQuery(recherchesEnregistreesQuery());
  const { data: resultats, isFetching } = useQuery(rechercheQuery(lances));

  function modifier(champ: keyof CriteresRecherche, valeur: unknown) {
    setCriteres((precedents) => ({ ...precedents, [champ]: valeur }));
  }

  function basculerListe(champ: "sessions" | "statuts", code: string) {
    setCriteres((precedents) => {
      const liste = precedents[champ];
      return {
        ...precedents,
        [champ]: liste.includes(code) ? liste.filter((x) => x !== code) : [...liste, code],
      };
    });
  }

  return (
    <>
      <EnTetePage
        titre="Recherche et archives"
        sousTitre="Registre courant et fonds archivé depuis 2019"
        actions={
          <div className="flex items-center gap-2">
            <Bouton icone="document">Enregistrer la recherche</Bouton>
            <Bouton variante="principal" icone="exporter" disabled={!resultats?.lignes.length}>
              Exporter les résultats
            </Bouton>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[308px_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <Carte
              titre="Critères"
              aDroite={
                <button
                  type="button"
                  onClick={() => setCriteres(VIDE)}
                  className="text-[11px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Réinitialiser
                </button>
              }
            >
              <div className="mt-3.5 flex flex-col gap-[15px]">
                <Etiqueteur
                  libelle="Mots-clés"
                  aide="Recherche dans l'objet, l'expéditeur et le texte reconnu des pages numérisées."
                >
                  <ChampRecherche
                    valeur={criteres.motsCles}
                    onChange={(v) => modifier("motsCles", v)}
                    placeholder="facture maintenance"
                  />
                </Etiqueteur>

                <div className="flex flex-col gap-[7px]">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible">
                    Période d'enregistrement
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={criteres.du}
                      onChange={(e) => modifier("du", e.target.value)}
                      aria-label="Du"
                      className="min-w-0 flex-1 rounded-none border border-bordure-forte px-[11px] py-2.5 text-[11.5px] leading-none font-semibold text-encre outline-none focus:border-accent"
                    />
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">au</span>
                    <input
                      type="date"
                      value={criteres.au}
                      onChange={(e) => modifier("au", e.target.value)}
                      aria-label="Au"
                      className="min-w-0 flex-1 rounded-none border border-bordure-forte px-[11px] py-2.5 text-[11.5px] leading-none font-semibold text-encre outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-[9px]">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible">
                    Session
                  </span>
                  {SESSIONS.map((s) => (
                    <CaseLibellee
                      key={s.code}
                      cochee={criteres.sessions.includes(s.code)}
                      onChange={() => basculerListe("sessions", s.code)}
                      libelle={s.libelle}
                    />
                  ))}
                  {peutVoirConfidentiel && (
                    <div className="flex items-center justify-between gap-2">
                      <CaseLibellee
                        cochee={criteres.sessions.includes("CONFIDENTIEL")}
                        onChange={() => basculerListe("sessions", "CONFIDENTIEL")}
                        libelle="Confidentiel"
                      />
                      <Etiquette ton="confidentiel">habilitation</Etiquette>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible">
                    Statut
                  </span>
                  <div className="flex flex-wrap items-center gap-[7px]">
                    {STATUTS.map((s) => {
                      const actif = criteres.statuts.includes(s.code);
                      return (
                        <button
                          key={s.code}
                          type="button"
                          aria-pressed={actif}
                          onClick={() => basculerListe("statuts", s.code)}
                          className={`rounded-none border px-2.5 py-[7px] text-[11px] leading-none font-semibold transition-colors duration-150 ${
                            actif
                              ? "border-accent-trait bg-accent-voile text-accent-fonce"
                              : "border-bordure-forte text-encre-faible hover:bg-surface-douce"
                          }`}
                        >
                          {s.libelle}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[11px]">
                  <Liste
                    libelle="Structure"
                    invite="Toutes"
                    options={structures.map((s) => ({ valeur: String(s.id), libelle: s.sigle }))}
                    value={criteres.structureId}
                    onChange={(e) => modifier("structureId", e.target.value)}
                  />
                  <Liste
                    libelle="Nature"
                    invite="Toutes"
                    options={natures.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
                    value={criteres.natureId}
                    onChange={(e) => modifier("natureId", e.target.value)}
                  />
                </div>

                <div className="border-t border-separateur pt-3">
                  <Interrupteur
                    actif={criteres.inclureArchives}
                    onChange={(v) => modifier("inclureArchives", v)}
                    libelle="Inclure le fonds archivé"
                  />
                </div>

                <Bouton
                  variante="principal"
                  icone="recherche"
                  className="w-full justify-center"
                  onClick={() => setLances({ ...criteres })}
                >
                  Lancer la recherche
                </Bouton>
              </div>
            </Carte>

            <Carte titre="Recherches enregistrées">
              <div className="mt-3.5 flex flex-col gap-2">
                {enregistrees.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setCriteres(r.criteres);
                      setLances(r.criteres);
                    }}
                    className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-douce"
                  >
                    <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-semibold text-encre">
                      {r.libelle}
                    </span>
                    <span className="flex-none text-[10.5px] leading-none font-bold text-encre-tenue tabular-nums">
                      {r.nombre}
                    </span>
                  </button>
                ))}
              </div>
            </Carte>
          </div>

          <Carte
            titre={lances ? `${resultats?.total ?? 0} résultats` : "Résultats"}
            aDroite={
              <span className="text-[11px] leading-none font-medium text-encre-tenue">
                Trier : plus récents
              </span>
            }
          >
            {!lances ? (
              <p className="py-10 text-center text-[12.5px] font-medium text-encre-tenue">
                Renseignez un critère, puis lancez la recherche.
              </p>
            ) : (
              <div className="mt-3.5 overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className={`${GRILLE} border-y border-bordure bg-surface-tete py-2.5`}>
                    {["Sens", "Objet", "Correspondant", "Structure", "Statut", "Date"].map((t) => (
                      <span
                        key={t}
                        className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {isFetching && (
                    <p className="px-5 py-8 text-xs font-medium text-encre-tenue">Recherche…</p>
                  )}

                  {resultats?.lignes.map((courrier) => {
                    const statut = statutAffiche(courrier);
                    return (
                      <Link
                        key={courrier.id}
                        to={`/courriers/${courrier.id}`}
                        className={`${GRILLE} border-b border-separateur py-3 transition-colors duration-150 hover:bg-[#fbfbfc]`}
                      >
                        <span className="text-[10.5px] leading-none font-bold text-encre-tenue uppercase">
                          {courrier.sens === "ARRIVEE" ? "Arrivé" : "Départ"}
                        </span>
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="text-[10.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                            {courrier.numero}
                          </span>
                          <span className="truncate text-xs leading-none font-semibold text-encre">
                            {courrier.objet}
                          </span>
                        </span>
                        <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                          {courrier.correspondant}
                        </span>
                        <span className="truncate text-[11.5px] leading-none font-medium text-encre-faible">
                          {courrier.structuresCotees[0] ?? "—"}
                        </span>
                        <span className="justify-self-start">
                          <Etiquette ton={statut.ton}>{statut.libelle}</Etiquette>
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                          {formaterDate(courrier.dateReception)}
                        </span>
                      </Link>
                    );
                  })}

                  {resultats?.lignes.length === 0 && !isFetching && (
                    <p className="py-10 text-center text-[12.5px] font-medium text-encre-tenue">
                      Aucun courrier ne correspond à ces critères.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Carte>
        </div>
      </div>
    </>
  );
}
