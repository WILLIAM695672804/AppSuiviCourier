import { useRef, useState } from "react";
import { useForm, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Champ, ChampLecture, Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart, LigneControle } from "@/components/ui/Encart";
import { Interrupteur } from "@/components/ui/Interrupteur";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { contexteEnregistrementQuery, useEnregistrer } from "@/features/courrier/api";
import { BlocNumerisation } from "@/features/courrier/components/BlocNumerisation";
import { ModaleCorrespondant } from "@/features/courrier/components/ModaleCorrespondant";
import { SelecteurCorrespondant } from "@/features/courrier/components/SelecteurCorrespondant";
import { deposerPiece } from "@/features/pieces/api";
import {
  schemaEnregistrement,
  VALEURS_INITIALES,
  type SaisieEnregistrement,
} from "@/features/courrier/schemaEnregistrement";
import { formaterDateHeure } from "@/lib/format";
import { naturesQuery, structuresQuery, type Correspondant } from "@/lib/referentiel";

/**
 * A-01 — enregistrement d'un courrier arrive.
 *
 * L'ecran le plus utilise de l'application : un agent y passe plusieurs
 * dizaines de fois par jour. Deux consequences tenues ici — le numero et
 * l'horodatage viennent du serveur (jamais du poste, dont l'horloge derive),
 * et l'agent peut enchainer sur la cotation sans changer d'ecran.
 */
const TYPES_SESSION = [
  { valeur: "ARRIVE", libelle: "Arrivé" },
  { valeur: "INTERNE", libelle: "Interne" },
  { valeur: "CONFIDENTIEL", libelle: "Confidentiel" },
] as const;

const DELAIS = [
  { valeur: "3", libelle: "3 j" },
  { valeur: "5", libelle: "5 j" },
  { valeur: "10", libelle: "10 j" },
] as const;

/**
 * Verse les documents numerises sur le courrier qui vient d'etre cree.
 *
 * **Un par un, et non en parallele.** Le serveur lit chaque fichier pour en
 * calculer l'empreinte (RF-GED-09) ; cinq scans de vingt megaoctets envoyes
 * ensemble depuis un poste du service courrier saturent la liaison avant de
 * saturer le serveur.
 *
 * Un echec ne fait pas echouer l'enregistrement : le courrier est au registre,
 * il a son numero, et l'agent redepose depuis la fiche. Perdre la saisie parce
 * qu'un fichier depasse le plafond serait la punir deux fois.
 */
async function deposerNumerisation(courrierId: number, fichiers: File[]): Promise<number> {
  let echecs = 0;
  for (const fichier of fichiers) {
    try {
      await deposerPiece("courrier", courrierId, { fichier, categorie: "original" });
    } catch {
      echecs += 1;
    }
  }
  return echecs;
}

/**
 * Nom lisible de chaque champ, pour dire a l'agent *ce qui* manque.
 *
 * `errors` de react-hook-form porte les noms du schema (`correspondantId`) ;
 * l'agent, lui, connait le libelle de l'ecran. Sans cette table, le refus se
 * lit « correspondantId » — c'est-a-dire ne se lit pas.
 */
const LIBELLES: Record<string, string> = {
  typeSession: "la session d'enregistrement",
  natureId: "la nature du courrier",
  correspondantId: "l'expéditeur",
  referenceExpediteur: "la référence de l'expéditeur",
  dateLettre: "la date de la lettre",
  nombrePages: "le nombre de pages",
  objet: "l'objet",
  delaiJours: "le délai imparti",
};

function enumerer(elements: string[]): string {
  if (elements.length <= 1) return elements[0] ?? "";
  return `${elements.slice(0, -1).join(", ")} et ${elements[elements.length - 1]}`;
}

