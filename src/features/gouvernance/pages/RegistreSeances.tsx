import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Pastilles } from "@/components/ui/Pastilles";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { ModaleNouvelleSeance } from "@/features/gouvernance/components/ModalesRegistre";
import { registreSeancesQuery, type EtatDepot, type Seance } from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Registre des réunions, sessions et rapports — §3.3.
 *
 * La DSR assure le secrétariat des instances : elle prépare les dossiers de
 * séance et conserve les comptes rendus. Ce registre est donc autant un outil
 * de conservation qu'un outil de contrôle — d'où la colonne « Compte rendu »,
 * qui est la seule vraiment surveillée.
 *
 * Un procès-verbal non déposé n'est pas un détail administratif : c'est une
 * séance dont les décisions ne sont opposables à personne.
 */
const TYPES = [
  "Toutes",
  "Réunion présidée par le DG",
  "Session du Conseil d'administration",
  "CODIR",
  "Assemblée générale",
  "Rapport d'activité",
  "Rapport sectoriel",
] as const;

const TONS_DEPOT: Record<EtatDepot, TonEtiquette> = {
  Déposé: "succes",
  "En attente": "alerte",
  "Hors délai": "danger",
};

export function RegistreSeances() {
  const naviguer = useNavigate();
  const [type, setType] = useState<(typeof TYPES)[number]>("Toutes");
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const { data, isPending } = useQuery(registreSeancesQuery(type));
  const seances = data?.seances ?? [];

  const colonnes: Colonne<Seance>[] = [
    {
      cle: "intitule",
      entete: "Séance ou rapport",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (s) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {s.intitule}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {s.reference} · {s.structure}
          </span>
        </span>
      ),
    },
    {
      cle: "type",
      entete: "Nature",
      largeur: "minmax(140px,1fr)",
      rendu: (s) => (
        <span className="truncate text-[11.5px] leading-[1.3] font-semibold text-encre-douce">
          {s.type}
        </span>
      ),
    },
    {
      cle: "date",
      entete: "Tenue le",
      largeur: "108px",
      rendu: (s) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {formaterDate(s.date)}
        </span>
      ),
    },
    {
      cle: "president",
      entete: "Présidée par",
      largeur: "minmax(130px,1fr)",
      role: "meta",
      rendu: (s) => (
        <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
          {s.participants > 0 ? s.president : "—"}
        </span>
      ),
    },
    {
      cle: "depot",
      entete: "Compte rendu",
      largeur: "128px",
      rendu: (s) => (
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <Etiquette ton={TONS_DEPOT[s.depot]}>{s.depot}</Etiquette>
          <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
            {s.dateDepot ? formaterDate(s.dateDepot) : `attendu le ${formaterDate(s.echeanceDepot)}`}
          </span>
        </span>
      ),
    },
    {
      cle: "decisions",
      entete: "Décisions",
      largeur: "92px",
      alignement: "droite",
      rendu: (s) => (
        <span className="text-xs leading-none font-bold text-encre tabular-nums">
          {s.decisionsIssues === 0 ? "—" : s.decisionsIssues}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Réunions et rapports"
        compte={data?.total}
        sousTitre="Secrétariat des instances : dossiers de séance, comptes rendus et procès-verbaux"
        actions={
          <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
            Ouvrir une séance
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          <div className="rounded-none border border-bordure bg-surface px-4 pt-4 pb-2 md:px-5">
            <Pastilles options={TYPES} actif={type} onChange={setType} libelle="Filtrer par nature" />

            <div className="mt-3.5">
              <Tableau
                chargement={isPending}
                colonnes={colonnes}
                lignes={seances}
                cleLigne={(s) => s.id}
                onLigneClick={(s) => naviguer(`/gouvernance/seances/${s.id}`)}
                vide="Aucune séance ne correspond à ce filtre."
              />
            </div>
          </div>
        </div>
      </div>

      <ModaleNouvelleSeance ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} />
    </>
  );
}
