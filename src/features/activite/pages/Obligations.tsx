import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ModaleDeposerObligation } from "@/features/activite/components/ModalesActivite";
import { obligationsQuery, type Obligation } from "@/features/activite/api";
import { formaterDate } from "@/lib/format";

/**
 * Ce que ma structure doit déposer, et quand — §3.5 du descriptif fonctionnel.
 *
 * Le point focal « dépose les rapports d'activité mensuels et les procès-verbaux
 * de réunion, avec suivi du respect des délais de transmission ». Cet écran est
 * la vue débitrice du calendrier de production : ce que je dois, à quelle date.
 *
 * La DSR voit la même matière dans son registre des réunions et rapports, mais
 * sous l'angle du contrôle et sur toutes les structures. Deux écrans pour un
 * seul objet, chacun dans le vocabulaire de celui qui l'ouvre : « ce que je
 * dois déposer » d'un côté, « ce qui manque » de l'autre.
 */
const FILTRES = [
  "Toutes",
  "À déposer",
  "En retard",
  "Rapport mensuel d'activité",
  "Procès-verbal de réunion",
  "Rapport sectoriel",
] as const;

export function Obligations() {
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]>("Toutes");
  /** Obligation dont le dépôt est en cours. `null` ferme la modale. */
  const [aDeposer, setADeposer] = useState<Obligation | null>(null);

  const { data, isPending } = useQuery(obligationsQuery(filtre));
  const lignes = data?.obligations ?? [];
  const enRetard = lignes.filter((o) => !o.depose && o.retardJours !== null).length;

  const colonnes: Colonne<Obligation>[] = [
    {
      cle: "intitule",
      entete: "Document attendu",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (o) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {o.intitule}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {o.nature}
          </span>
        </span>
      ),
    },
    {
      cle: "periode",
      entete: "Période",
      largeur: "116px",
      rendu: (o) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce">
          {o.periode}
        </span>
      ),
    },
    {
      cle: "echeance",
      entete: "À déposer avant le",
      largeur: "136px",
      rendu: (o) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterDate(o.echeance)}
        </span>
      ),
    },
    {
      cle: "depot",
      entete: "Dépôt",
      largeur: "minmax(150px,1fr)",
      rendu: (o) =>
        o.depose ? (
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11.5px] leading-none font-semibold text-encre tabular-nums">
              {formaterDate(o.dateDepot)}
            </span>
            <Feu
              niveau={o.feu}
              libelle={o.retardJours === null ? "Dans les délais" : `${o.retardJours} j de retard`}
            />
          </span>
        ) : (
          <Feu
            niveau={o.feu}
            libelle={
              o.retardJours === null
                ? "Attendu, délai non échu"
                : `Non déposé, ${o.retardJours} j de retard`
            }
          />
        ),
    },
    {
      cle: "action",
      entete: "",
      largeur: "108px",
      role: "meta",
      alignement: "droite",
      rendu: (o) =>
        o.depose ? (
          <Etiquette ton="succes">Déposé</Etiquette>
        ) : (
          <Bouton variante="doux" icone="plus" onClick={() => setADeposer(o)}>
            Déposer
          </Bouton>
        ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Mes obligations de reporting"
        compte={lignes.length}
        sousTitre="Rapports mensuels, procès-verbaux et rapports sectoriels dus par ma structure"
        actions={
          <Bouton
            variante="principal"
            icone="plus"
            onClick={() => setADeposer(lignes.find((o) => !o.depose) ?? null)}
          >
            Déposer un document
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          {enRetard > 0 && (
            <Encart ton="danger" icone="horloge">
              {enRetard} document{enRetard > 1 ? "s ont" : " a"} dépassé son délai de transmission.
              Le retard est décompté dans le classement mensuel de la structure, et la DSR le voit
              depuis son registre.
            </Encart>
          )}

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <Pastilles
              options={FILTRES}
              actif={filtre}
              onChange={setFiltre}
              libelle="Filtrer les obligations"
            />

            <div className="mt-3.5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={lignes}
                cleLigne={(o) => o.id}
                vide="Aucune obligation pour ce filtre."
              />
            </div>
          </div>
        </div>
      </div>

      <ModaleDeposerObligation
        ouverte={aDeposer !== null}
        onFermer={() => setADeposer(null)}
        obligation={aDeposer}
      />
    </>
  );
}
