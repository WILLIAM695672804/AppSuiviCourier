import { useQuery } from "@tanstack/react-query";
import { EnTeteAdmin } from "@/components/EnTeteAdmin";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import {
  supervisionQuery,
  type EtatService,
  type GraviteIncident,
  type Incident,
  type PerformanceEcran,
  type ServicePlateforme,
} from "@/features/supervision/api";
import { formaterDateHeure } from "@/lib/format";

/**
 * Supervision de la plateforme — §3.10, premier point.
 *
 * « Superviser la disponibilité de la plateforme et la performance des
 * tableaux de bord. »
 *
 * L'écran ne se contente pas d'afficher des mesures : il les confronte aux
 * engagements du BRD, qui sont contractuels. Une disponibilité de 97,2 % n'est
 * pas « bonne » ou « mauvaise » dans l'absolu — elle est en deçà des 99,5 %
 * promis (RNF-DISP-01), et c'est cela qu'il faut lire.
 *
 * Même chose pour les écrans : le 95ᵉ centile est comparé aux deux secondes de
 * RNF-PERF-01, et non à une moyenne interne. Le centile plutôt que la moyenne,
 * parce qu'une moyenne de 400 ms peut cacher un agent sur vingt qui attend
 * huit secondes — et c'est celui-là qui abandonne l'outil.
 */
const TONS_ETAT: Record<EtatService, TonEtiquette> = {
  Opérationnel: "succes",
  Dégradé: "alerte",
  Interrompu: "danger",
};

const TONS_GRAVITE: Record<GraviteIncident, TonEtiquette> = {
  Majeur: "danger",
  Mineur: "alerte",
  Information: "neutre",
};

