import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Champ, Liste } from "@/components/ui/Champ";
import { Definition } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { Modale } from "@/components/ui/Modale";
import {
  PORTEES,
  ficheCompteQuery,
  profilsQuery,
  useAttribuerProfil,
  useChangerEtatCompte,
  useDefinirPerimetre,
  useModifierCompte,
  useRetirerProfil,
} from "@/features/habilitation/api";
import { messageDErreur } from "@/lib/erreurApi";
import { structuresQuery } from "@/lib/referentiel";
import { useState } from "react";

/**
 * Administrer les droits d'un agent — G-01.
 *
 * Quatre gestes, et **un seul appel chacun** : corriger les coordonnées,
 * ajouter ou retirer un profil, poser la portée, suspendre ou rétablir. Pas de
 * bouton « Enregistrer » global : chacun de ces gestes est inscrit au journal
 * séparément, et les regrouper derrière une seule validation rendrait illisible
 * la trace de ce qui a réellement changé.
 *
 * Rien n'est effacé. Le périmètre change en clôturant l'ancien et en ouvrant
 * un nouveau ; le retrait d'un profil est daté. C'est ce qui permet de
 * répondre à « quels droits avait cet agent le 12 mars ? ».
 *
 * Ce que cet écran ne fait pas : muter l'agent d'une structure à l'autre. Le
 * serveur le refuse tant que le périmètre reste borné sur l'ancienne, et poser
 * les deux ici, dans le bon ordre, sans que rien ne l'explique, produirait un
 * refus incompréhensible. La mutation attend son propre écran.
 */
