import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton, BoutonIcone } from "@/components/ui/Bouton";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { ChargementComposant } from "@/components/ui/EtatChargement";
import { Onglets, type Onglet } from "@/components/ui/Onglets";
import { Pagination } from "@/components/ui/Pagination";
import {
  adresseExportRegistre,
  indicateursQuery,
  registreQuery,
  type VueRegistre,
} from "@/features/courrier/api";
import { BarreSelection } from "@/features/courrier/components/BarreSelection";
import { ModaleCotation } from "@/features/courrier/components/ModaleCotation";
import { TableauRegistre } from "@/features/courrier/components/TableauRegistre";
import { usePermission } from "@/lib/contexteSession";
import { useValeurDifferee } from "@/lib/useValeurDifferee";
import type { SensCourrier } from "@/types/courrier";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * A-02 / A-14 — registre des courriers arrives.
 *
 * L'ecran de travail principal du service courrier. Tout y est filtre, jamais
 * navigue : changer d'onglet ne change pas d'ecran, seulement la question posee
 * au serveur.
 */
const ONGLETS: readonly Onglet<VueRegistre>[] = [
  { cle: "tous", libelle: "Tous" },
  { cle: "nonCotes", libelle: "Non cotés" },
  { cle: "affectes", libelle: "Qui m'est affecté" },
  { cle: "horsDelai", libelle: "Hors délai" },
  { cle: "urgents", libelle: "Urgents" },
  { cle: "clotures", libelle: "Clôturés" },
];

/**
 * Le meme ecran sert le registre des arrivees, la file de cotation et celle
 * des affectations : ce sont trois questions posees au meme tableau, pas trois
 * ecrans. L'agent n'a qu'une disposition a apprendre.
 */
