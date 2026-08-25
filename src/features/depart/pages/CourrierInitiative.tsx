import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Champ, ChampLecture, Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { SelecteurCorrespondant } from "@/features/courrier/components/SelecteurCorrespondant";
import { BlocNumerisation } from "@/features/courrier/components/BlocNumerisation";
import { useSession } from "@/lib/contexteSession";
import { naturesQuery, structuresQuery, type Correspondant } from "@/lib/referentiel";

/**
 * B-06 — courrier depart a l'initiative d'une structure.
 *
 * Ecran distinct de la redaction d'une reponse, et ce n'est pas un detail :
 * un courrier qui ne repond a rien n'a pas de delai herite, pas de courrier
 * d'origine a cloturer, et personne pour en attester la necessite. D'ou le
 * motif de l'initiative, obligatoire — c'est la seule trace de la decision
 * d'ecrire.
 *
 * Le numero provisoire (BR-…) sert a suivre le brouillon dans les echanges
 * internes ; le numero definitif reste attribue a la signature.
 */
export function CourrierInitiative() {
  const naviguer = useNavigate();
  const session = useSession();

  const { data: natures = [] } = useQuery(naturesQuery());
  const { data: structures = [] } = useQuery(structuresQuery());

  const [destinataire, setDestinataire] = useState<Correspondant | null>(null);
  const [objet, setObjet] = useState("");
  const [motif, setMotif] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);

  const complet = objet.trim().length >= 5 && motif.trim().length >= 10 && destinataire;

  return (
    <>
      <EnTetePage
        titre="Courrier à l'initiative du service"
        miettes={[
          { libelle: "Courriers départ", chemin: "/courriers/departs" },
          { libelle: "Nouveau courrier" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Bouton onClick={() => naviguer("/courriers/departs")}>Enregistrer le brouillon</Bouton>
            <Bouton variante="principal" icone="chevronDroite" disabled={!complet}>
              Soumettre au visa
            </Bouton>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Carte>
              <Encart ton="alerte" icone="aide">
                Ce courrier ne répond à aucun courrier arrivé. Le motif de l'initiative est
                obligatoire et sera conservé au dossier.
              </Encart>
            </Carte>

            <Carte titre="Origine">
              <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
                <Liste
                  libelle="Structure émettrice"
                  invite="Choisir…"
                  options={structures.map((s) => ({ valeur: String(s.id), libelle: s.libelle }))}
                  aide="Poste occupé"
                />
                <ChampLecture libelle="Rédacteur" valeur={session.nomComplet} />
                <Liste
                  libelle="Nature du courrier"
                  invite="Choisir…"
                  options={natures.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
                />
              </div>

              <div className="mt-3.5 flex flex-col gap-3.5">
                <Champ
                  libelle="Objet"
                  value={objet}
                  onChange={(e) => setObjet(e.target.value)}
                  placeholder="Demande de dotation en matériel informatique"
                />

                <Etiqueteur
                  libelle="Motif de l'initiative"
                  aide="Obligatoire pour un courrier sans courrier arrivé d'origine."
                  erreur={
                    motif.length > 0 && motif.trim().length < 10
                      ? "Précisez le motif en une phrase au moins."
                      : undefined
                  }
                >
                  <textarea
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    rows={3}
                    placeholder="Renouvellement du parc informatique arrivé en fin de vie, sur instruction du comité de direction du 28 juillet."
                    className="w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
                  />
                </Etiqueteur>
              </div>
            </Carte>

            <Carte titre="Correspondant destinataire">
              <SelecteurCorrespondant choisi={destinataire} onChoisir={setDestinataire} />
            </Carte>

            {/*
              Les fichiers restent en memoire : le pilier depart n'a aucune
              route servie, et il n'y a donc rien ou les verser. Ils partiront
              par `POST /pieces` le jour ou `POST /departs` existera, comme le
              fait deja l'enregistrement d'un courrier arrive.
            */}
            <BlocNumerisation
              fichiers={fichiers}
              onAjouter={(ajoutes) => setFichiers((precedents) => [...precedents, ...ajoutes])}
              onRetirer={(index) =>
                setFichiers((precedents) => precedents.filter((_, rang) => rang !== index))
              }
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Numérotation">
              <div className="mt-3.5 flex flex-col gap-3.5">
                <ChampLecture libelle="Numéro provisoire" valeur="BR-2026-0338" />
                <ChampLecture libelle="Numéro définitif" valeur="à la signature" />
              </div>
            </Carte>

            <Carte titre="Circuit et échéance">
              <div className="mt-3.5 flex flex-col gap-3.5">
                <Liste
                  libelle="Signataire proposé"
                  invite="Choisir…"
                  options={structures
                    .filter((s) => s.responsable)
                    .map((s) => ({ valeur: String(s.id), libelle: `${s.responsable} — ${s.sigle}` }))}
                />
                <Champ libelle="Envoi souhaité avant le" type="date" />
                <Liste
                  libelle="Circuit retenu"
                  options={[
                    { valeur: "STANDARD", libelle: "Circuit standard — 2 visas" },
                    { valeur: "COURT", libelle: "Circuit court — 1 visa" },
                    { valeur: "DIRECTION", libelle: "Circuit direction — 3 visas" },
                  ]}
                />
              </div>
            </Carte>
          </div>
        </div>
      </div>
    </>
  );
}
