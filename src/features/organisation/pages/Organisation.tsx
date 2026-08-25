import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { usePermission } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";
import { EnTeteAdmin, OngletsAdmin } from "@/components/EnTeteAdmin";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import {
  niveauxQuery,
  postesQuery,
  type NiveauHierarchique,
  type PosteTravail,
} from "@/features/organisation/api";
import { OngletAffectations } from "@/features/organisation/components/OngletAffectations";
import { OngletStructures } from "@/features/organisation/components/OngletStructures";
import { PanneauNiveau } from "@/features/organisation/components/PanneauNiveau";
import { PanneauPoste } from "@/features/organisation/components/PanneauPoste";

/**
 * F-01 / F-02 / F-03 / F-04 — ossature de l'institution.
 *
 * Quatre onglets, et un seul ecran : la structure est l'unite de l'organigramme,
 * le niveau dit ce qu'un etage autorise, le poste est la place dans la
 * hierarchie, l'affectation dit qui la tient. Les separer obligerait a naviguer
 * quatre fois pour pourvoir un poste qu'on vient d'ouvrir.
 *
 * Les structures ont rejoint cet ecran a l'ADR 021 : elles se creaient depuis
 * l'espace de la DSR, sous une permission a part, et l'administrateur ouvrait
 * des postes dans des structures qu'il ne pouvait pas creer.
 *
 * Les habilitations, elles, ont leur propre ecran : elles relevent d'une autre
 * permission. Un administrateur qui organise les structures n'est pas forcement
 * celui qui distribue les droits, et l'institution a tenu a ce que ces deux
 * mains soient distinctes.
 *
 * Ce que l'on cree ici n'est jamais un « role » : c'est un niveau et un poste.
 * Le code de l'application n'en connaitra que les permissions.
 */
const ONGLETS: readonly { cle: string; libelle: string }[] = [
  { cle: "structures", libelle: "Structures" },
  { cle: "niveaux", libelle: "Niveaux hiérarchiques" },
  { cle: "postes", libelle: "Postes de travail" },
  { cle: "affectations", libelle: "Affectations" },
];

