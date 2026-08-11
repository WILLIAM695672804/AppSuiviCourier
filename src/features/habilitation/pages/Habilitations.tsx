import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTeteAdmin, OngletsAdmin } from "@/components/EnTeteAdmin";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import {
  delegationsQuery,
  perimetresQuery,
  utilisateursQuery,
  profilsQuery,
  sessionsQuery,
  useBasculerPermission,
} from "@/features/habilitation/api";
import { GROUPES_PERMISSIONS } from "@/features/habilitation/libellesPermissions";
import { formaterDate } from "@/lib/format";

/**
 * G-02 / G-04 / G-05 / G-06 — habilitations.
 *
 * L'ecran le plus sensible de l'application : il decide de ce que chacun peut
 * faire. Trois partis pris s'y lisent.
 *
 * Le profil ne montre que des phrases, jamais les codes de permission.
 * Le profil administrateur est verrouille — retirer par erreur le droit
 * d'administrer fermerait l'application a tout le monde.
 * Chaque case cochee dit combien d'agents elle concerne, parce qu'un droit
 * n'est jamais accorde dans l'abstrait.
 */
const ONGLETS: readonly { cle: string; libelle: string }[] = [
  { cle: "utilisateurs", libelle: "Utilisateurs" },
  { cle: "profils", libelle: "Profils et permissions" },
  { cle: "perimetres", libelle: "Périmètres" },
  { cle: "sessions", libelle: "Sessions courrier" },
  { cle: "delegations", libelle: "Délégations" },
];

export function Habilitations() {
  const [onglet, setOnglet] = useState("utilisateurs");

  return (
    <>
      <EnTeteAdmin
        titre="Habilitations"
        actions={<Bouton icone="horloge">Journal des modifications</Bouton>}
      />

      <OngletsAdmin onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex-1">
        {onglet === "utilisateurs" && <OngletUtilisateurs />}
        {onglet === "profils" && <OngletProfils />}
        {onglet === "perimetres" && <OngletPerimetres />}
        {onglet === "sessions" && <OngletSessions />}
        {onglet === "delegations" && <OngletDelegations />}
      </div>
    </>
  );
}