export function ModaleAgent({
  utilisateurId,
  onFermer,
}: {
  utilisateurId: number | null;
  onFermer: () => void;
}) {
  const { data: fiche } = useQuery(ficheCompteQuery(utilisateurId));
  const { data: profils = [] } = useQuery({ ...profilsQuery(), enabled: utilisateurId !== null });
  const { data: structures = [] } = useQuery({
    ...structuresQuery(),
    enabled: utilisateurId !== null,
  });

  const identifiant = utilisateurId ?? 0;
  const attribuer = useAttribuerProfil(identifiant);
  const retirer = useRetirerProfil(identifiant);
  const definir = useDefinirPerimetre(identifiant);
  const changerEtat = useChangerEtatCompte(identifiant);
  const corriger = useModifierCompte(identifiant);

  const [profilAjoute, setProfilAjoute] = useState("");
  // `null` veut dire « pas encore touché » : la valeur affichée est alors celle
  // de la fiche, qui peut arriver après le premier rendu.
  const [courriel, setCourriel] = useState<string | null>(null);
  const [telephone, setTelephone] = useState<string | null>(null);
  const [portee, setPortee] = useState<string | null>(null);
  const [structurePerimetre, setStructurePerimetre] = useState<string | null>(null);

  const porteeChoisie = portee ?? fiche?.perimetre?.portee ?? "structure";
  const structureChoisie =
    structurePerimetre ?? (fiche?.perimetre?.structureId ? String(fiche.perimetre.structureId) : "");

  const refus =
    attribuer.error ?? retirer.error ?? definir.error ?? changerEtat.error ?? corriger.error ?? null;

  const courrielSaisi = courriel ?? fiche?.courriel ?? "";
  const telephoneSaisi = telephone ?? fiche?.telephone ?? "";
  const coordonneesModifiees =
    courrielSaisi !== (fiche?.courriel ?? "") || telephoneSaisi !== (fiche?.telephone ?? "");

  // Un profil déjà porté n'est pas proposé : l'attribuer une seconde fois
  // n'échoue pas — le serveur est idempotent — mais laisse croire à une action.
  const attribuables = profils.filter((p) => !fiche?.profils.some((porte) => porte.id === p.id));

  function fermer() {
    setProfilAjoute("");
    setPortee(null);
    setStructurePerimetre(null);
    setCourriel(null);
    setTelephone(null);
    attribuer.reset();
    retirer.reset();
    definir.reset();
    changerEtat.reset();
    corriger.reset();
    onFermer();
  }

  const perimetreModifie =
    porteeChoisie !== fiche?.perimetre?.portee ||
    (porteeChoisie !== "toutes" &&
      structureChoisie !== String(fiche?.perimetre?.structureId ?? ""));

  return (
    <Modale
      ouverte={utilisateurId !== null}
      onFermer={fermer}
      titre={fiche?.nomComplet ?? "Agent"}
      sousTitre={fiche ? `${fiche.poste} — ${fiche.structure}` : undefined}
      largeur={640}
      actions={<Bouton onClick={fermer}>Fermer</Bouton>}
    >
      {fiche && (
        <div className="flex flex-col gap-5">
          {refus && (
            <Encart ton="danger" icone="croix">
              {messageDErreur(refus, "L'action a été refusée.")}
            </Encart>
          )}

          {!fiche.accesLocal && (
            <Encart ton="alerte" icone="horloge">
              Ce compte n'a pas de mot de passe local : il existe, mais ne pourra pas ouvrir de
              session tant que l'annuaire n'est pas branché.
            </Encart>
          )}

          {!fiche.perimetre && (
            <Encart ton="danger" icone="bouclier">
              Cet agent n'a aucun périmètre : il se connecte et ne voit rien. Posez-en un
              ci-dessous.
            </Encart>
          )}

          <dl className="grid gap-3 md:grid-cols-2">
            <Definition libelle="Identifiant">{fiche.identifiant}</Definition>
            <Definition libelle="Matricule">{fiche.matricule ?? "—"}</Definition>
            <Definition libelle="Session courrier">{fiche.sessionCourrier ?? "Aucune"}</Definition>
            <Definition libelle="État">
              <Etiquette ton={fiche.etat === "actif" ? "succes" : "danger"}>
                {fiche.etat === "actif" ? "Actif" : "Suspendu"}
              </Etiquette>
            </Definition>
          </dl>

          {/* ---------------------------------------------------------- */}
          {/* Les coordonnées seulement, et pas le nom : le serveur accepte
              `prenom` et `nom`, mais la fiche ne rend qu'un nom complet, et le
              recouper ici produirait une correction fausse sur les noms
              composés. La structure et le poste n'y sont pas non plus — c'est
              une mutation, et elle passe par l'onglet Affectations. */}
          <section className="flex flex-col gap-2.5">
            <span className="text-[11px] leading-none font-bold tracking-[.4px] text-encre-faible uppercase">
              Coordonnées
            </span>

            <div className="grid gap-3 md:grid-cols-2">
              <Champ
                libelle="Adresse électronique"
                type="email"
                placeholder="prenom.nom@pad.cm"
                value={courrielSaisi}
                onChange={(e) => setCourriel(e.target.value)}
              />
              <Champ
                libelle="Téléphone"
                placeholder="+237 …"
                value={telephoneSaisi}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>

            <Bouton
              variante="doux"
              disabled={!coordonneesModifiees || corriger.isPending}
              onClick={() =>
                corriger.mutate(
                  {
                    ...(courrielSaisi !== (fiche.courriel ?? "")
                      ? { courriel: courrielSaisi.trim() }
                      : {}),
                    ...(telephoneSaisi !== (fiche.telephone ?? "")
                      ? { telephone: telephoneSaisi.trim() }
                      : {}),
                  },
                  {
                    onSuccess: () => {
                      setCourriel(null);
                      setTelephone(null);
                    },
                  },
                )
              }
            >
              Enregistrer les coordonnées
            </Bouton>
          </section>

          {/* ---------------------------------------------------------- */}
          <section className="flex flex-col gap-2.5">
            <span className="text-[11px] leading-none font-bold tracking-[.4px] text-encre-faible uppercase">
              Profils portés
            </span>
            <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Un agent peut en porter plusieurs. Le retrait est daté, jamais effacé.
            </p>

            <ul className="flex flex-col gap-1.5">
              {fiche.profils.map((profil) => (
                <li
                  key={profil.id}
                  className="flex items-center gap-3 rounded-none border border-bordure bg-surface-douce px-3.5 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-[12px] leading-none font-semibold text-encre">
                    {profil.libelle}
                  </span>
                  <button
                    type="button"
                    onClick={() => retirer.mutate(profil.id)}
                    disabled={retirer.isPending}
                    className="flex flex-none items-center gap-1.5 text-[11px] leading-none font-bold text-danger transition-colors duration-150 disabled:opacity-60"
                  >
                    <Icone nom="croix" taille={12} epaisseur={1.8} />
                    Retirer
                  </button>
                </li>
              ))}
              {fiche.profils.length === 0 && (
                <li className="text-[11.5px] leading-none font-medium text-encre-tenue">
                  Aucun profil : cet agent ne peut rien faire.
                </li>
              )}
            </ul>

            <div className="flex items-end gap-2">
              <Liste
                libelle="Ajouter un profil"
                invite="Choisir…"
                className="flex-1"
                value={profilAjoute}
                onChange={(e) => setProfilAjoute(e.target.value)}
                options={attribuables.map((p) => ({ valeur: String(p.id), libelle: p.libelle }))}
              />
              <Bouton
                variante="doux"
                disabled={!profilAjoute || attribuer.isPending}
                onClick={() =>
                  attribuer.mutate(Number(profilAjoute), { onSuccess: () => setProfilAjoute("") })
                }
              >
                Attribuer
              </Bouton>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          <section className="flex flex-col gap-2.5">
            <span className="text-[11px] leading-none font-bold tracking-[.4px] text-encre-faible uppercase">
              Étendue des données visibles
            </span>

            <Liste
              libelle="Portée"
              value={porteeChoisie}
              onChange={(e) => setPortee(e.target.value)}
              aide={PORTEES.find((p) => p.valeur === porteeChoisie)?.aide}
              options={PORTEES.map((p) => ({ valeur: p.valeur, libelle: p.libelle }))}
            />

            {porteeChoisie !== "toutes" && (
              <Liste
                libelle="Appuyée sur la structure"
                invite="Choisir la structure…"
                value={structureChoisie}
                onChange={(e) => setStructurePerimetre(e.target.value)}
                options={structures.map((s) => ({
                  valeur: String(s.id),
                  libelle: `${s.sigle} — ${s.libelle}`,
                }))}
              />
            )}

            <Bouton
              variante="principal"
              disabled={!perimetreModifie || definir.isPending}
              onClick={() =>
                definir.mutate(
                  {
                    portee: porteeChoisie,
                    structureId:
                      porteeChoisie === "toutes" ? null : Number(structureChoisie) || null,
                  },
                  {
                    onSuccess: () => {
                      setPortee(null);
                      setStructurePerimetre(null);
                    },
                  },
                )
              }
            >
              Poser ce périmètre
            </Bouton>
          </section>

          {/* ---------------------------------------------------------- */}
          <section className="flex flex-col gap-2.5 border-t border-separateur pt-4">
            <span className="text-[11px] leading-none font-bold tracking-[.4px] text-encre-faible uppercase">
              Accès au service
            </span>
            <p className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Un compte ne se supprime pas — cela effacerait qui a signé quoi. Suspendre ferme
              l'accès dès la requête suivante et laisse profils, périmètre et signatures en place.
            </p>
            <Bouton
              variante={fiche.etat === "actif" ? "secondaire" : "principal"}
              className={fiche.etat === "actif" ? "border-danger-trait text-danger" : ""}
              disabled={changerEtat.isPending}
              onClick={() => changerEtat.mutate(fiche.etat !== "actif")}
            >
              {fiche.etat === "actif" ? "Suspendre le compte" : "Rétablir le compte"}
            </Bouton>
          </section>
        </div>
      )}
    </Modale>
  );
}
