import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Onglets } from "@/components/ui/Onglets";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import { fileImportQuery, type MessageIntercepte, type EtatImport } from "@/features/courrier/api";
import { formaterDateHeure } from "@/lib/format";

/**
 * Import de masse — §3.6, premier point.
 *
 * « Capturer le courrier entrant, sortant et interne par numérisation de
 * masse, dépôt manuel, import par lot ou interception d'e-mails. »
 *
 * Le dépôt manuel a son écran depuis longtemps (l'enregistrement unitaire).
 * Restaient les deux voies de masse, réunies ici parce qu'elles posent le même
 * problème : des courriers arrivent en nombre, et il faut les qualifier avant
 * qu'ils n'entrent au registre.
 *
 * C'est le point important. Ni l'un ni l'autre n'enregistre directement : les
 * pièces atterrissent dans une **file d'attente** où l'agent contrôle avant de
 * valider. Un import qui créerait des courriers sans contrôle remplirait le
 * registre de doublons et de messages sans objet, et le registre perdrait la
 * seule qualité qu'on lui demande — être exact.
 */
const ONGLETS = [
  { cle: "lot", libelle: "Import par lot" },
  { cle: "messagerie", libelle: "Boîte fonctionnelle" },
] as const;

const TONS_ETAT: Record<EtatImport, TonEtiquette> = {
  "À qualifier": "accent",
  Qualifié: "succes",
  Doublon: "alerte",
  Écarté: "danger",
};

export function ImportCourriers() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["cle"]>("lot");
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);

  const { data } = useQuery(fileImportQuery());

  const colonnes: Colonne<MessageIntercepte>[] = [
    {
      cle: "objet",
      entete: "Message",
      largeur: "minmax(220px,2fr)",
      role: "titre",
      rendu: (m) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {m.objet}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {m.expediteur} · {formaterDateHeure(m.recuLe)}
          </span>
        </span>
      ),
    },
    {
      cle: "pieces",
      entete: "Pièces",
      largeur: "96px",
      alignement: "droite",
      rendu: (m) => (
        <span className="text-[11.5px] leading-none font-semibold text-encre-douce tabular-nums">
          {m.pieces === 0 ? "aucune" : m.pieces}
        </span>
      ),
    },
    {
      cle: "nature",
      entete: "Nature proposée",
      largeur: "minmax(140px,1fr)",
      rendu: (m) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
            {m.naturePresumee ?? "Non déterminée"}
          </span>
          {m.confiance !== null && (
            <span
              className={`text-[10px] leading-none font-medium tabular-nums ${
                m.confiance < 60 ? "text-alerte" : "text-encre-tenue"
              }`}
            >
              confiance {m.confiance} %
            </span>
          )}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      largeur: "124px",
      rendu: (m) => (
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <Etiquette ton={TONS_ETAT[m.etat]}>{m.etat}</Etiquette>
          {m.motif && (
            <span className="text-[10px] leading-[1.35] font-medium text-encre-tenue">
              {m.motif}
            </span>
          )}
        </span>
      ),
    },
    {
      cle: "action",
      entete: "",
      largeur: "128px",
      role: "meta",
      alignement: "droite",
      rendu: (m) =>
        m.etat === "À qualifier" ? (
          <Bouton variante="doux" icone="coche">
            Qualifier
          </Bouton>
        ) : (
          <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
            {m.traitePar ?? "—"}
          </span>
        ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Import de courriers"
        sousTitre="Lot de fichiers numérisés et messages captés sur la boîte fonctionnelle"
        miettes={[{ libelle: "Courriers", chemin: "/courriers" }, { libelle: "Import" }]}
      />

      <Onglets onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        {onglet === "lot" ? (
          <div className="mx-auto flex max-w-[760px] flex-col gap-3.5">
            <Encart ton="accent" icone="numeriser">
              Le lot n'entre pas au registre directement. Les fichiers déposés rejoignent la file
              de qualification, où chaque pièce reçoit son numéro et ses métadonnées avant
              enregistrement.
            </Encart>

            <Carte titre="Déposer un lot">
              <div className="mt-4 flex flex-col gap-4">
                <ZoneDepot
                  libelle="Fichiers numérisés"
                  accepte=".pdf,.tif,.tiff,.jpg,.jpeg,.png"
                  fichiers={fichiers}
                  onChange={setFichiers}
                  aide="Un fichier par courrier. Les documents multipages sont acceptés."
                />

                <div className="flex flex-wrap items-center gap-3 border-t border-separateur pt-4">
                  <Bouton
                    variante="principal"
                    icone="exporter"
                    disabled={fichiers.length === 0}
                  >
                    Envoyer {fichiers.length > 0 ? `${fichiers.length} fichier(s)` : "le lot"} à la
                    qualification
                  </Bouton>
                  <span className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                    La reconnaissance de caractères s'applique à l'arrivée et propose une nature
                    et un correspondant, que l'agent confirme ou corrige.
                  </span>
                </div>
              </div>
            </Carte>

            <Carte titre="Ce que l'import ne fait pas">
              <ul className="mt-3.5 flex flex-col gap-2">
                {[
                  "Il n'attribue pas de numéro : la séquence est réservée à l'enregistrement validé.",
                  "Il ne cote pas : l'orientation reste une décision, jamais une déduction.",
                  "Il ne clôt aucun doublon de lui-même — il le signale, l'agent tranche.",
                ].map((ligne) => (
                  <li key={ligne} className="flex gap-2.5">
                    <span className="mt-[7px] size-1 flex-none rounded-none bg-encre-tenue" />
                    <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                      {ligne}
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <BandeauCompteurs compteurs={data?.compteurs ?? []} />

            <Carte
              titre="Boîte fonctionnelle"
              aDroite={
                <span className="flex items-center gap-2.5">
                  <Avatar initiales="BF" taille="petit" />
                  <span className="text-[11.5px] leading-none font-semibold text-encre-douce">
                    {data?.boite ?? "—"}
                  </span>
                </span>
              }
            >
              <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
                Les messages reçus sur cette adresse sont captés automatiquement et déposés ici.
                Dernier relevé : {data?.dernierReleve ? formaterDateHeure(data.dernierReleve) : "—"}.
              </p>

              <div className="mt-3.5">
                <Tableau
                  colonnes={colonnes}
                  lignes={data?.messages ?? []}
                  cleLigne={(m) => m.id}
                  vide="Aucun message en attente de qualification."
                />
              </div>
            </Carte>

            <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Un message dont la nature est proposée avec moins de 60 % de confiance ne peut pas
              être qualifié automatiquement — c'est l'exigence RF-IA-04 du document de référence :
              en deçà du seuil, la validation humaine est obligatoire.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
