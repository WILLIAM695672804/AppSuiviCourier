import { useQuery } from "@tanstack/react-query";
import { EnTeteAdmin } from "@/components/EnTeteAdmin";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition, GrilleDefinitions } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Feu } from "@/components/ui/Feu";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import {
  integrationsQuery,
  type EtatIntegration,
  type Integration,
} from "@/features/supervision/api";
import { formaterDateHeure } from "@/lib/format";

/**
 * Authentification unique et intégrations — §3.10, deuxième point.
 *
 * « Gérer l'authentification unique (SSO) via l'annuaire d'entreprise et
 * l'intégration aux applicatifs existants (messagerie, système financier, ERP
 * en construction). »
 *
 * Le chiffre qui compte, en haut de l'écran, n'est pas le nombre de comptes
 * repris de l'annuaire — il est flatteur et ne dit rien. C'est le nombre de
 * comptes qui se connectent **encore par mot de passe applicatif**. Tant qu'il
 * en reste, le SSO n'est pas la porte d'entrée mais une porte parmi deux, la
 * politique de mot de passe de l'annuaire ne s'applique pas à tout le monde, et
 * la révocation d'un agent qui quitte l'institution ne ferme pas tous ses accès.
 *
 * C'est aussi ici qu'apparaissent les deux systèmes que le BRD exige et qui
 * n'existent pas : le progiciel de gestion, en construction, et le portail des
 * usagers, non déployé. Les afficher « non connectés » plutôt que les taire est
 * la seule façon de garder la promesse visible.
 */
const TONS_ETAT: Record<EtatIntegration, TonEtiquette> = {
  Connecté: "succes",
  Dégradé: "alerte",
  "Non connecté": "danger",
  "En construction": "neutre",
};

export function Integrations() {
  const { data, isPending } = useQuery(integrationsQuery());
  const sso = data?.sso;

  const partSso = sso
    ? Math.round((sso.connexionsSso7j / (sso.connexionsSso7j + sso.connexionsLocales7j)) * 100)
    : 0;

  const colonnes: Colonne<Integration>[] = [
    {
      cle: "systeme",
      entete: "Système",
      largeur: "minmax(200px,1.6fr)",
      role: "titre",
      rendu: (i) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {i.systeme}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {i.type} · {i.protocole}
          </span>
        </span>
      ),
    },
    {
      cle: "sync",
      entete: "Dernière synchronisation",
      largeur: "minmax(160px,1fr)",
      rendu: (i) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
            {i.derniereSynchronisation ? formaterDateHeure(i.derniereSynchronisation) : "Jamais"}
          </span>
          {i.volumeDernierPassage !== null && (
            <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
              {i.volumeDernierPassage.toLocaleString("fr-FR")} objets
            </span>
          )}
        </span>
      ),
    },
    {
      cle: "latence",
      entete: "Latence",
      largeur: "104px",
      alignement: "droite",
      role: "meta",
      rendu: (i) => (
        <span
          className={`text-[11.5px] leading-none font-semibold tabular-nums ${
            (i.latenceMs ?? 0) > 2000 ? "text-danger" : "text-encre-douce"
          }`}
        >
          {i.latenceMs === null ? "—" : `${i.latenceMs} ms`}
        </span>
      ),
    },
    {
      cle: "erreurs",
      entete: "Erreurs 24 h",
      largeur: "108px",
      alignement: "droite",
      rendu: (i) => (
        <span
          className={`text-[12px] leading-none font-bold tabular-nums ${
            i.erreurs24h > 10 ? "text-danger" : i.erreurs24h > 0 ? "text-alerte" : "text-encre-tenue"
          }`}
        >
          {i.erreurs24h === 0 ? "—" : i.erreurs24h}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "140px",
      rendu: (i) => <Etiquette ton={TONS_ETAT[i.etat]}>{i.etat}</Etiquette>,
    },
  ];

  const aSignaler = (data?.integrations ?? []).filter((i) => i.note !== null);

  return (
    <>
      <EnTeteAdmin
        titre="Authentification et intégrations"
        sousTitre="Annuaire d'entreprise, messagerie, système financier et applicatifs raccordés"
        actions={<Bouton icone="exporter">Forcer une synchronisation</Bouton>}
      />

      <div className="flex flex-col gap-3.5">
        <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

        {sso && sso.comptesLocaux > 0 && (
          <Encart ton="danger" icone="bouclier">
            {sso.comptesLocaux} comptes se connectent encore par mot de passe applicatif. Tant
            qu'ils existent, la politique de mot de passe de l'annuaire ne s'applique pas à tout le
            monde, et révoquer un agent qui quitte l'institution ne ferme pas tous ses accès.
          </Encart>
        )}

        {sso && (
          <Carte
            titre="Authentification unique"
            aDroite={
              sso.actif ? (
                <Etiquette ton="succes">Active</Etiquette>
              ) : (
                <Etiquette ton="danger">Inactive</Etiquette>
              )
            }
          >
            <GrilleDefinitions>
              <Definition libelle="Fournisseur d'identité">{sso.fournisseur}</Definition>
              <Definition libelle="Protocole">{sso.protocole}</Definition>
              <Definition libelle="Domaines couverts">{sso.domaines.join(", ")}</Definition>
              <Definition libelle="Dernier import">
                {sso.dernierImport ? formaterDateHeure(sso.dernierImport) : "Jamais"}
              </Definition>
              <Definition libelle="Comptes issus de l'annuaire">
                {sso.comptesAnnuaire.toLocaleString("fr-FR")}
              </Definition>
              <Definition libelle="Comptes locaux subsistants">
                <span className={sso.comptesLocaux > 0 ? "text-danger" : undefined}>
                  {sso.comptesLocaux}
                </span>
              </Definition>
            </GrilleDefinitions>

            <div className="mt-4 border-t border-separateur pt-4">
              <span className="text-[10.5px] leading-none font-semibold tracking-[.5px] text-encre-tenue uppercase">
                Part des connexions passant par l'annuaire, sur sept jours
              </span>
              <div className="mt-2.5">
                <BarreProgression taux={partSso} cible={100} niveau={sso.feu} />
              </div>
              <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue tabular-nums">
                {sso.connexionsSso7j.toLocaleString("fr-FR")} connexions par l'annuaire ·{" "}
                {sso.connexionsLocales7j.toLocaleString("fr-FR")} par mot de passe applicatif.
              </p>
            </div>
          </Carte>
        )}

        <Carte titre="Systèmes raccordés">
          <div className="mt-2">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={data?.integrations ?? []}
              cleLigne={(i) => i.id}
              vide="Aucun connecteur déclaré."
            />
          </div>
        </Carte>

        {aSignaler.length > 0 && (
          <Carte titre="Ce qui appelle une intervention">
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {aSignaler.map((integration) => (
                <li
                  key={integration.id}
                  className="flex flex-col gap-1.5 rounded-none border border-bordure px-3.5 py-3"
                >
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[12px] leading-none font-bold text-encre">
                      {integration.systeme}
                    </span>
                    <Feu niveau={integration.feu} muet />
                    <Etiquette ton={TONS_ETAT[integration.etat]}>{integration.etat}</Etiquette>
                  </span>
                  <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                    {integration.note}
                  </span>
                </li>
              ))}
            </ul>
          </Carte>
        )}
      </div>
    </>
  );
}