export function EnregistrementCourrier() {
  const naviguer = useNavigate();
  const [correspondant, setCorrespondant] = useState<Correspondant | null>(null);
  const [fichiers, setFichiers] = useState<File[]>([]);
  // Pourquoi un refus en etat plutot qu'un simple `errors` : le bouton est
  // dans l'en-tete fixe, les erreurs de champ sont dans la zone qui defile.
  // Sans ce bandeau, cliquer « Enregistrer » sur une saisie incomplete ne
  // produit **rien de visible** — l'agent conclut que le bouton est mort.
  const [refus, setRefus] = useState<string | null>(null);
  // La recherche infructueuse de l'agent sert d'amorce a la creation : il a
  // deja tape le nom une fois, le lui faire retaper serait une punition.
  const [rechercheExpediteur, setRechercheExpediteur] = useState("");
  const [creationOuverte, setCreationOuverte] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  const { data: contexte } = useQuery(contexteEnregistrementQuery());
  const { data: natures = [] } = useQuery(naturesQuery());
  const { data: structures = [] } = useQuery(structuresQuery());
  const enregistrer = useEnregistrer();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SaisieEnregistrement>({
    resolver: standardSchemaResolver(schemaEnregistrement),
    defaultValues: VALEURS_INITIALES,
  });

  // `useWatch` plutot que `watch` : le compilateur React sait le memoiser.
  const typeSession = useWatch({ control, name: "typeSession" });
  const coterMaintenant = useWatch({ control, name: "coterMaintenant" });
  const delaiJours = useWatch({ control, name: "delaiJours" });

  /** Retient l'expediteur — depuis la liste de recherche comme depuis la creation. */
  function retenirCorrespondant(choisi: Correspondant | null) {
    setCorrespondant(choisi);
    setValue("correspondantId", choisi?.id ?? 0, { shouldValidate: true });
  }

  /**
   * Refus de validation : dit lesquels, et ramene la vue sur eux.
   *
   * `shouldFocusError` de react-hook-form ne suffit pas ici — `correspondantId`
   * est pose par `setValue` depuis le selecteur d'expediteur, sans `ref`, donc
   * sans champ a focaliser. C'est justement le champ le plus souvent oublie.
   */
  function refuser(erreurs: FieldErrors<SaisieEnregistrement>) {
    const manquants = Object.keys(erreurs).map((champ) => LIBELLES[champ] ?? champ);
    setRefus(
      manquants.length > 0
        ? `Enregistrement impossible : vérifiez ${enumerer(manquants)}.`
        : "Enregistrement impossible : la saisie est incomplète.",
    );
    zone.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function soumettre(valeurs: SaisieEnregistrement) {
    setRefus(null);

    // `mutateAsync` rejette quand le serveur refuse. Sans ce filet, la promesse
    // remonte non traitee jusqu'a la console, et l'ecran ne bouge pas : le
    // bandeau ci-dessous lit `enregistrer.error` et le montre a sa place.
    let courrier;
    try {
      courrier = await enregistrer.mutateAsync(valeurs);
    } catch {
      zone.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Les pieces se deposent **apres** l'enregistrement : `POST /pieces` exige
    // l'objet auquel il rattache, et le courrier n'a pas d'identifiant avant sa
    // ligne. L'echec du depot ne perd pas l'enregistrement — le courrier est au
    // registre, la fiche dira quelles pieces manquent.
    const echecs = await deposerNumerisation(courrier.id, fichiers);

    const suite = new URLSearchParams();
    if (valeurs.coterMaintenant) suite.set("coter", "1");
    if (valeurs.coterMaintenant && valeurs.structureDestinataireId) {
      suite.set("structure", String(valeurs.structureDestinataireId));
    }
    if (echecs > 0) suite.set("piecesEnEchec", String(echecs));

    const parametres = suite.toString();
    naviguer(`/courriers/${courrier.id}${parametres ? `?${parametres}` : ""}`);
  }

  return (
    <form
      // Filet : n'accepter que l'envoi de ce formulaire-ci, pas d'un envoi
      // remonte d'ailleurs. `Modale` passe par un portail depuis, donc plus
      // aucun formulaire n'est imbrique ici — mais l'ecran est un `<form>` qui
      // couvre tout, et la prochaine saisie posee dedans ne le saura pas.
      onSubmit={(evenement) => {
        if (evenement.target !== evenement.currentTarget) return;
        void handleSubmit(soumettre, refuser)(evenement);
      }}
      className="contents"
    >
      <EnTetePage
        titre="Enregistrer un courrier arrivé"
        miettes={[
          { libelle: "Registre des arrivées", chemin: "/courriers" },
          { libelle: "Nouvel enregistrement" },
        ]}
        mention={contexte && `N° attribué : ${contexte.numeroPrevu}`}
        actions={
          <div className="flex items-center gap-2">
            <Bouton onClick={() => naviguer("/courriers")}>Annuler</Bouton>
            <Bouton
              type="submit"
              onClick={() => setValue("coterMaintenant", false)}
              disabled={enregistrer.isPending}
            >
              Enregistrer
            </Bouton>
            <Bouton
              variante="principal"
              icone="chevronDroite"
              type="submit"
              onClick={() => setValue("coterMaintenant", true)}
              disabled={enregistrer.isPending}
            >
              Enregistrer et coter
            </Bouton>
          </div>
        }
      />

      <div ref={zone} className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        {(refus || enregistrer.isError) && (
          <div className="mb-4">
            <Encart ton="danger" icone="aide">
              {enregistrer.isError
                ? enregistrer.error instanceof Error
                  ? enregistrer.error.message
                  : "L'enregistrement a échoué."
                : refus}
            </Encart>
          </div>
        )}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <BlocNumerisation
              fichiers={fichiers}
              onAjouter={(ajoutes) => setFichiers((precedents) => [...precedents, ...ajoutes])}
              onRetirer={(index) =>
                setFichiers((precedents) => precedents.filter((_, rang) => rang !== index))
              }
            />

            <Carte titre="Session et identification">
              <div className="mt-3.5 flex flex-col gap-[7px]">
                <span className="text-[11px] leading-none font-semibold text-encre-faible">
                  Session d'enregistrement
                </span>
                <Controller
                  control={control}
                  name="typeSession"
                  render={({ field }) => (
                    <SelecteurSegments
                      libelle="Session d'enregistrement"
                      options={TYPES_SESSION}
                      valeur={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {typeSession === "CONFIDENTIEL" && (
                  <div className="mt-1">
                    <Encart ton="confidentiel" icone="bouclier">
                      Ce courrier n'apparaîtra pas dans les restitutions destinées à la DSR et son
                      objet reste masqué hors du circuit désigné.
                    </Encart>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
                <ChampLecture
                  libelle="N° d'enregistrement"
                  valeur={
                    contexte
                      ? `${contexte.numeroPrevu} · séquence automatique`
                      : "Attribué par le serveur"
                  }
                />
                <ChampLecture
                  libelle="Date et heure d'arrivée"
                  valeur={contexte ? formaterDateHeure(contexte.dateArrivee) : "—"}
                />
                <Liste
                  libelle="Nature du courrier"
                  invite="Choisir…"
                  options={natures.map((n) => ({ valeur: String(n.id), libelle: n.libelle }))}
                  erreur={errors.natureId?.message}
                  {...register("natureId", {
                    onChange: (e) => {
                      // La nature porte le delai d'usage : on le propose sans l'imposer.
                      const nature = natures.find((n) => String(n.id) === e.target.value);
                      if (nature?.delaiParDefaut) setValue("delaiJours", nature.delaiParDefaut);
                    },
                  })}
                />
                <Champ
                  libelle="Référence de l'expéditeur"
                  placeholder="n° 0871/CR/2026"
                  erreur={errors.referenceExpediteur?.message}
                  {...register("referenceExpediteur")}
                />
                <Champ
                  libelle="Date de la lettre"
                  type="date"
                  erreur={errors.dateLettre?.message}
                  {...register("dateLettre")}
                />
                <Champ
                  libelle="Nombre de pages"
                  type="number"
                  min={1}
                  erreur={errors.nombrePages?.message}
                  {...register("nombrePages")}
                />
              </div>

              <div className="mt-3.5">
                <Champ
                  libelle="Objet"
                  placeholder="Demande d'audience pour le projet de voirie communale"
                  erreur={errors.objet?.message}
                  {...register("objet")}
                />
              </div>
            </Carte>

            <Carte
              titre="Expéditeur"
              aDroite={
                <button
                  type="button"
                  onClick={() => setCreationOuverte(true)}
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Créer un correspondant
                </button>
              }
            >
              <SelecteurCorrespondant
                choisi={correspondant}
                onChoisir={retenirCorrespondant}
                onSaisieChange={setRechercheExpediteur}
                onCreer={() => setCreationOuverte(true)}
                erreur={errors.correspondantId?.message}
              />
            </Carte>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Délai et priorité">
              <div className="mt-3.5 flex flex-col gap-[13px]">
                <Etiqueteur
                  libelle="Délai imparti"
                  aide={`Échéance calculée en jours ouvrés : ${delaiJours} jours après l'arrivée.`}
                >
                  <Controller
                    control={control}
                    name="delaiJours"
                    render={({ field }) => (
                      <SelecteurSegments
                        libelle="Délai imparti"
                        pleineLargeur
                        options={DELAIS}
                        valeur={String(field.value)}
                        onChange={(v) => field.onChange(Number(v))}
                      />
                    )}
                  />
                </Etiqueteur>

                <div className="flex flex-col gap-[9px]">
                  <span className="text-[11px] leading-none font-semibold text-encre-faible">
                    Marquer comme
                  </span>
                  <Controller
                    control={control}
                    name="urgent"
                    render={({ field }) => (
                      <CaseLibellee cochee={field.value} onChange={field.onChange} libelle="Urgent" />
                    )}
                  />
                  <Controller
                    control={control}
                    name="reponseAttendue"
                    render={({ field }) => (
                      <CaseLibellee
                        cochee={field.value}
                        onChange={field.onChange}
                        libelle="Réponse attendue de l'expéditeur"
                      />
                    )}
                  />
                </div>
              </div>
            </Carte>

            <Carte titre="Suite immédiate">
              <div className="mt-3.5 flex flex-col gap-3">
                <Controller
                  control={control}
                  name="coterMaintenant"
                  render={({ field }) => (
                    <Interrupteur
                      actif={field.value}
                      onChange={field.onChange}
                      libelle="Coter dès l'enregistrement"
                    />
                  )}
                />

                {coterMaintenant && (
                  <Liste
                    libelle="Structure destinataire"
                    invite="Choisir…"
                    options={structures.map((s) => ({ valeur: String(s.id), libelle: s.libelle }))}
                    aide="La fenêtre de cotation s'ouvre à l'enregistrement pour préciser le mode et l'instruction."
                    onChange={(e) =>
                      setValue("structureDestinataireId", Number(e.target.value) || null)
                    }
                  />
                )}

                {/*
                  Le bordereau du jour, l'etiquette du numero et l'accuse de
                  reception ont ete retires de cet ecran le 19 aout 2026. Les
                  trois cases etaient cochees, envoyees au serveur, et ignorees :
                  aucun de ces trois gestes n'existe. Une case cochee qui ne fait
                  rien est pire qu'une case absente — l'agent croit l'accuse
                  parti. Elles reviendront avec le pilier depart, qui porte le
                  bordereau, et avec la table de decharges qui porte l'accuse.
                */}
              </div>
            </Carte>

            <Carte titre="Contrôles">
              <div className="mt-3.5 flex flex-col gap-[11px]">
                {correspondant ? (
                  <LigneControle ton="succes">Expéditeur reconnu dans le référentiel</LigneControle>
                ) : (
                  <LigneControle ton="alerte">
                    Aucun expéditeur désigné — le courrier ne pourra pas être enregistré
                  </LigneControle>
                )}

                {fichiers.length === 0 ? (
                  <LigneControle ton="alerte">
                    Aucun document joint : le courrier ne sera consultable qu'en version papier
                  </LigneControle>
                ) : (
                  <LigneControle ton="succes">
                    {fichiers.length} document{fichiers.length > 1 ? "s" : ""} à verser après
                    l'enregistrement
                  </LigneControle>
                )}

                {enregistrer.isError && (
                  <Encart ton="danger" icone="aide">
                    {enregistrer.error instanceof Error
                      ? enregistrer.error.message
                      : "L'enregistrement a échoué."}
                  </Encart>
                )}

                <Bouton
                  type="submit"
                  className="mt-1 w-full justify-center py-2.5"
                  onClick={() => setValue("coterMaintenant", false)}
                  disabled={enregistrer.isPending}
                >
                  {enregistrer.isPending ? "Enregistrement…" : "Enregistrer sans coter"}
                </Bouton>
              </div>
            </Carte>
          </div>
        </div>
      </div>

      {creationOuverte && (
        <ModaleCorrespondant
          ouverte
          saisieInitiale={rechercheExpediteur}
          onFermer={() => setCreationOuverte(false)}
          onCree={(cree) => {
            // Cree puis retenu : l'agent voulait cet expediteur-la, le lui
            // faire rechercher a nouveau juste apres serait absurde.
            retenirCorrespondant(cree);
            setCreationOuverte(false);
          }}
        />
      )}
    </form>
  );
}
