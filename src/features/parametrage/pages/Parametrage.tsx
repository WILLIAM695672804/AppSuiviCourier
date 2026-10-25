import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";
import { EnTeteAdmin, OngletsAdmin } from "@/components/EnTeteAdmin";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { parametrageQuery, type DonneesParametrage } from "@/features/parametrage/api";
import { OngletReglesMetier } from "@/features/parametrage/components/OngletReglesMetier";
import { useValeurDifferee } from "@/lib/useValeurDifferee";

/**
 * H-01 à H-06 — parametrage metier.
 *
 * Cinq referentiels qui evitent autant de livraisons de code. Le plus
 * important est le second : les regles de selection du circuit sont evaluees
 * dans l'ordre, la premiere qui correspond gagne, et la derniere est un repli
 * non supprimable. Sans ce repli, un courrier pourrait n'entrer dans aucun
 * circuit et rester invisible.
 */
const ONGLETS: readonly { cle: string; libelle: string }[] = [
  { cle: "circuits", libelle: "Modèles de circuit" },
  { cle: "etapes", libelle: "Étapes et escalades" },
  { cle: "regles", libelle: "Règles de sélection" },
  { cle: "mentions", libelle: "Mentions de cotation" },
  { cle: "correspondants", libelle: "Correspondants" },
  { cle: "engagements", libelle: "Délais et engagements" },
  { cle: "classement", libelle: "Plan de classement" },
  { cle: "seuils", libelle: "Seuils d'alerte" },
  { cle: "reglesMetier", libelle: "Règles de gestion" },
];

const ENTETE = "text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase";