export function RegistreCourriers({
  titre = "Courriers arrivés",
  sens = "ARRIVEE" as SensCourrier,
  vueInitiale = "tous" as VueRegistre,
}: {
  titre?: string;
  sens?: SensCourrier;
  vueInitiale?: VueRegistre;
} = {}) {
  const naviguer = useNavigate();
  const [vue, setVue] = useState<VueRegistre>(vueInitiale);
  const [saisie, setSaisie] = useState("");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Set<number>>(new Set());

  const recherche = useValeurDifferee(saisie);

  const peutEnregistrer = usePermission(PERMISSIONS.ENR);
  const peutCoter = usePermission(PERMISSIONS.COT, PERMISSIONS.COT_DEL);
  // Éditer un document est une sortie de données, et elle a sa permission : le
  // serveur refuse l'export sans `IMP` (`courrier/documents.py`). Montrer le
  // bouton à qui ne la porte pas ferait promettre un fichier refusé.
  const peutImprimer = usePermission(PERMISSIONS.IMP);

  const [cotationOuverte, setCotationOuverte] = useState(false);

  const { data, isPending, isFetching } = useQuery(registreQuery({ sens, vue, recherche, page }));
  const { data: indicateurs } = useQuery(indicateursQuery(sens));

  const lignes = data?.lignes ?? [];
  // Les lignes cochées de la page courante. La sélection ne survit pas au
  // changement d'onglet ni de page — coter en aveugle des courriers qu'on ne
  // voit plus est exactement ce qu'une action de masse ne doit pas permettre.
  const selectionnes = lignes.filter((ligne) => selection.has(ligne.id));
  const nombrePages = data ? Math.max(1, Math.ceil(data.total / data.taillePage)) : 1;

  function changerVue(nouvelle: VueRegistre) {
    setVue(nouvelle);
    setPage(1);
    setSelection(new Set());
  }

  function basculerLigne(id: number, cochee: boolean) {
    setSelection((precedente) => {
      const suivante = new Set(precedente);
      if (cochee) suivante.add(id);
      else suivante.delete(id);
      return suivante;
    });
  }

  function basculerPage(cochee: boolean) {
    setSelection(cochee ? new Set(lignes.map((c) => c.id)) : new Set());
  }

  return (
    <>
      <EnTetePage
        titre={titre}
        compte={data?.totalRegistre}
        actions={
          peutEnregistrer && (
            <Bouton variante="principal" icone="plus" onClick={() => naviguer("/courriers/nouveau")}>
              Enregistrer un courrier
            </Bouton>
          )
        }
      />

      {indicateurs && (
        <div className="grid flex-none grid-cols-4 divide-x divide-bordure border-b border-bordure">
          <CarteIndicateur
            libelle="Arrivés aujourd'hui"
            valeur={String(indicateurs.arrivesAujourdHui.valeur)}
            variation={{ texte: indicateurs.arrivesAujourdHui.variation, ton: "succes" }}
            serie={indicateurs.arrivesAujourdHui.serie}
            ton="accent"
          />
          <CarteIndicateur
            libelle="En attente de cotation"
            valeur={String(indicateurs.enAttenteCotation.valeur)}
            variation={{ texte: indicateurs.enAttenteCotation.variation, ton: "alerte" }}
            serie={indicateurs.enAttenteCotation.serie}
            ton="alerte"
          />
          <CarteIndicateur
            libelle="Délai moyen de cotation"
            valeur={indicateurs.delaiMoyenCotation.valeur}
            variation={{ texte: indicateurs.delaiMoyenCotation.variation, ton: "succes" }}
            serie={indicateurs.delaiMoyenCotation.serie}
            ton="succes"
          />
          <CarteIndicateur
            libelle="Hors délai"
            valeur={String(indicateurs.horsDelai.valeur)}
            variation={{ texte: indicateurs.horsDelai.variation, ton: "danger" }}
            serie={indicateurs.horsDelai.serie}
            ton="danger"
          />
        </div>
      )}

      <div className="flex-none">
        <Onglets onglets={ONGLETS} actif={vue} onChange={changerVue} />
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2.5 px-[26px] py-[13px]">
        <ChampRecherche
          valeur={saisie}
          onChange={(v) => {
            setSaisie(v);
            setPage(1);
          }}
          placeholder="N°, expéditeur, objet…"
          className="w-[268px]"
        />
        <BoutonIcone icone="filtre" libelle="Filtrer" />
        <BoutonIcone icone="tri" libelle="Trier" />
        <BoutonIcone icone="groupe" libelle="Grouper" />

        <div className="flex-1" />

        {/* « Numériser » menait nulle part : la numérisation se fait à
            l'enregistrement, où le fichier se rattache au courrier qu'il
            documente. Le bouton y conduit plutôt que de promettre un scanner
            que le navigateur ne pilote pas. */}
        {peutEnregistrer && (
          <Bouton icone="numeriser" onClick={() => naviguer("/courriers/nouveau")}>
            Numériser
          </Bouton>
        )}
        {peutImprimer && (
          <>
            <Bouton
              icone="exporter"
              href={adresseExportRegistre({ sens, vue, recherche }, "docx")}
            >
              Word
            </Bouton>
            <Bouton icone="exporter" href={adresseExportRegistre({ sens, vue, recherche }, "pdf")}>
              Exporter
            </Bouton>
          </>
        )}
        {peutCoter && (
          <Bouton
            variante="doux"
            icone="document"
            disabled={selection.size === 0}
            onClick={() => setCotationOuverte(true)}
          >
            Coter la sélection
          </Bouton>
        )}
      </div>

      <div className="relative flex-1 overflow-auto">
        {isPending ? (
          <ChargementComposant message="Chargement du registre…" />
        ) : (
          <>
            <TableauRegistre
              lignes={lignes}
              selection={selection}
              onSelection={basculerLigne}
              onToutSelectionner={basculerPage}
              enChargement={isFetching}
            />

            {data && lignes.length > 0 && (
              <Pagination
                page={page}
                nombrePages={nombrePages}
                onChange={(suivante) => {
                  setPage(suivante);
                  // La sélection ne suit pas la page : elle ne porte que sur ce
                  // qui est à l'écran, et une action de masse sur des lignes
                  // qu'on ne voit plus est une action à l'aveugle.
                  setSelection(new Set());
                }}
                resume={`${lignes.length} courriers affichés sur ${data.totalRegistre}`}
              />
            )}
          </>
        )}

        <BarreSelection
          nombre={selection.size}
          onAnnuler={() => setSelection(new Set())}
          onCoter={() => setCotationOuverte(true)}
        />
      </div>

      {/* La même fenêtre que la fiche, avec la sélection au lieu d'un courrier.
          Elle n'est montée que lorsqu'elle s'ouvre : elle lit l'annuaire et
          l'organigramme, deux requêtes qu'un registre ouvert toute la journée
          n'a pas à porter. */}
      {cotationOuverte && (
        <ModaleCotation
          courriers={selectionnes}
          ouverte
          onFermer={() => {
            setCotationOuverte(false);
            setSelection(new Set());
          }}
        />
      )}
    </>
  );
}