function dureeLisible(minutes: number | null): string {
  if (minutes === null) return "en cours";
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, "0")}`;
}

export function Plateforme() {
  const { data, isPending } = useQuery(supervisionQuery());

  const colonnesServices: Colonne<ServicePlateforme>[] = [
    {
      cle: "nom",
      entete: "Service",
      largeur: "minmax(200px,1.6fr)",
      role: "titre",
      rendu: (s) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {s.nom}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {s.role}
          </span>
        </span>
      ),
    },
    {
      cle: "disponibilite",
      entete: "Disponibilité 30 j",
      largeur: "136px",
      rendu: (s) => (
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <span
            className={`text-[13px] leading-none font-bold tabular-nums ${
              s.disponibilite >= (data?.cibleDisponibilite ?? 99.5) ? "text-encre" : "text-danger"
            }`}
          >
            {s.disponibilite} %
          </span>
          {s.disponibilite < (data?.cibleDisponibilite ?? 99.5) && (
            <Feu niveau="rouge" libelle="sous l'engagement" />
          )}
        </span>
      ),
    },
    {
      cle: "reponse",
      entete: "Temps de réponse",
      largeur: "128px",
      rendu: (s) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {s.tempsReponseMs} ms
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "128px",
      rendu: (s) => <Etiquette ton={TONS_ETAT[s.etat]}>{s.etat}</Etiquette>,
    },
  ];

  const colonnesPerformances: Colonne<PerformanceEcran>[] = [
    {
      cle: "ecran",
      entete: "Écran",
      largeur: "minmax(200px,1.6fr)",
      role: "titre",
      rendu: (p) => (
        <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
          {p.ecran}
        </span>
      ),
    },
    {
      cle: "appels",
      entete: "Appels 24 h",
      largeur: "112px",
      alignement: "droite",
      rendu: (p) => (
        <span className="text-[11.5px] leading-none font-medium text-encre-tenue tabular-nums">
          {p.appels24h.toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      cle: "p50",
      entete: "Médiane",
      largeur: "104px",
      alignement: "droite",
      role: "meta",
      rendu: (p) => (
        <span className="text-[11.5px] leading-none font-medium text-encre-douce tabular-nums">
          {p.p50Ms} ms
        </span>
      ),
    },
    {
      cle: "p95",
      entete: "95ᵉ centile",
      largeur: "128px",
      alignement: "droite",
      rendu: (p) => (
        <span
          className={`text-[13px] leading-none font-bold tabular-nums ${
            p.p95Ms > 2000 ? "text-danger" : "text-encre"
          }`}
        >
          {(p.p95Ms / 1000).toFixed(2).replace(".", ",")} s
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "Engagement",
      largeur: "160px",
      rendu: (p) => (
        <Feu niveau={p.feu} libelle={p.p95Ms > 2000 ? "au-delà de 2 s" : "sous 2 s"} />
      ),
    },
  ];

  const colonnesIncidents: Colonne<Incident>[] = [
    {
      cle: "resume",
      entete: "Incident",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (i) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {i.resume}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {i.service} · {formaterDateHeure(i.debut)}
          </span>
        </span>
      ),
    },
    {
      cle: "gravite",
      entete: "Gravité",
      largeur: "116px",
      rendu: (i) => <Etiquette ton={TONS_GRAVITE[i.gravite]}>{i.gravite}</Etiquette>,
    },
    {
      cle: "duree",
      entete: "Durée",
      largeur: "104px",
      rendu: (i) => (
        <span
          className={`text-[11.5px] leading-none font-bold tabular-nums ${
            i.fin === null ? "text-alerte" : "text-encre-douce"
          }`}
        >
          {dureeLisible(i.dureeMinutes)}
        </span>
      ),
    },
    {
      cle: "impact",
      entete: "Impact",
      largeur: "minmax(200px,1.6fr)",
      role: "meta",
      rendu: (i) => (
        <span className="line-clamp-2 text-[11px] leading-[1.45] font-medium text-encre-moyenne">
          {i.impact}
        </span>
      ),
    },
  ];

  const praHorsCible =
    data?.pra.dureeRepriseMinutes !== null &&
    data?.pra.dureeRepriseMinutes !== undefined &&
    data.pra.dureeRepriseMinutes > data.pra.cibleMinutes;

  return (
    <>
      <EnTeteAdmin
        titre="Supervision de la plateforme"
        sousTitre="Disponibilité, performance et incidents, au regard des engagements du programme"
        actions={<Bouton icone="exporter">Exporter le relevé</Bouton>}
      />

      <div className="flex flex-col gap-3.5">
        <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

        {praHorsCible && (
          <Encart ton="danger" icone="horloge">
            Le dernier incident majeur a été résorbé en{" "}
            {dureeLisible(data?.pra.dureeRepriseMinutes ?? null)}, au-delà des{" "}
            {dureeLisible(data?.pra.cibleMinutes ?? 240)} de l'engagement de reprise. Le plan de
            reprise d'activité n'a pas tenu sa promesse et doit être révisé.
          </Encart>
        )}

        <Carte titre="État des services">
          <div className="mt-2">
            <Tableau
                chargement={isPending}
              colonnes={colonnesServices}
              lignes={data?.services ?? []}
              cleLigne={(s) => s.nom}
              vide="Aucun service supervisé."
            />
          </div>
        </Carte>

        <Carte titre="Performance des écrans">
          <div className="mt-2">
            <Tableau
                chargement={isPending}
              colonnes={colonnesPerformances}
              lignes={data?.performances ?? []}
              cleLigne={(p) => p.ecran}
              vide="Aucune mesure disponible."
            />
          </div>
          <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            Le 95ᵉ centile et non la moyenne : une moyenne de 400 ms peut cacher un agent sur vingt
            qui attend huit secondes — et c'est celui-là qui abandonne l'outil.
          </p>
        </Carte>

        <Carte titre="Incidents des trente derniers jours">
          <div className="mt-2">
            <Tableau
                chargement={isPending}
              colonnes={colonnesIncidents}
              lignes={data?.incidents ?? []}
              cleLigne={(i) => i.id}
              vide="Aucun incident enregistré."
            />
          </div>
        </Carte>
      </div>
    </>
  );
}