export function Organisation() {
  const naviguer = useNavigate();
  // Le journal vit sous AUDIT, que l'administrateur fonctionnel ne porte pas :
  // lui montrer le bouton l'enverrait sur un refus.
  const voitLeJournal = usePermission(PERMISSIONS.AUDIT);
  const [onglet, setOnglet] = useState("structures");
  const [niveauChoisi, setNiveauChoisi] = useState<NiveauHierarchique | null>(null);
  const [posteChoisi, setPosteChoisi] = useState<PosteTravail | null>(null);

  /*
   * « Nouveau poste » désélectionne — et désélectionner ne suffisait pas.
   *
   * Le bouton n'appelait que `setPosteChoisi(null)`. Au chargement de l'onglet,
   * `posteChoisi` **vaut déjà** `null` : React ne re-rendait rien, le panneau ne
   * se réinitialisait pas, et le bouton paraissait mort. Il l'était plus encore
   * sous 1280 px, où le panneau passe sous le tableau, hors de l'écran.
   *
   * Ce compteur donne au clic un effet même quand l'état ne change pas. Il entre
   * dans la `key` du panneau : React démonte l'ancien et en monte un neuf, dont
   * la saisie repart vide. C'est ce qui remplace la réinitialisation en phase de
   * rendu que `PanneauPoste` portait — un motif qui, par construction, ne pouvait
   * pas voir deux fois la même valeur.
   */
  const [remiseAZeroPoste, setRemiseAZeroPoste] = useState(0);
  const panneauPoste = useRef<HTMLDivElement>(null);

  function nouveauPoste() {
    setPosteChoisi(null);
    setRemiseAZeroPoste((n) => n + 1);
    // Le panneau est à droite au-delà de 1280 px, en dessous du tableau sinon.
    // Sans ce défilement, le clic n'a aucun effet visible sur un portable.
    panneauPoste.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const { data: niveaux = [] } = useQuery(niveauxQuery());
  const { data: postes = [] } = useQuery(postesQuery());
  const postesParId = new Map(postes.map((poste) => [poste.id, poste]));

  return (
    <>
      <EnTeteAdmin
        titre="Organisation et profils"
        actions={
          voitLeJournal ? (
            <Bouton
              icone="horloge"
              onClick={() => naviguer("/tracabilite")}
              title="Créations et modifications de niveaux sont des événements comme les autres : elles se lisent au journal."
            >
              Journal des modifications
            </Bouton>
          ) : null
        }
      />

      <OngletsAdmin onglets={ONGLETS} actif={onglet} onChange={setOnglet} />

      <div className="flex-1">
        {onglet === "structures" ? (
          <OngletStructures />
        ) : onglet === "niveaux" ? (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
            <Carte titre="Niveaux hiérarchiques">
              <div className="mt-3.5">
                <Encart ton="neutre" icone="organisation">
                  Un niveau est un étage de l'organigramme : il dit si les postes de cet
                  étage peuvent coter, recevoir une cotation, signer et apparaître dans les
                  statistiques.
                </Encart>
              </div>

              <div className="mt-3.5 overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[60px_minmax(150px,1.4fr)_100px_120px_minmax(120px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                    {["Rang", "Libellé du niveau", "Structures", "Postes rattachés", "Cotation"].map(
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

                  {niveaux.map((niveau) => (
                    <button
                      key={niveau.id}
                      type="button"
                      onClick={() => setNiveauChoisi(niveau)}
                      className={`grid w-full grid-cols-[60px_minmax(150px,1.4fr)_100px_120px_minmax(120px,1fr)] items-center gap-2.5 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                        niveauChoisi?.id === niveau.id ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
                      }`}
                    >
                      <span className="text-[11.5px] leading-none font-bold text-encre-faible tabular-nums">
                        {niveau.rang}
                      </span>
                      <span className="truncate text-xs leading-none font-semibold text-encre">
                        {niveau.libelle}
                      </span>
                      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                        {niveau.nombreStructures}
                      </span>
                      <span className="text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                        {niveau.nombrePostes}
                      </span>
                      <span className="justify-self-start">
                        {niveau.porteSignature ? (
                          <Etiquette ton="confidentiel">Signature</Etiquette>
                        ) : niveau.peutCoter && niveau.peutRecevoirCotation ? (
                          <Etiquette ton="accent">Cote et reçoit</Etiquette>
                        ) : niveau.peutRecevoirCotation ? (
                          <Etiquette ton="neutre">Reçoit seulement</Etiquette>
                        ) : (
                          <Etiquette ton="neutre">—</Etiquette>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Carte>

            <PanneauNiveau
              choisi={niveauChoisi}
              niveaux={niveaux}
              // La selection retombe apres un enregistrement : le panneau
              // revient a « Ajouter », qui est ce qu'on fait ensuite neuf fois
              // sur dix, et la ligne modifiee se relit dans le tableau.
              onEnregistre={() => setNiveauChoisi(null)}
            />
          </div>
        ) : onglet === "postes" ? (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
            <Carte
              titre="Postes de travail"
              aDroite={
                <Bouton icone="plus" onClick={nouveauPoste}>
                  Nouveau poste
                </Bouton>
              }
            >
              <div className="mt-3.5">
                <Encart ton="neutre" icone="organisation">
                  Un poste est la place de travail dans la hiérarchie. Il appartient à une
                  structure, porte un niveau, et peut être rattaché à un poste supérieur.
                </Encart>
              </div>

              <div className="mt-3.5 overflow-x-auto">
                <div className="min-w-[880px]">
                  <div className="grid grid-cols-[minmax(180px,1.45fr)_120px_110px_minmax(170px,1.25fr)_140px_100px] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                    {[
                      "Poste de travail",
                      "Structure",
                      "Niveau",
                      "Poste supérieur",
                      "Profil par défaut",
                      "Titulaires",
                    ].map((t) => (
                      <span
                        key={t}
                        className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {postes.map((poste) => {
                    const incomplet = poste.titulaires < poste.postesPrevus;
                    const superieur = poste.posteSuperieurId
                      ? postesParId.get(poste.posteSuperieurId)
                      : null;

                    return (
                      <button
                        key={poste.id}
                        type="button"
                        onClick={() => setPosteChoisi(poste)}
                        className={`grid w-full grid-cols-[minmax(180px,1.45fr)_120px_110px_minmax(170px,1.25fr)_140px_100px] items-center gap-2.5 border-b border-separateur py-3 text-left transition-colors duration-150 ${
                          posteChoisi?.id === poste.id ? "bg-[#f8faff]" : "hover:bg-[#fbfbfc]"
                        }`}
                      >
                        <span className="truncate text-xs leading-none font-semibold text-encre">
                          {poste.libelle}
                        </span>
                        <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                          {poste.structure}
                        </span>
                        <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                          {poste.niveau}
                        </span>
                        <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                          {superieur ? `${superieur.structure} · ${superieur.libelle}` : "—"}
                        </span>
                        <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                          {poste.profilParDefaut}
                        </span>
                        {/* Un poste vacant est un trou dans le circuit : il se voit. */}
                        <span
                          className={`text-[11.5px] leading-none font-bold tabular-nums ${
                            incomplet ? "text-alerte" : "text-encre-faible"
                          }`}
                        >
                          {poste.titulaires} / {poste.postesPrevus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Carte>

            {/* `key` : elle porte la sélection **et** le compteur, de sorte que
                le panneau reparte à neuf aussi bien quand on change de poste que
                quand on redemande « Nouveau poste » sans avoir rien sélectionné. */}
            <div ref={panneauPoste}>
              <PanneauPoste
                key={`${posteChoisi?.id ?? "nouveau"}-${remiseAZeroPoste}`}
                choisi={posteChoisi}
                postes={postes}
                niveaux={niveaux}
                onEnregistre={() => setPosteChoisi(null)}
              />
            </div>
          </div>
        ) : (
          <OngletAffectations postes={postes} />
        )}
      </div>
    </>
  );
}
