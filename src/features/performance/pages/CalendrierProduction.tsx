import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ModaleNouvelleProduction } from "@/features/performance/components/ModalesPerformance";
import { calendrierQuery, type LigneCalendrier } from "@/features/performance/api";

/**
 * Calendrier officiel de production — §3.3.
 *
 * « Piloter le calendrier officiel de production : qui alimente quoi, à quelle
 * fréquence, avec relances automatiques en cas de non-saisie. »
 *
 * C'est le contrat de service entre la DSR et les structures, et la pièce dont
 * dépend tout le reste : sans remontées complètes, la matrice de scoring se
 * calcule sur des trous et le classement devient une mesure du zèle déclaratif
 * plutôt que de la performance réelle. D'où la colonne de complétude, qui est
 * la vraie information de cet écran.
 *
 * La relance automatique se règle ici et nulle part ailleurs. Elle part avant
 * l'échéance, jamais après : une relance qui arrive une fois le retard
 * constaté ne sert plus qu'à le documenter.
 */
export function CalendrierProduction() {
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const { data, isPending } = useQuery(calendrierQuery());
  const lignes = data?.lignes ?? [];
  const sansRelance = lignes.filter((l) => !l.relanceAutomatique && l.recus < l.structuresAttendues);

  const colonnes: Colonne<LigneCalendrier>[] = [
    {
      cle: "production",
      entete: "Production attendue",
      largeur: "minmax(200px,1.8fr)",
      role: "titre",
      rendu: (l) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {l.production}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {l.nature} · {l.responsable}
          </span>
        </span>
      ),
    },
    {
      cle: "periodicite",
      entete: "Fréquence",
      largeur: "116px",
      rendu: (l) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce">
          {l.periodicite}
        </span>
      ),
    },
    {
      cle: "echeance",
      entete: "Échéance",
      largeur: "minmax(150px,1fr)",
      rendu: (l) => (
        <span className="text-[11.5px] leading-[1.35] font-medium text-encre-douce">
          {l.echeance}
        </span>
      ),
    },
    {
      cle: "completude",
      entete: "Dernier cycle clos",
      largeur: "minmax(140px,1fr)",
      rendu: (l) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <BarreProgression
            taux={(l.recus / l.structuresAttendues) * 100}
            niveau={l.feu}
            chiffre={false}
          />
          <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
            {l.recus} reçues sur {l.structuresAttendues}
          </span>
        </span>
      ),
    },
    {
      cle: "relance",
      entete: "Relance",
      largeur: "142px",
      rendu: (l) =>
        l.relanceAutomatique ? (
          <span className="flex min-w-0 flex-col items-start gap-1.5">
            <Etiquette ton="succes">Automatique</Etiquette>
            <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
              {l.joursAvantRelance} j avant l'échéance
            </span>
          </span>
        ) : (
          <Etiquette ton="neutre">Manuelle</Etiquette>
        ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Calendrier de production"
        compte={lignes.length}
        sousTitre="Qui alimente quoi, à quelle fréquence, et ce qui se passe en cas de non-saisie"
        actions={
          <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
            Ajouter une production
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          {sansRelance.length > 0 && (
            <Encart ton="alerte" icone="cloche">
              {sansRelance.length} production{sansRelance.length > 1 ? "s sont" : " est"} incomplète
              {sansRelance.length > 1 ? "s" : ""} sans relance automatique configurée. Le rappel
              repose alors sur la vigilance d'une personne, ce qui est le premier facteur de retard.
            </Encart>
          )}

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={lignes}
              cleLigne={(l) => l.id}
              vide="Aucune production au calendrier."
            />
          </div>

          <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            La complétude du dernier cycle conditionne la fiabilité de la matrice de scoring : une
            structure qui n'alimente pas ses registres n'est pas mal notée, elle devient non
            évaluable — ce que la grille de cotation traite comme un signalement à part entière.
          </p>
        </div>
      </div>

      <ModaleNouvelleProduction ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