export function Parametrage() {
  const naviguer = useNavigate();
  const voitLeJournal = usePermission(PERMISSIONS.AUDIT);
  const [onglet, setOnglet] = useState("circuits");
  const [saisie, setSaisie] = useState("");
  const recherche = useValeurDifferee(saisie).trim().toLowerCase();

  const { data } = useQuery(parametrageQuery());

  return (
    <>
      <EnTeteAdmin
        titre="Paramétrage métier"
        actions={
          // Le journal vit sous AUDIT, que l'administrateur fonctionnel ne
          // porte pas : lui montrer le bouton l'enverrait sur un refus.
          voitLeJournal ? (
            <Bouton
              icone="horloge"
              onClick={() => naviguer("/tracabilite")}
              title="Les modifications du paramétrage sont des événements comme les autres : elles se lisent au journal."
            >
              Journal des modifications
            </Bouton>
          ) : null
        }
      />

      <OngletsAdmin onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex flex-none items-center gap-2.5">
        <ChampRecherche
          valeur={saisie}
          onChange={setSaisie}
          placeholder="Rechercher un circuit, une mention, un correspondant…"
          className="w-[340px]"
        />
      </div>

      <div className="flex-1">
        {data && (
          <>
            {onglet === "circuits" && (
              <Carte
                titre="Modèles de circuit"
                aDroite={
                  <Bouton
                    variante="doux"
                    icone="plus"
                    disabled
                    title="Le trajet du courrier arrivé n'est pas paramétrable : il suit les cotations et les affectations (ADR 034). Ce référentiel reste sans emploi."
                  >
                    Créer un modèle
                  </Bouton>
                }
              >
                <div className="mt-3.5 overflow-x-auto">
                  <div className="min-w-[680px]">
                    <div className="grid grid-cols-[minmax(180px,1.4fr)_minmax(140px,1fr)_90px_100px_100px_90px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                      {[
                        "Modèle de circuit",
                        "S'applique à",
                        "Étapes",
                        "Délai cible",
                        "Usage 2026",
                        "État",
                      ].map((t) => (
                        <span key={t} className={ENTETE}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {data.circuits
                      .filter((c) => c.libelle.toLowerCase().includes(recherche))
                      .map((circuit) => (
                        <div
                          key={circuit.id}
                          className="grid grid-cols-[minmax(180px,1.4fr)_minmax(140px,1fr)_90px_100px_100px_90px] items-center gap-2.5 border-b border-separateur py-3"
                        >
                          <span className="truncate text-xs leading-none font-semibold text-encre">
                            {circuit.libelle}
                          </span>
                          <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                            {circuit.sappliqueA}
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                            {circuit.nombreEtapes}
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                            {circuit.delaiCible} j
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-faible tabular-nums">
                            {circuit.usage} fois
                          </span>
                          <span className="justify-self-start">
                            <Etiquette ton={circuit.actif ? "succes" : "neutre"}>
                              {circuit.actif ? "Actif" : "Inactif"}
                            </Etiquette>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </Carte>
            )}

            {onglet === "regles" && (
              <Carte
                titre="Règles de sélection du circuit"
                aDroite={
                  <Bouton
                    variante="doux"
                    icone="plus"
                    disabled
                    title="Le trajet du courrier arrivé n'est pas paramétrable : il suit les cotations et les affectations (ADR 034). Ce référentiel reste sans emploi."
                  >
                    Ajouter une règle
                  </Bouton>
                }
              >
                <div className="mt-2">
                  <Encart ton="accent" icone="aide">
                    Les règles sont évaluées dans l'ordre. La première qui correspond détermine le
                    circuit ; la dernière est un repli qui ne peut être supprimé.
                  </Encart>
                </div>

                <div className="mt-3.5 overflow-x-auto">
                  <div className="min-w-[680px]">
                    <div className="grid grid-cols-[70px_minmax(220px,1.6fr)_minmax(160px,1.2fr)_110px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                      {["Ordre", "Condition évaluée", "Circuit appliqué", "Déclenché"].map((t) => (
                        <span key={t} className={ENTETE}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {data.regles.map((regle) => (
                      <div
                        key={regle.id}
                        className={`grid grid-cols-[70px_minmax(220px,1.6fr)_minmax(160px,1.2fr)_110px] items-center gap-2.5 border-b border-separateur py-3 ${
                          regle.repli ? "bg-neutre-voile" : ""
                        }`}
                      >
                        <span className="text-[11.5px] leading-none font-bold text-encre-faible tabular-nums">
                          {regle.ordre}
                        </span>
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-xs leading-none font-semibold text-encre">
                            {regle.condition}
                          </span>
                          {regle.repli && (
                            <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                              Repli obligatoire, non supprimable
                            </span>
                          )}
                        </span>
                        <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                          {regle.circuit}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-faible tabular-nums">
                          {regle.declenchements} fois
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Carte>
            )}

            {onglet === "mentions" && (
              <Carte
                titre="Mentions de cotation"
                aDroite={
                  <span className="text-[11px] leading-none font-medium text-encre-tenue">
                    {data.mentions.filter((m) => m.active).length} mentions actives · proposées au
                    cotant dans cet ordre
                  </span>
                }
              >
                <div className="mt-3.5 flex flex-col gap-2">
                  {data.mentions
                    .filter((m) => m.libelle.toLowerCase().includes(recherche))
                    .map((mention) => (
                      <div
                        key={mention.id}
                        className="flex items-center gap-3 rounded-none border border-bordure px-3.5 py-3"
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                            {mention.libelle}
                          </span>
                          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                            {mention.comportement}
                            {mention.delaiAssocie && ` · délai associé ${mention.delaiAssocie} j`}
                          </span>
                        </span>
                        <span className="flex flex-none items-center gap-1.5">
                          {mention.niveauxAutorises.map((niveau) => (
                            <Etiquette key={niveau} ton="neutre">
                              {niveau}
                            </Etiquette>
                          ))}
                        </span>
                        {!mention.active && <Etiquette ton="neutre">Désactivée</Etiquette>}
                      </div>
                    ))}
                </div>
              </Carte>
            )}

            {onglet === "correspondants" && (
              <Carte
                titre="Correspondants"
                aDroite={
                  <Bouton
                    variante="doux"
                    icone="personnes"
                    disabled
                    title="La fusion de correspondants n'est pas ouverte : le signalement est un soupçon, jamais une fusion automatique."
                  >
                    Examiner les doublons
                  </Bouton>
                }
              >
                <div className="mt-3.5 overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[minmax(200px,1.6fr)_130px_130px_100px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                      {["Correspondant", "Type", "Ville", "Courriers"].map((t) => (
                        <span key={t} className={ENTETE}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {data.correspondants
                      .filter((c) => c.libelle.toLowerCase().includes(recherche))
                      .map((correspondant) => (
                        <div
                          key={correspondant.id}
                          className="grid grid-cols-[minmax(200px,1.6fr)_130px_130px_100px] items-center gap-2.5 border-b border-separateur py-3"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-xs leading-none font-semibold text-encre">
                              {correspondant.libelle}
                            </span>
                            {/* Un doublon fausse les statistiques par expediteur :
                                il se signale ici, avant de polluer le referentiel. */}
                            {correspondant.doublonPresume && (
                              <Etiquette ton="alerte">Doublon présumé</Etiquette>
                            )}
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-moyenne">
                            {correspondant.categorie}
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                            {correspondant.ville}
                          </span>
                          <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                            {correspondant.nombreCourriers}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </Carte>
            )}

            {onglet === "engagements" && (
              <Carte
                titre="Délais et engagements"
                aDroite={
                  <Bouton
                    variante="doux"
                    icone="plus"
                    disabled
                    title="Les délais se fixent à la main, à la cotation puis à l'affectation (arbitrage du Port, 26 août 2026). Aucun engagement standard n'est appliqué."
                  >
                    Ajouter un engagement
                  </Bouton>
                }
              >
                <div className="mt-3.5 overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[minmax(200px,1.6fr)_120px_130px_minmax(140px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                      {["Engagement", "Délai cible", "Première alerte", "Respect sur 90 jours"].map(
                        (t) => (
                          <span key={t} className={ENTETE}>
                            {t}
                          </span>
                        ),
                      )}
                    </div>

                    {data.engagements.map((engagement) => (
                      <div
                        key={engagement.id}
                        className="grid grid-cols-[minmax(200px,1.6fr)_120px_130px_minmax(140px,1fr)] items-center gap-2.5 border-b border-separateur py-3"
                      >
                        <span className="truncate text-xs leading-none font-semibold text-encre">
                          {engagement.libelle}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                          {engagement.delaiCible} j
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-faible tabular-nums">
                          à {engagement.premiereAlerte} j
                        </span>
                        <span className="flex items-center gap-2.5">
                          <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-none bg-inerte">
                            <span
                              style={{ width: `${engagement.respect90j}%` }}
                              className={`block h-full rounded-none ${
                                engagement.respect90j >= 80
                                  ? "bg-succes-vif"
                                  : engagement.respect90j >= 60
                                    ? "bg-alerte-vif"
                                    : "bg-danger-vif"
                              }`}
                            />
                          </span>
                          <span className="w-9 flex-none text-right text-[11.5px] leading-none font-bold text-encre-faible tabular-nums">
                            {engagement.respect90j} %
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Carte>
            )}

            {onglet === "etapes" && <OngletEtapes data={data} />}
            {onglet === "classement" && <OngletClassement data={data} recherche={recherche} />}
            {onglet === "seuils" && <OngletSeuils data={data} />}
            {onglet === "reglesMetier" && (
              <OngletReglesMetier regles={data.reglesMetier} recherche={recherche} />
            )}
          </>
        )}
      </div>
    </>
  );
}

/**
 * Étapes d'un circuit, avec leur délai et leur règle d'escalade.
 *
 * Le BRD demande une modélisation « en notation BPMN 2.0 » (RF-BPM-01). Ce
 * n'est pas ce qu'on trouve ici, et l'écran le dit : les étapes forment une
 * liste ordonnée, pas un diagramme. Un modeleur graphique suppose une
 * bibliothèque de plusieurs centaines de kilo-octets et des branchements
 * parallèles que le circuit du courrier n'emploie pas.
 *
 * Ce que RF-BPM-03 exige y est en entier : un délai par étape, une alerte
 * avant échéance, et une escalade au dépassement.
 */
function OngletEtapes({ data }: { data: DonneesParametrage }) {
  const circuit = data.circuits[0];

  return (
    <Carte titre={`Étapes du circuit « ${circuit?.libelle ?? "—"} »`}>
      <Encart ton="alerte" icone="aide">
        Les étapes se règlent ici sous forme de liste ordonnée, non de diagramme BPMN. Le délai par
        étape, l'alerte avant échéance et l'escalade au dépassement — ce qu'exige RF-BPM-03 — sont
        paramétrables. Le modeleur graphique de RF-BPM-01 reste à construire, et suppose des
        branchements parallèles que ce circuit n'emploie pas.
      </Encart>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[52px_minmax(0,1.6fr)_minmax(0,1.2fr)_92px_minmax(0,1.2fr)_104px] items-center gap-3 border-y border-bordure bg-surface-tete py-2.5">
            {["Rang", "Étape", "Acteur", "Délai", "À l'échéance", "Blocage"].map((t) => (
              <span key={t} className={ENTETE}>
                {t}
              </span>
            ))}
          </div>

          {data.etapes.map((etape) => (
            <div
              key={etape.id}
              className="grid grid-cols-[52px_minmax(0,1.6fr)_minmax(0,1.2fr)_92px_minmax(0,1.2fr)_104px] items-center gap-3 border-b border-separateur py-3"
            >
              <span className="grid size-6 place-items-center rounded-none bg-surface-douce text-[11px] font-bold text-encre-douce tabular-nums">
                {etape.rang}
              </span>
              <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                {etape.libelle}
              </span>
              <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                {etape.acteur}
              </span>
              <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
                {etape.delaiJours} j
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={`truncate text-[11.5px] leading-none font-semibold ${
                    etape.escalade === "Aucune" ? "text-encre-tenue" : "text-encre-douce"
                  }`}
                >
                  {etape.escalade}
                </span>
                {etape.alerteAvant !== null && (
                  <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
                    alerte {etape.alerteAvant} j avant
                  </span>
                )}
              </span>
              {etape.bloquante ? (
                <Etiquette ton="accent">Bloquante</Etiquette>
              ) : (
                <Etiquette ton="neutre">Contournable</Etiquette>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
        Une étape contournable peut être sautée en circuit accéléré, pour les dossiers marqués
        urgents (RF-BPM-10). Une étape bloquante ne l'est jamais.
      </p>
    </Carte>
  );
}

/**
 * Plan de classement — RF-GED-07.
 *
 * À ne pas confondre avec le référentiel de conservation : celui-ci range les
 * documents, celui-là dit combien de temps on les garde. Les typologies
 * associées sont le pont entre les deux — c'est par elles qu'une rubrique
 * hérite d'une durée d'utilité administrative.
 */
function OngletClassement({ data, recherche }: { data: DonneesParametrage; recherche: string }) {
  const rubriques = data.classement.filter(
    (r) => !recherche || `${r.code} ${r.libelle}`.toLowerCase().includes(recherche),
  );

  return (
    <Carte
      titre="Plan de classement"
      aDroite={
        <Bouton
          variante="principal"
          icone="plus"
          disabled
          title="Ce référentiel attend son contenu : ni le plan de classement ni les seuils du Port n'ont été communiqués (question ouverte A24)."
        >
          Ajouter une rubrique
        </Bouton>
      }
    >
      <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
        L'arborescence range les documents ; le référentiel de conservation dit combien de temps on
        les garde. Les typologies associées font le pont entre les deux.
      </p>

      <div className="mt-3.5">
        <div className="grid grid-cols-[92px_minmax(0,2fr)_minmax(0,1.4fr)_104px] items-center gap-3 border-y border-bordure bg-surface-tete py-2.5">
          {["Code", "Rubrique", "Typologies associées", "Documents"].map((t) => (
            <span key={t} className={ENTETE}>
              {t}
            </span>
          ))}
        </div>

        {rubriques.map((rubrique) => (
          <div
            key={rubrique.id}
            className="grid grid-cols-[92px_minmax(0,2fr)_minmax(0,1.4fr)_104px] items-center gap-3 border-b border-separateur py-2.5"
          >
            <span className="text-[11.5px] leading-none font-bold text-accent tabular-nums">
              {rubrique.code}
            </span>
            <span
              className={`truncate leading-none ${
                rubrique.niveau === 0
                  ? "text-[12.5px] font-bold text-encre"
                  : "text-[12px] font-medium text-encre-douce"
              }`}
              style={{ paddingLeft: rubrique.niveau * 18 }}
            >
              {rubrique.libelle}
            </span>
            <span className="truncate text-[11px] leading-none font-medium text-encre-tenue">
              {rubrique.typologiesAssociees.length === 0
                ? "—"
                : rubrique.typologiesAssociees.join(", ")}
            </span>
            <span className="text-right text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
              {rubrique.documents.toLocaleString("fr-FR")}
            </span>
          </div>
        ))}
      </div>
    </Carte>
  );
}

/**
 * Seuils d'alerte — RF-BI-05.
 *
 * Chaque seuil porte un destinataire, et c'est le champ qui compte. Sans lui,
 * une alerte n'est qu'une couleur à l'écran : personne n'est prévenu, et le
 * dépassement se découvre au comité de direction du mois suivant.
 */
function OngletSeuils({ data }: { data: DonneesParametrage }) {
  const inactifs = data.seuils.filter((s) => !s.actif).length;

  return (
    <Carte
      titre="Seuils d'alerte"
      aDroite={
        <Bouton
          variante="principal"
          icone="plus"
          disabled
          title="Ce référentiel attend son contenu : ni le plan de classement ni les seuils du Port n'ont été communiqués (question ouverte A24)."
        >
          Ajouter un seuil
        </Bouton>
      }
    >
      {inactifs > 0 && (
        <div className="mt-3">
          <Encart ton="alerte" icone="cloche">
            {inactifs} seuil
            {inactifs > 1 ? "s sont désactivés" : " est désactivé"} : le dépassement est mesuré mais
            n'avertit personne.
          </Encart>
        </div>
      )}

      <div className="mt-3.5 overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[minmax(0,1.6fr)_120px_128px_minmax(0,1.6fr)_128px_92px] items-center gap-3 border-y border-bordure bg-surface-tete py-2.5">
            {[
              "Indicateur surveillé",
              "Périmètre",
              "Déclenche si",
              "Destinataire",
              "Canal",
              "30 jours",
            ].map((t) => (
              <span key={t} className={ENTETE}>
                {t}
              </span>
            ))}
          </div>

          {data.seuils.map((seuil) => (
            <div
              key={seuil.id}
              className={`grid grid-cols-[minmax(0,1.6fr)_120px_128px_minmax(0,1.6fr)_128px_92px] items-center gap-3 border-b border-separateur py-3 ${
                seuil.actif ? "" : "opacity-55"
              }`}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                  {seuil.indicateur}
                </span>
                {!seuil.actif && (
                  <span className="text-[10px] leading-none font-bold text-danger uppercase">
                    désactivé
                  </span>
                )}
              </span>
              <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                {seuil.perimetre}
              </span>
              <span className="text-[11.5px] leading-none font-bold text-encre tabular-nums">
                {seuil.operateur} {seuil.valeur} {seuil.unite}
              </span>
              <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                {seuil.destinataire}
              </span>
              <span className="truncate text-[11px] leading-none font-medium text-encre-tenue">
                {seuil.canal}
              </span>
              <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
                {seuil.declenchements30j === 0 ? "—" : `${seuil.declenchements30j} fois`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
        Le destinataire est le champ qui compte : sans lui, une alerte n'est qu'une couleur à
        l'écran, et le dépassement se découvre au comité de direction du mois suivant.
      </p>
    </Carte>
  );
}
