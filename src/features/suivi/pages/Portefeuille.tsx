import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { SqueletteTexte } from "@/components/ui/Squelette";
import { Bouton } from "@/components/ui/Bouton";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { CaseACocher, MarqueCase } from "@/components/ui/CaseACocher";
import { Etiquette } from "@/components/ui/Etiquette";
import { Onglets, type Onglet } from "@/components/ui/Onglets";
import { JaugeDelai } from "@/features/courrier/components/JaugeDelai";
import { relanceQuery, type VueRelance } from "@/features/suivi/api";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * C-02 — suivi des delais et relance.
 *
 * L'ecran du responsable, pas celui de l'agent : il regarde ce qui deborde,
 * pas ce qu'il a a faire. La relance y est une action de masse, parce qu'elle
 * se pratique par lots — on relance les quatorze retards du lundi matin, pas
 * un dossier a la fois.
 *
 * L'escalade est montree telle quelle : quand un dossier a deja ete relance
 * deux fois, le niveau superieur est saisi, et cela doit se voir avant de
 * relancer une troisieme fois pour rien.
 */
const ONGLETS: readonly Onglet<VueRelance>[] = [
  { cle: "horsDelai", libelle: "Hors délai" },
  { cle: "sous48h", libelle: "Échéance sous 48 h" },
  { cle: "sansAccuse", libelle: "Sans accusé de réception" },
  { cle: "dejaRelances", libelle: "Déjà relancés" },
  { cle: "tous", libelle: "Tous les dossiers en cours" },
];

const GRILLE =
  "grid grid-cols-[38px_minmax(220px,2fr)_110px_130px_120px_110px_90px_34px] items-center gap-2.5 px-[26px]";

const COLONNES = ["Objet", "Structure", "Agent", "Délai", "Dernière relance", "Escalade"];

export function Portefeuille() {
  const [vue, setVue] = useState<VueRelance>("horsDelai");
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const peutRelancer = usePermission(PERMISSIONS.REL);

  const { data, isPending } = useQuery(relanceQuery(vue));
  const lignes = data?.lignes ?? [];

  function basculer(id: number) {
    setSelection((precedente) => {
      const suivante = new Set(precedente);
      if (suivante.has(id)) suivante.delete(id);
      else suivante.add(id);
      return suivante;
    });
  }

  return (
    <>
      <EnTetePage
        titre="Suivi des délais et relance"
        sousTitre="Ensemble des structures · délais calculés en jours ouvrables"
        actions={
          <div className="flex items-center gap-2">
            <Bouton icone="exporter">Exporter</Bouton>
            {peutRelancer && (
              <Bouton variante="principal" icone="cloche" disabled={selection.size === 0}>
                Relancer{selection.size > 0 && ` (${selection.size})`}
              </Bouton>
            )}
          </div>
        }
      />

      {data && (
        <div className="grid flex-none grid-cols-2 divide-x divide-bordure border-b border-bordure xl:grid-cols-4">
          <CarteIndicateur
            libelle="Hors délai"
            valeur={String(data.indicateurs.horsDelai)}
            variation={{ texte: "▲ 2", ton: "danger" }}
            note={`dont ${data.indicateurs.horsDelaiGrave} au-delà de 5 jours`}
          />
          <CarteIndicateur
            libelle="Échéance sous 48 h"
            valeur={String(data.indicateurs.sous48h)}
            variation={{ texte: "à surveiller", ton: "alerte" }}
            note={`${data.indicateurs.structuresConcernees} structures concernées`}
          />
          <CarteIndicateur
            libelle="Relances envoyées ce mois"
            valeur={String(data.indicateurs.relancesMois)}
            variation={{ texte: "▲ 6", ton: "accent" }}
            note={`${data.indicateurs.escalades} escalades au niveau supérieur`}
          />
          <CarteIndicateur
            libelle="Taux de respect des délais"
            valeur={`${data.indicateurs.tauxRespect} %`}
            variation={{ texte: "▼ 12 pts", ton: "danger" }}
            note="objectif 80 %"
          />
        </div>
      )}

      <div className="flex-none">
        <Onglets
          onglets={ONGLETS}
          actif={vue}
          onChange={(v) => {
            setVue(v);
            setSelection(new Set());
          }}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[1020px]">
          <div className={`${GRILLE} sticky top-0 z-2 border-b border-bordure bg-surface-tete py-2.5`}>
            <CaseACocher
              cochee={lignes.length > 0 && selection.size === lignes.length}
              partielle={selection.size > 0 && selection.size < lignes.length}
              onChange={(cochee) =>
                setSelection(cochee ? new Set(lignes.map((l) => l.id)) : new Set())
              }
              libelle="Sélectionner tous les dossiers"
            />
            {COLONNES.map((titre) => (
              <span
                key={titre}
                className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
              >
                {titre}
              </span>
            ))}
            <span />
          </div>

          {isPending && (
            <div className="px-[26px] py-4">
              <SqueletteTexte lignes={6} />
            </div>
          )}

          {lignes.map((ligne) => (
            <div
              key={ligne.id}
              className={`${GRILLE} border-b border-separateur py-3 transition-colors duration-150 ${
                selection.has(ligne.id) ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
              }`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={selection.has(ligne.id)}
                aria-label={`Sélectionner ${ligne.numero}`}
                onClick={() => basculer(ligne.id)}
              >
                <MarqueCase cochee={selection.has(ligne.id)} />
              </button>

              <Link to={`/courriers/${ligne.id}`} className="flex min-w-0 flex-col gap-1">
                <span className="text-[10.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                  {ligne.numero}
                </span>
                <span className="truncate text-xs leading-none font-semibold text-encre">
                  {ligne.objet}
                </span>
              </Link>

              <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                {ligne.structure}
              </span>
              <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                {ligne.agent ?? "Non affecté"}
              </span>

              <JaugeDelai delai={ligne.delai} />

              <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                {ligne.derniereRelance ? formaterDate(ligne.derniereRelance) : "jamais"}
              </span>

              <span className="justify-self-start">
                {ligne.niveauEscalade > 0 ? (
                  <Etiquette ton="danger">Niveau {ligne.niveauEscalade}</Etiquette>
                ) : (
                  <span className="text-[11px] leading-none font-medium text-encre-tenue">Aucune</span>
                )}
              </span>

              <button
                type="button"
                aria-label={`Actions sur ${ligne.numero}`}
                className="justify-self-center text-sm leading-none font-bold tracking-[1px] text-encre-tenue hover:text-encre-faible"
              >
                ···
              </button>
            </div>
          ))}

          {lignes.length === 0 && !isPending && (
            <p className="px-[26px] py-16 text-center text-[12.5px] font-medium text-encre-tenue">
              Aucun dossier dans cette vue. Les délais sont tenus.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
