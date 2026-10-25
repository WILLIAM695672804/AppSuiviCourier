import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTeteAdmin, OngletsAdmin } from "@/components/EnTeteAdmin";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import {
  delegationsQuery,
  perimetresQuery,
  utilisateursQuery,
  profilsQuery,
  sessionsQuery,
  useBasculerPermission,
  useCreerProfil,
  useDetacherAgent,
  useInvaliderProfil,
  useModifierProfil,
  useRattacherAgent,
  type Profil,
} from "@/features/habilitation/api";
import { ModaleAgent } from "@/features/habilitation/components/ModaleAgent";
import { ModaleCreerCompte } from "@/features/habilitation/components/ModaleCreerCompte";
import { GROUPES_PERMISSIONS } from "@/features/habilitation/libellesPermissions";
import { messageDErreur } from "@/lib/erreurApi";
import { formaterDate } from "@/lib/format";

/**
 * G-02 / G-04 / G-05 / G-06 — habilitations.
 *
 * L'ecran le plus sensible de l'application : il decide de ce que chacun peut
 * faire. Trois partis pris s'y lisent.
 *
 * Le profil ne montre que des phrases, jamais les codes de permission.
 * **Tous les profils se modifient**, y compris ceux du referentiel livre : ils
 * decrivent l'organisation telle qu'on l'a comprise, et l'administrateur du Port
 * la connait mieux (ADR 041). Ce que le referentiel livre garde, c'est de ne pas
 * pouvoir sortir du catalogue — le semis et les migrations le citent par son code.
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

/**
 * Le catalogue des profils, et son cycle de vie complet — G-02.
 *
 * Un profil **naît vide ou copié** : le serveur n'accepte aucune permission à la
 * création. Ce n'est pas une limite mais la seule séquence qui produise une
 * trace lisible — chaque permission accordée est un événement distinct, et une
 * liste envoyée d'un bloc n'en aurait produit qu'un seul, muet sur ce qu'il
 * couvrait. Les cases se cochent donc dans le panneau de droite, après création.
 *
 * Copier depuis un profil verrouillé est l'usage prévu : c'est ce que le refus
 * de `PATCH /profils/{id}/permissions` recommande quand on tente de modifier un
 * profil système.
 */