function OngletProfils() {
  const { data: profils = [] } = useQuery(profilsQuery());
  const [choisiId, setChoisiId] = useState<number | null>(null);
  const choisi = profils.find((p) => p.id === choisiId) ?? profils[0];
  const basculer = useBasculerPermission(choisi?.id ?? 0);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Carte titre="Profils">
        <p className="mt-2 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
          Le profil dit ce qu'un agent peut faire. Le périmètre dit sur quoi.
        </p>
        <div className="mt-3.5 flex flex-col gap-2">
          {profils.map((profil) => (
            <button
              key={profil.id}
              type="button"
              onClick={() => setChoisiId(profil.id)}
              className={`flex items-center gap-2.5 rounded-none border px-3 py-2.5 text-left transition-colors duration-150 ${
                choisi?.id === profil.id
                  ? "border-accent-trait bg-[#f8faff]"
                  : "border-bordure hover:bg-surface-douce"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-xs leading-none font-semibold text-encre">
                {profil.libelle}
              </span>
              {profil.verrouille ? (
                <Icone nom="bouclier" taille={13} className="flex-none text-confidentiel" />
              ) : (
                <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue">
                  {profil.nombreAgents} agents
                </span>
              )}
            </button>
          ))}
        </div>
      </Carte>

      {choisi && (
        <Carte
          titre={choisi.libelle}
          aDroite={
            choisi.verrouille ? (
              <Etiquette ton="confidentiel">Verrouillé</Etiquette>
            ) : (
              <span className="text-[11px] leading-none font-medium text-encre-tenue">
                {choisi.nombreAgents} agents portent ce profil
              </span>
            )
          }
        >
          {choisi.verrouille && (
            <div className="mt-3.5">
              <Encart ton="confidentiel" icone="bouclier">
                Ce profil ne peut être modifié : sans lui, plus personne ne pourrait administrer
                l'application.
              </Encart>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-5">
            {GROUPES_PERMISSIONS.map((groupe) => (
              <fieldset key={groupe.titre} className="flex flex-col gap-2.5">
                <legend className="mb-1 text-[11px] leading-none font-bold tracking-[.4px] text-encre-faible uppercase">
                  {groupe.titre}
                </legend>
                {groupe.permissions.map((permission) => (
                  <CaseLibellee
                    key={permission.code}
                    cochee={choisi.permissions.includes(permission.code)}
                    desactivee={choisi.verrouille}
                    onChange={(accordee) =>
                      basculer.mutate({ permission: permission.code, accordee })
                    }
                    libelle={permission.libelle}
                  />
                ))}
              </fieldset>
            ))}
          </div>
        </Carte>
      )}
    </div>
  );
}

function OngletPerimetres() {
  const { data: perimetres = [] } = useQuery(perimetresQuery());
  const [choisiId, setChoisiId] = useState<number | null>(null);
  const choisi = perimetres.find((p) => p.id === choisiId);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
      <Carte titre="Périmètres">
        <div className="mt-3.5 overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[minmax(150px,1.2fr)_130px_minmax(160px,1.4fr)_90px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
              {["Périmètre", "Assise", "Étendue des données visibles", "Agents"].map((t) => (
                <span
                  key={t}
                  className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                >
                  {t}
                </span>
              ))}
            </div>

            {perimetres.map((perimetre) => (
              <button
                key={perimetre.id}
                type="button"
                onClick={() => setChoisiId(perimetre.id)}
                className={`grid w-full grid-cols-[minmax(150px,1.2fr)_130px_minmax(160px,1.4fr)_90px] items-center gap-2.5 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                  choisi?.id === perimetre.id ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
                }`}
              >
                <span className="truncate text-xs leading-none font-semibold text-encre">
                  {perimetre.libelle}
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {perimetre.assise}
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-faible">
                  {perimetre.etendue}
                </span>
                <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                  {perimetre.nombreAgents}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Carte>

      <Carte titre={choisi ? "Modifier le périmètre" : "Créer un périmètre"}>
        <div className="mt-3.5 flex flex-col gap-2.5">
          <span className="text-[11px] leading-none font-semibold text-encre-faible">
            Ce que le périmètre ouvre
          </span>
          <CaseLibellee
            cochee={choisi?.inclureDescendants ?? false}
            onChange={() => {}}
            libelle="Inclure les structures descendantes"
          />
          <CaseLibellee
            cochee={choisi?.voirConfidentiel ?? false}
            onChange={() => {}}
            libelle="Voir le courrier de la session confidentielle"
          />
          <CaseLibellee
            cochee={choisi?.lectureClotures ?? true}
            onChange={() => {}}
            libelle="Accès en lecture aux courriers clôturés"
          />
          <CaseLibellee
            cochee={choisi?.statistiquesAgregees ?? false}
            onChange={() => {}}
            libelle="Statistiques agrégées sur tout le périmètre"
          />

          <div className="mt-2 flex items-center gap-2">
            <Bouton variante="principal" className="flex-1 justify-center">
              Enregistrer
            </Bouton>
            <Bouton className="flex-1 justify-center">Dupliquer</Bouton>
          </div>
        </div>
      </Carte>
    </div>
  );
}

function OngletSessions() {
  const { data: sessions = [] } = useQuery(sessionsQuery());
  const [choisiId, setChoisiId] = useState<number | null>(null);
  const [recherche, setRecherche] = useState("");
  const choisi = sessions.find((s) => s.id === choisiId) ?? sessions[0];

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[322px_minmax(0,1fr)]">
      <Carte
        titre="Sessions ouvertes"
        aDroite={
          <button
            type="button"
            className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
          >
            Ouvrir une session
          </button>
        }
      >
        <div className="mt-3.5 flex flex-col gap-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setChoisiId(session.id)}
              className={`flex items-center gap-2.5 rounded-none border px-3 py-2.5 text-left transition-colors duration-150 ${
                choisi?.id === session.id
                  ? "border-accent-trait bg-[#f8faff]"
                  : "border-bordure hover:bg-surface-douce"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-xs leading-none font-semibold text-encre">
                {session.libelle}
              </span>
              <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                {session.courriersEnCours}
              </span>
            </button>
          ))}
        </div>
      </Carte>

      {choisi && (
        <Carte
          titre={`Agents rattachés — ${choisi.libelle}`}
          aDroite={
            <span className="text-[11px] leading-none font-medium text-encre-tenue">
              {choisi.agents.length} agents
            </span>
          }
        >
          <div className="mt-3.5 flex items-center gap-2">
            <ChampRecherche
              valeur={recherche}
              onChange={setRecherche}
              placeholder="Rechercher un agent à rattacher"
              className="flex-1"
            />
            <Bouton variante="doux" disabled={!recherche.trim()}>
              Rattacher
            </Bouton>
          </div>

          <div className="mt-3.5">
            <div className="grid grid-cols-[minmax(150px,1.4fr)_minmax(140px,1fr)_110px_80px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
              {["Agent", "Poste", "Rattaché le", ""].map((t, i) => (
                <span
                  key={i}
                  className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                >
                  {t}
                </span>
              ))}
            </div>

            {choisi.agents.map((agent) => (
              <div
                key={agent.id}
                className="grid grid-cols-[minmax(150px,1.4fr)_minmax(140px,1fr)_110px_80px] items-center gap-2.5 border-b border-separateur py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar
                    initiales={agent.nomComplet.slice(0, 2).toUpperCase()}
                    taille="petit"
                    titre={agent.nomComplet}
                  />
                  <span className="truncate text-xs leading-none font-semibold text-encre">
                    {agent.nomComplet}
                  </span>
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {agent.poste}
                </span>
                <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                  {formaterDate(agent.rattacheLe)}
                </span>
                <button
                  type="button"
                  className="justify-self-start text-[11px] leading-none font-bold text-danger hover:underline"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        </Carte>
      )}
    </div>
  );
}

function OngletDelegations() {
  const { data: delegations = [] } = useQuery(delegationsQuery());

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
      <Carte titre="Délégations et remplacements">
        <div className="mt-3.5 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[minmax(180px,1.4fr)_130px_130px_150px_100px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
              {["Titulaire → délégataire", "Poste concerné", "Étendue déléguée", "Période", "Statut"].map(
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

            {delegations.map((delegation) => (
              <div
                key={delegation.id}
                className="grid grid-cols-[minmax(180px,1.4fr)_130px_130px_150px_100px] items-center gap-2.5 border-b border-separateur py-3"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-xs leading-none font-semibold text-encre">
                  <span className="truncate">{delegation.titulaire}</span>
                  <Icone nom="chevronDroite" taille={11} className="flex-none text-encre-tenue" />
                  <span className="truncate">{delegation.delegataire}</span>
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {delegation.poste}
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-faible">
                  {delegation.etendue}
                </span>
                <span className="text-[11px] leading-none font-medium text-encre-faible">
                  {formaterDate(delegation.debut)} → {formaterDate(delegation.fin)}
                </span>
                <span className="justify-self-start">
                  <Etiquette
                    ton={
                      delegation.etat === "active"
                        ? "succes"
                        : delegation.etat === "programmee"
                          ? "accent"
                          : "neutre"
                    }
                  >
                    {delegation.etat === "active"
                      ? "Active"
                      : delegation.etat === "programmee"
                        ? "Programmée"
                        : "Close"}
                  </Etiquette>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Carte>

      <Carte titre="Créer une délégation">
        <div className="mt-3.5">
          {/* Une delegation est bornee dans le temps par construction : sans
              date de fin, elle deviendrait un transfert de responsabilite. */}
          <Encart ton="alerte" icone="horloge">
            Une délégation est toujours bornée dans le temps. À la date de fin, les permissions
            reviennent automatiquement au titulaire.
          </Encart>
        </div>
      </Carte>
    </div>
  );
}

/**
 * G-01 — utilisateurs.
 *
 * La colonne s'appelle « Profil » et non « Rôle » : dans cette application, un
 * agent porte un profil et un perimetre, jamais un role fige. La nuance n'est
 * pas de vocabulaire — c'est ce qui permet a l'administrateur de creer ses
 * propres profils sans developpement.
 */
function OngletUtilisateurs() {
  const [vue, setVue] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const { data: utilisateurs = [] } = useQuery(utilisateursQuery(vue));

  const filtres = [
    { cle: "tous", libelle: "Tous" },
    { cle: "actifs", libelle: "Actifs" },
    { cle: "suspendus", libelle: "Suspendus" },
    { cle: "invitations", libelle: "Invitations" },
  ];

  const visibles = utilisateurs.filter((u) =>
    [u.nomComplet, u.identifiant, u.structure].some((c) =>
      c.toLowerCase().includes(recherche.trim().toLowerCase()),
    ),
  );

  return (
    <Carte
      titre="Utilisateurs et profils"
      aDroite={
        <div className="flex items-center gap-2">
          <Bouton icone="exporter">Exporter l'annuaire</Bouton>
          <Bouton variante="doux" icone="personneAjout">
            Inviter un utilisateur
          </Bouton>
        </div>
      }
    >
      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        <ChampRecherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Rechercher un utilisateur, une structure…"
          className="w-[300px]"
        />
        <div className="flex items-center gap-1.5">
          {filtres.map((filtre) => (
            <button
              key={filtre.cle}
              type="button"
              aria-pressed={vue === filtre.cle}
              onClick={() => setVue(filtre.cle)}
              className={`rounded-none border px-2.5 py-[7px] text-[11px] leading-none font-semibold transition-colors duration-150 ${
                vue === filtre.cle
                  ? "border-accent-trait bg-accent-voile text-accent-fonce"
                  : "border-bordure-forte text-encre-faible hover:bg-surface-douce"
              }`}
            >
              {filtre.libelle}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3.5 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[minmax(170px,1.3fr)_minmax(190px,1.4fr)_140px_130px_100px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
            {["Utilisateur", "Identifiant", "Structure", "Profil", "Statut"].map((t) => (
              <span
                key={t}
                className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
              >
                {t}
              </span>
            ))}
          </div>

          {visibles.map((utilisateur) => (
            <div
              key={utilisateur.id}
              className="grid grid-cols-[minmax(170px,1.3fr)_minmax(190px,1.4fr)_140px_130px_100px] items-center gap-2.5 border-b border-separateur py-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Avatar initiales={utilisateur.initiales} taille="petit" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-xs leading-none font-semibold text-encre">
                    {utilisateur.nomComplet}
                  </span>
                  <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                    {utilisateur.poste}
                  </span>
                </span>
              </span>
              <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                {utilisateur.identifiant}
              </span>
              <span className="truncate text-[11.5px] leading-none font-medium text-encre-faible">
                {utilisateur.structure}
              </span>
              <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
                {utilisateur.profil}
              </span>
              <span className="justify-self-start">
                <Etiquette
                  ton={
                    utilisateur.etat === "actif"
                      ? "succes"
                      : utilisateur.etat === "suspendu"
                        ? "danger"
                        : "alerte"
                  }
                >
                  {utilisateur.etat === "actif"
                    ? "Actif"
                    : utilisateur.etat === "suspendu"
                      ? "Suspendu"
                      : "Invité"}
                </Etiquette>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Carte>
  );
}
