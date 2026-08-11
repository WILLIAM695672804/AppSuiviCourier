import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTeteAdmin, OngletsAdmin } from "@/components/EnTeteAdmin";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { Pastilles } from "@/components/ui/Pastilles";
import {
  conformiteQuery,
  journalAccesQuery,
  journalEvenementsQuery,
  type AccesJournal,
  type EvenementJournal,
} from "@/features/tracabilite/api";

/**
 * I-01 / I-02 — traçabilite.
 *
 * Le journal est en ecriture seule : rien, dans cet ecran, ne permet de
 * modifier ou de supprimer une ligne. C'est ce qui lui donne sa valeur devant
 * un controle — un journal qu'on peut nettoyer ne prouve rien.
 *
 * Le panneau de droite montre les valeurs avant et apres. C'est la difference
 * entre « quelqu'un a modifie le delai » et « le delai est passe de 72 h a
 * 48 h le 4 aout, par A. Kouassi, au motif de la circulaire du 28 juillet ».
 */
const ONGLETS: readonly { cle: string; libelle: string }[] = [
  { cle: "evenements", libelle: "Journal des événements" },
  { cle: "acces", libelle: "Journal des accès" },
  { cle: "conformite", libelle: "Conformité archivistique" },
];

const FILTRES_EVENEMENTS = [
  "Tous",
  "Enregistrement",
  "Cotation",
  "Traitement",
  "Signature",
  "Paramétrage",
  "Habilitation",
];

const FILTRES_ACCES = ["Tous", "Session confidentielle", "Export", "Impression", "Signalé"];

const TONS_EVENEMENT: Record<string, TonEtiquette> = {
  Enregistrement: "accent",
  Cotation: "confidentiel",
  Traitement: "succes",
  Signature: "alerte",
  Paramétrage: "neutre",
  Habilitation: "danger",
};

const TONS_ACTION: Record<string, TonEtiquette> = {
  Consultation: "neutre",
  Téléchargement: "accent",
  Impression: "confidentiel",
  Export: "alerte",
  Refusé: "danger",
};

export function Tracabilite() {
  const [onglet, setOnglet] = useState("evenements");

  return (
    <>
      <EnTeteAdmin
        titre="Traçabilité"
        sousTitre="1er → 4 août 2026"
        actions={
          <Bouton variante="principal" icone="exporter">
            Exporter le journal
          </Bouton>
        }
      />

      <OngletsAdmin onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex-1">
        {onglet === "evenements" && <OngletEvenements />}
        {onglet === "acces" && <OngletAcces />}
        {onglet === "conformite" && <OngletConformite />}
      </div>
    </>
  );
}

/**
 * Conformité archivistique — §3.12, deuxième point.
 *
 * « Vérifier l'application effective du référentiel de conservation et le
 * respect des durées légales d'archivage. » L'auditeur consulte ; il ne verse
 * pas, ne valide aucune règle et ne produit aucune preuve.
 *
 * C'est la même matière que les écrans de l'archiviste, vue sous l'angle du
 * contrôle et rendue dans la charte de l'administration. Deux écrans pour un
 * objet, comme pour le référentiel des structures et les rapports d'activité :
 * l'archiviste agit, l'auditeur constate.
 */