function OngletProfils() {
  const { data: profils = [] } = useQuery(profilsQuery());
  const [choisiId, setChoisiId] = useState<number | null>(null);
  const [creationOuverte, setCreationOuverte] = useState(false);
  const [saisie, setSaisie] = useState(SAISIE_VIDE);
  const choisi = creationOuverte ? undefined : profils.find((p) => p.id === choisiId) ?? profils[0];
  const basculer = useBasculerPermission(choisi?.id ?? 0);
  const creerProfil = useCreerProfil();

  function choisirProfil(id: number) {
    setCreationOuverte(false);
    setChoisiId(id);
    creerProfil.reset();
  }

  function ouvrirCreation() {
    setCreationOuverte(true);
    setSaisie(SAISIE_VIDE);
    creerProfil.reset();
  }

  function creerNouveauProfil() {
    creerProfil.mutate(
      {
        code: saisie.code.trim().toUpperCase(),
        libelle: saisie.libelle.trim(),
        description: saisie.description.trim() === "" ? null : saisie.description.trim(),
        depuisProfilId: saisie.depuisProfilId === "" ? null : Number(saisie.depuisProfilId),
      },
      {
        onSuccess: (profil) => {
          setCreationOuverte(false);
          setChoisiId(profil.id);
          setSaisie(SAISIE_VIDE);
        },
      },
    );
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Carte
        titre="Profils"
        aDroite={
          <Bouton icone="plus" onClick={ouvrirCreation}>
            Nouveau
          </Bouton>
        }
      >
        <p className="mt-2 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
          Le profil dit ce qu'un agent peut faire. Le périmètre dit sur quoi.
        </p>
        <div className="mt-3.5 flex flex-col gap-2">
          {profils.map((profil) => (
            <button
              key={profil.id}
              type="button"
              onClick={() => choisirProfil(profil.id)}
              className={`flex items-center gap-2.5 rounded-none border px-3 py-2.5 text-left transition-colors duration-150 ${
                choisi?.id === profil.id
                  ? "border-accent-trait bg-[#f8faff]"
                  : "border-bordure hover:bg-surface-douce"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-xs leading-none font-semibold text-encre">
                {profil.libelle}
              </span>
              {/* Le bouclier ne dit plus « intouchable » mais « livré avec
                  l'application ». Le nombre d'agents s'affiche pour tous : c'est
                  la première chose à savoir avant de décocher une case. */}
              {profil.verrouille && (
                <Icone nom="bouclier" taille={13} className="flex-none text-confidentiel" />
              )}
              <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue">
                {profil.nombreAgents} agents
              </span>
            </button>
          ))}
        </div>
      </Carte>

      {creationOuverte && (
        <Carte titre="Nouveau profil">
          <div className="mt-3.5 flex flex-col gap-4">
            <Encart ton="neutre" icone="aide">
              Le profil naît sans aucune permission, ou avec celles d'un profil existant. Les cases
              se cochent ensuite, une à une, dans ce même panneau.
            </Encart>

            <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
              <Champ
                libelle="Code"
                placeholder="RESP_COURRIER"
                value={saisie.code}
                onChange={(e) => setSaisie({ ...saisie, code: e.target.value })}
                aide="Sans accent, non modifiable ensuite."
              />
              <Champ
                libelle="Libellé du profil"
                placeholder="Ex. Responsable courrier"
                value={saisie.libelle}
                onChange={(e) => setSaisie({ ...saisie, libelle: e.target.value })}
                aide="Le profil sera ensuite attribuable aux agents depuis leur fiche."
              />
            </div>

            <Champ
              libelle="Description"
              placeholder="À qui ce profil est destiné, et pourquoi."
              value={saisie.description}
              onChange={(e) => setSaisie({ ...saisie, description: e.target.value })}
            />

            <Liste
              libelle="Partir des permissions de"
              invite="Aucune — profil vide"
              aide="La copie est faite une fois ; les deux profils divergent ensuite."
              options={profils.map((p) => ({
                valeur: String(p.id),
                libelle: `${p.libelle} (${p.permissions.length} permissions)`,
              }))}
              value={saisie.depuisProfilId}
              onChange={(e) => setSaisie({ ...saisie, depuisProfilId: e.target.value })}
            />

            {creerProfil.isError && (
              <Encart ton="danger" icone="croix">
                {messageDErreur(creerProfil.error, "Le profil n'a pas pu être créé.")}
              </Encart>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-separateur pt-3.5">
              <Bouton
                variante="principal"
                className="justify-center"
                disabled={saisie.code.trim().length === 0 || saisie.libelle.trim().length === 0}
                chargement={creerProfil.isPending}
                onClick={creerNouveauProfil}
              >
                Créer le profil
              </Bouton>
              <Bouton onClick={() => setCreationOuverte(false)}>Annuler</Bouton>
            </div>
          </div>
        </Carte>
      )}

      {choisi && (
        <Carte
          titre={choisi.libelle}
          aDroite={
            <div className="flex items-center gap-2.5">
              {choisi.verrouille && <Etiquette ton="confidentiel">Référentiel livré</Etiquette>}
              <span className="text-[11px] leading-none font-medium text-encre-tenue">
                {choisi.nombreAgents} agents portent ce profil
              </span>
              <VieDuProfil key={choisi.id} profil={choisi} onInvalide={() => setChoisiId(null)} />
            </div>
          }
        >
          {choisi.verrouille && (
            <div className="mt-3.5">
              <Encart ton="confidentiel" icone="bouclier">
                Profil livré avec l'application. Ses droits se modifient comme ceux des autres ;
                il ne peut pas être retiré du catalogue, parce qu'il est cité par le paramétrage
                initial. Un droit décoché s'applique à tous les agents qui portent ce profil.
              </Encart>
            </div>
          )}

          <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
            <span className="font-bold text-encre-faible">{choisi.code}</span>
            {choisi.description ? ` — ${choisi.description}` : ""}
          </p>

          {/* Un refus du serveur doit se lire ici : la case revient d'elle-même
              à son état précédent, et sans message le clic paraîtrait n'avoir
              aucun effet. C'est le cas du dernier profil à porter le droit
              d'administrer, que le serveur protège. */}
          {basculer.isError && (
            <div className="mt-3.5">
              <Encart ton="danger" icone="croix">
                {messageDErreur(basculer.error, "Le droit n'a pas pu être modifié.")}
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

/** L'état de la création. `depuisProfilId` reste une chaîne : un `select` vide
 *  rend `""`, et le forcer en nombre ferait apparaître 0 là où rien n'est choisi. */
const SAISIE_VIDE = { code: "", libelle: "", description: "", depuisProfilId: "" };

/**
 * Renommer un profil, ou le retirer du catalogue.
 *
 * Le **code** n'est pas modifiable, et son absence de ce formulaire est
 * délibérée : il est cité par le semis, les migrations et les tests, et le
 * renommer casserait ces références sans qu'aucune erreur ne se produise avant
 * le déploiement suivant.
 *
 * Retirer n'est pas supprimer. Les agents qui ont porté le profil gardent leur
 * historique, et le journal continue de citer le profil sous lequel une décision
 * a été prise. Le serveur refuse d'ailleurs de retirer un profil encore porté :
 * l'écran le dit avant d'essayer.
 *
 * Le retrait est **le seul geste** qu'un profil du référentiel livré n'accepte
 * pas — ses droits, eux, se cochent comme ceux des autres (ADR 041).
 */
function VieDuProfil({ profil, onInvalide }: { profil: Profil; onInvalide: () => void }) {
  const modifier = useModifierProfil(profil.id);
  const invalider = useInvaliderProfil(profil.id);
  const [renommer, setRenommer] = useState(false);
  const [retirer, setRetirer] = useState(false);
  const [libelle, setLibelle] = useState(profil.libelle);
  const [description, setDescription] = useState(profil.description ?? "");
  const [motif, setMotif] = useState("");

  function fermerRenommage() {
    modifier.reset();
    setLibelle(profil.libelle);
    setDescription(profil.description ?? "");
    setRenommer(false);
  }

  function fermerRetrait() {
    invalider.reset();
    setMotif("");
    setRetirer(false);
  }

  return (
    <>
      <Bouton icone="reglages" onClick={() => setRenommer(true)}>
        Renommer
      </Bouton>
      {/* Un profil du référentiel livré ne sort pas du catalogue : le serveur le
          refuse, et proposer le bouton ferait promettre un geste impossible. */}
      {!profil.verrouille && (
        <Bouton icone="croix" className="text-danger" onClick={() => setRetirer(true)}>
          Retirer
        </Bouton>
      )}

      <ModaleFormulaire
        ouverte={renommer}
        onFermer={fermerRenommage}
        onEnvoyer={() =>
          modifier.mutate(
            {
              libelle: libelle.trim(),
              description: description.trim() === "" ? null : description.trim(),
            },
            { onSuccess: fermerRenommage },
          )
        }
        titre="Renommer le profil"
        sousTitre={`Le code ${profil.code} ne change pas : il est cité ailleurs que dans cet écran.`}
        enCours={modifier.isPending}
        erreur={modifier.error ? messageDErreur(modifier.error, "Le profil n'a pas pu être modifié.") : null}
        consequence="Les permissions accordées ne bougent pas."
      >
        <Champ
          libelle="Libellé du profil"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
        />
        <Champ
          libelle="Description"
          placeholder="À qui ce profil est destiné, et pourquoi."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </ModaleFormulaire>

      <ModaleFormulaire
        ouverte={retirer}
        onFermer={fermerRetrait}
        onEnvoyer={() =>
          invalider.mutate(
            { motif: motif.trim() },
            {
              onSuccess: () => {
                fermerRetrait();
                onInvalide();
              },
            },
          )
        }
        titre={`Retirer le profil « ${profil.libelle} »`}
        libelleEnvoi="Retirer du catalogue"
        enCours={invalider.isPending}
        erreur={
          invalider.error ? messageDErreur(invalider.error, "Le profil n'a pas pu être retiré.") : null
        }
        consequence="Le profil sort du catalogue ; l'historique des agents qui l'ont porté reste lisible."
      >
        {profil.nombreAgents > 0 && (
          <Encart ton="alerte" icone="bouclier">
            {profil.nombreAgents === 1
              ? "Un agent porte encore ce profil."
              : `${profil.nombreAgents} agents portent encore ce profil.`}{" "}
            Retirez-le-leur d'abord : un agent sans aucun profil ne peut plus rien faire.
          </Encart>
        )}
        <Champ
          libelle="Motif du retrait"
          placeholder="Profil fusionné avec…, créé par erreur…"
          aide="C'est lui qu'on relira si le profil est réclamé plus tard."
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />
      </ModaleFormulaire>
    </>
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

      <Carte titre={choisi ? choisi.libelle : "Ce qu'ouvre un périmètre"}>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {/* Ces quatre lignes sont constatees, non administrees : trois d'entre
              elles sont des PERMISSIONS des agents concernes, et la quatrieme
              n'a aucune source. Les rendre cochables ici laisserait croire
              qu'on modifie le perimetre alors qu'on toucherait aux profils. */}
          <span className="text-[11px] leading-none font-semibold text-encre-faible">
            Ce que ce périmètre ouvre, chez les agents qui le portent
          </span>
          <CaseLibellee
            cochee={choisi?.inclureDescendants ?? false}
            desactivee
            onChange={() => {}}
            libelle="Inclure les structures descendantes"
          />
          <CaseLibellee
            cochee={choisi?.voirConfidentiel ?? false}
            desactivee
            onChange={() => {}}
            libelle="Voir le courrier de la session confidentielle"
          />
          <CaseLibellee
            cochee={choisi?.lectureClotures ?? false}
            desactivee
            onChange={() => {}}
            libelle="Accès en lecture aux courriers clôturés"
          />
          <CaseLibellee
            cochee={choisi?.statistiquesAgregees ?? false}
            desactivee
            onChange={() => {}}
            libelle="Statistiques agrégées sur tout le périmètre"
          />

          <div className="mt-2">
            <Encart ton="alerte" icone="bouclier">
              Le périmètre se pose <strong>agent par agent</strong>, dans sa fiche : il n'existe pas
              de catalogue modifiable. Les quatre lignes ci-dessus sont constatées — trois sont des
              permissions portées par les profils, la quatrième n'a pas encore de source.
            </Encart>
          </div>
        </div>
      </Carte>
    </div>
  );
}

function OngletSessions() {
  const { data: sessions = [] } = useQuery(sessionsQuery());
  const { data: agents = [] } = useQuery(utilisateursQuery("actifs"));
  const [choisiId, setChoisiId] = useState<number | null>(null);
  const [recherche, setRecherche] = useState("");
  const choisi = sessions.find((s) => s.id === choisiId) ?? sessions[0];

  const rattacher = useRattacherAgent(choisi?.id ?? 0);
  const detacher = useDetacherAgent(choisi?.id ?? 0);

  // Le rattachement est exclusif : un agent n'appartient qu'a une session. Les
  // agents deja rattaches ailleurs sont donc ecartes de la recherche plutot que
  // proposes puis refuses en 409 apres la saisie.
  const rattachesAilleurs = new Set(sessions.flatMap((s) => s.agents.map((a) => a.id)));
  const candidats = recherche.trim()
    ? agents.filter(
        (a) =>
          !rattachesAilleurs.has(a.id) &&
          `${a.nomComplet} ${a.identifiant}`.toLowerCase().includes(recherche.trim().toLowerCase()),
      )
    : [];

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
          <div className="mt-3.5 flex flex-col gap-2">
            <ChampRecherche
              valeur={recherche}
              onChange={setRecherche}
              placeholder="Rechercher un agent à rattacher"
              className="flex-1"
            />

            {rattacher.isError && (
              <Encart ton="danger" icone="croix">
                {messageDErreur(rattacher.error, "Le rattachement a été refusé.")}
              </Encart>
            )}

            {candidats.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 rounded-none border border-bordure bg-surface-douce px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-[12px] leading-none font-semibold text-encre">
                  {agent.nomComplet} — {agent.structure}
                </span>
                <Bouton
                  variante="doux"
                  disabled={rattacher.isPending}
                  onClick={() =>
                    rattacher.mutate(agent.id, { onSuccess: () => setRecherche("") })
                  }
                >
                  Rattacher
                </Bouton>
              </div>
            ))}

            {recherche.trim() && candidats.length === 0 && (
              <span className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Aucun agent disponible : un agent déjà rattaché à une session ne peut pas en tenir
                une seconde.
              </span>
            )}
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
                  onClick={() => detacher.mutate(agent.id)}
                  disabled={detacher.isPending}
                  className="justify-self-start text-[11px] leading-none font-bold text-danger hover:underline disabled:opacity-60"
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
  const [creationOuverte, setCreationOuverte] = useState(false);
  const [agentOuvert, setAgentOuvert] = useState<number | null>(null);
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
          <Bouton
            variante="doux"
            icone="personneAjout"
            onClick={() => setCreationOuverte(true)}
          >
            Créer un compte
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
            <button
              key={utilisateur.id}
              type="button"
              onClick={() => setAgentOuvert(utilisateur.id)}
              className="grid w-full grid-cols-[minmax(170px,1.3fr)_minmax(190px,1.4fr)_140px_130px_100px] items-center gap-2.5 border-b border-separateur py-3 text-left transition-colors duration-150 hover:bg-[#fbfbfc]"
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
            </button>
          ))}
        </div>
      </div>

      <ModaleCreerCompte ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />
      <ModaleAgent utilisateurId={agentOuvert} onFermer={() => setAgentOuvert(null)} />
    </Carte>
  );
}