function OngletConformite() {
  const { data } = useQuery(conformiteQuery());

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {data?.compteurs.map((compteur) => (
          <div
            key={compteur.libelle}
            className="flex flex-col gap-2 rounded-none border border-bordure bg-surface px-4 py-4"
          >
            <span className="text-[11px] leading-none font-semibold text-encre-tenue">
              {compteur.libelle}
            </span>
            <span
              className={`text-[22px] leading-none font-extrabold tabular-nums ${
                compteur.feu === "rouge"
                  ? "text-danger"
                  : compteur.feu === "orange"
                    ? "text-alerte"
                    : "text-encre"
              }`}
            >
              {compteur.valeur}
            </span>
            <span className="text-[10.5px] leading-[1.35] font-medium text-encre-tenue">
              {compteur.note}
            </span>
          </div>
        ))}
      </div>

      {(data?.typologiesSansRegle.length ?? 0) > 0 && (
        <Encart ton="danger" icone="bouclier">
          {data?.typologiesSansRegle.length} typologie
          {(data?.typologiesSansRegle.length ?? 0) > 1 ? "s" : ""} sans règle de conservation
          validée : {data?.typologiesSansRegle.join(", ")}. Les dossiers concernés sont conservés
          sans fondement opposable.
        </Encart>
      )}

      <Carte
        titre="Dossiers dont la durée légale est dépassée"
        aDroite={
          <span className="text-[11px] leading-none font-bold text-encre-tenue tabular-nums">
            {data?.echeancesDepassees.length ?? 0}
          </span>
        }
      >
        {(data?.echeancesDepassees.length ?? 0) === 0 ? (
          <p className="mt-3.5 text-[12px] font-medium text-encre-tenue">
            Aucun dossier au-delà de sa durée d'utilité administrative.
          </p>
        ) : (
          <ul className="mt-3.5 flex flex-col">
            {data?.echeancesDepassees.map((dossier, index) => (
              <li
                key={dossier.id}
                className={`flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-4 ${
                  index > 0 ? "border-t border-separateur" : ""
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
                    {dossier.objet}
                  </span>
                  <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                    {dossier.reference} · {dossier.typologie} · {dossier.structure}
                  </span>
                </span>

                <span className="flex flex-none items-center gap-3">
                  <span className="text-[11px] leading-none font-bold text-danger tabular-nums">
                    échéance {dossier.echeanceSortFinal}
                  </span>
                  <Etiquette ton="danger">{dossier.sortFinal}</Etiquette>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 border-t border-separateur pt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
          Cet onglet est en consultation seule. Le versement et la validation des règles relèvent
          du service des archives.
        </p>
      </Carte>
    </div>
  );
}

function OngletEvenements() {
  const [filtre, setFiltre] = useState("Tous");
  const [choisiId, setChoisiId] = useState<number | null>(null);

  const { data } = useQuery(journalEvenementsQuery(filtre));
  const evenements = data?.evenements ?? [];
  const choisi: EvenementJournal | undefined =
    evenements.find((e) => e.id === choisiId) ?? evenements[0];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {data?.compteurs.map((compteur) => (
          <div
            key={compteur.libelle}
            className="flex flex-col gap-2 rounded-none border border-bordure bg-surface px-4 py-4"
          >
            <span className="text-[11px] leading-none font-semibold text-encre-tenue">
              {compteur.libelle}
            </span>
            <span
              className={`text-[22px] leading-none font-extrabold tabular-nums ${
                compteur.ton === "danger"
                  ? "text-danger"
                  : compteur.ton === "alerte"
                    ? "text-alerte"
                    : "text-encre"
              }`}
            >
              {compteur.valeur}
            </span>
            <span className="text-[10.5px] leading-[1.35] font-medium text-encre-tenue">
              {compteur.note}
            </span>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
        <Carte>
          <Pastilles actif={filtre} options={FILTRES_EVENEMENTS} onChange={setFiltre} libelle="Filtrer les événements" />

          <div className="mt-3.5 overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[130px_minmax(0,1fr)_150px_170px] items-center gap-3 border-y border-bordure bg-surface-tete py-2.5">
                {["Horodatage", "Événement", "Courrier", "Auteur"].map((t) => (
                  <span
                    key={t}
                    className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {evenements.map((evenement) => (
                <button
                  key={evenement.id}
                  type="button"
                  onClick={() => setChoisiId(evenement.id)}
                  className={`grid w-full grid-cols-[130px_minmax(0,1fr)_150px_170px] items-center gap-3 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                    choisi?.id === evenement.id ? "bg-[#f5f8ff]" : "hover:bg-[#fbfbfc]"
                  }`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-xs leading-none font-semibold text-encre">
                      {evenement.heure}
                    </span>
                    <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                      {evenement.date}
                    </span>
                  </span>

                  <span className="flex min-w-0 items-center gap-2.5">
                    <Etiquette ton={TONS_EVENEMENT[evenement.type] ?? "neutre"}>
                      {evenement.type}
                    </Etiquette>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
                      {evenement.libelle}
                    </span>
                  </span>

                  <span className="text-xs leading-none font-semibold text-accent tabular-nums">
                    {evenement.courrier ?? "—"}
                  </span>

                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar initiales={evenement.initiales} taille="petit" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-xs leading-none font-semibold text-encre">
                        {evenement.auteur}
                      </span>
                      <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                        {evenement.poste}
                      </span>
                    </span>
                  </span>
                </button>
              ))}

              <div className="flex flex-wrap items-center gap-3 pt-3.5">
                <Bouton>Charger 50 événements de plus</Bouton>
                <span className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  Le journal est en écriture seule : aucun événement ne peut être modifié ni
                  supprimé, y compris par un administrateur.
                </span>
              </div>
            </div>
          </div>
        </Carte>

        {choisi && (
          <div className="rounded-none border-[1.5px] border-accent bg-surface p-[18px]">
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm leading-[1.3] font-bold text-encre">{choisi.libelle}</span>
                <span className="text-[11.5px] leading-none font-medium text-encre-tenue">
                  {choisi.date} à {choisi.heure} · {choisi.auteur}
                </span>
              </div>
              <Etiquette ton={TONS_EVENEMENT[choisi.type] ?? "neutre"}>{choisi.type}</Etiquette>
            </div>

            <dl className="mt-4 flex flex-col gap-2.5">
              {choisi.champs.map((champ) => (
                <div key={champ.libelle} className="flex items-start gap-3">
                  <dt className="w-28 flex-none text-[11px] leading-[1.4] font-semibold text-encre-tenue">
                    {champ.libelle}
                  </dt>
                  <dd className="min-w-0 flex-1 text-xs leading-[1.4] font-semibold text-encre">
                    {champ.valeur}
                  </dd>
                </div>
              ))}
            </dl>

            {choisi.differences.length > 0 && (
              <div className="mt-4 flex flex-col gap-2.5 border-t border-separateur pt-3.5">
                <span className="text-[12.5px] leading-none font-bold text-encre">
                  Valeurs modifiées
                </span>
                {choisi.differences.map((difference) => (
                  <div
                    key={difference.champ}
                    className="flex flex-col gap-2 rounded-none border border-bordure px-3 py-2.5"
                  >
                    <span className="text-[10.5px] leading-none font-semibold text-encre-tenue">
                      {difference.champ}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-none bg-danger-voile px-2.5 py-1.5 text-[11.5px] leading-[1.3] font-semibold text-danger line-through">
                        {difference.avant}
                      </span>
                      <Icone nom="chevronDroite" taille={13} className="flex-none text-encre-tenue" />
                      <span className="rounded-none bg-succes-voile px-2.5 py-1.5 text-[11.5px] leading-[1.3] font-semibold text-succes">
                        {difference.apres}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {choisi.courrierId && (
              <div className="mt-4">
                <Link to={`/courriers/${choisi.courrierId}`}>
                  <Bouton className="w-full justify-center">Ouvrir le courrier</Bouton>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OngletAcces() {
  const [filtre, setFiltre] = useState("Tous");
  const [choisiId, setChoisiId] = useState<number | null>(null);

  const { data } = useQuery(journalAccesQuery(filtre));
  const acces = data?.acces ?? [];
  const choisi: AccesJournal | undefined = acces.find((a) => a.id === choisiId) ?? acces[0];

  return (
    <div className="flex flex-col gap-3.5">
      {(data?.signales ?? 0) > 0 && (
        <Carte>
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="grid size-[34px] flex-none place-items-center rounded-none bg-danger-voile text-danger">
              <Icone nom="bouclier" taille={16} epaisseur={1.7} />
            </span>
            <div className="flex min-w-[220px] flex-1 flex-col gap-1">
              <span className="text-[12.5px] leading-none font-bold text-encre">
                {data?.signales} accès signalés sur les 7 derniers jours
              </span>
              <span className="text-[11.5px] leading-[1.4] font-medium text-encre-faible">
                Consultation hors périmètre, export massif ou accès à la session confidentielle par
                un agent non rattaché.
              </span>
            </div>
            <Bouton variante="principal" onClick={() => setFiltre("Signalé")}>
              Voir les accès signalés
            </Bouton>
          </div>
        </Carte>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
        <Carte>
          <Pastilles actif={filtre} options={FILTRES_ACCES} onChange={setFiltre} libelle="Filtrer les accès" />

          <div className="mt-3.5 overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[130px_170px_minmax(0,1fr)_130px_100px] items-center gap-3 border-y border-bordure bg-surface-tete py-2.5">
                {["Horodatage", "Agent", "Élément consulté", "Action", "Contrôle"].map((t) => (
                  <span
                    key={t}
                    className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {acces.map((ligne) => (
                <button
                  key={ligne.id}
                  type="button"
                  onClick={() => setChoisiId(ligne.id)}
                  className={`grid w-full grid-cols-[130px_170px_minmax(0,1fr)_130px_100px] items-center gap-3 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                    choisi?.id === ligne.id ? "bg-[#f5f8ff]" : "hover:bg-[#fbfbfc]"
                  }`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-xs leading-none font-semibold text-encre">{ligne.heure}</span>
                    <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                      {ligne.date}
                    </span>
                  </span>

                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar initiales={ligne.initiales} taille="petit" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-xs leading-none font-semibold text-encre">
                        {ligne.agent}
                      </span>
                      <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                        {ligne.poste}
                      </span>
                    </span>
                  </span>

                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
                      {ligne.objet}
                    </span>
                    <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                      {ligne.session}
                    </span>
                  </span>

                  <span className="justify-self-start">
                    <Etiquette ton={TONS_ACTION[ligne.action] ?? "neutre"}>{ligne.action}</Etiquette>
                  </span>

                  <span className="justify-self-start">
                    <Etiquette ton={ligne.controle === "Conforme" ? "succes" : "danger"}>
                      {ligne.controle}
                    </Etiquette>
                  </span>
                </button>
              ))}

              <div className="flex flex-wrap items-center gap-3 pt-3.5">
                <Bouton>Charger 50 accès de plus</Bouton>
                <span className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  Toute consultation d'un courrier de la session confidentielle est enregistrée
                  nominativement, y compris les tentatives refusées.
                </span>
              </div>
            </div>
          </div>
        </Carte>

        {choisi && (
          <div className="rounded-none border-[1.5px] border-accent bg-surface p-[18px]">
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm leading-[1.3] font-bold text-encre">{choisi.agent}</span>
                <span className="text-[11.5px] leading-none font-medium text-encre-tenue">
                  {choisi.date} à {choisi.heure} · {choisi.poste}
                </span>
              </div>
              <Etiquette ton={choisi.controle === "Conforme" ? "succes" : "danger"}>
                {choisi.controle}
              </Etiquette>
            </div>

            <dl className="mt-4 flex flex-col gap-2.5">
              {choisi.champs.map((champ) => (
                <div key={champ.libelle} className="flex items-start gap-3">
                  <dt className="w-28 flex-none text-[11px] leading-[1.4] font-semibold text-encre-tenue">
                    {champ.libelle}
                  </dt>
                  <dd
                    className={`min-w-0 flex-1 text-xs leading-[1.4] font-semibold ${
                      champ.alerte ? "text-danger" : "text-encre"
                    }`}
                  >
                    {champ.valeur}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4">
              <Encart ton={choisi.alerte ? "danger" : "accent"}>{choisi.motif}</Encart>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-separateur pt-3.5">
              <span className="text-[12.5px] leading-none font-bold text-encre">
                Activité de l'agent sur 7 jours
              </span>
              {choisi.activite.map((ligne) => (
                <div key={ligne.libelle} className="flex items-center gap-2.5">
                  <span className="w-28 flex-none text-[11.5px] leading-[1.3] font-medium text-encre-faible">
                    {ligne.libelle}
                  </span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-none bg-[#f2f2f0]">
                    <span
                      style={{ width: ligne.part }}
                      className={`block h-full rounded-none ${ligne.alerte ? "bg-danger-vif" : "bg-accent"}`}
                    />
                  </span>
                  <span className="flex-none text-[11.5px] leading-none font-bold text-encre-douce tabular-nums">
                    {ligne.valeur}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
