import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import {
  BlocNumerisation,
  type PageNumerisee,
} from "@/features/courrier/components/BlocNumerisation";
import { SelecteurCorrespondant } from "@/features/courrier/components/SelecteurCorrespondant";
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

export function EnregistrementCourrier() {
  const naviguer = useNavigate();
  const [correspondant, setCorrespondant] = useState<Correspondant | null>(null);
  const [pages, setPages] = useState<PageNumerisee[]>([]);

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

  async function soumettre(valeurs: SaisieEnregistrement) {
    const courrier = await enregistrer.mutateAsync(valeurs);
    naviguer(`/courriers/${courrier.id}${valeurs.coterMaintenant ? "?coter=1" : ""}`);
  }

  return (
    <form onSubmit={handleSubmit(soumettre)} className="contents">
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

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <BlocNumerisation
              pages={pages}
              onNumeriser={() =>
                setPages((p) => [...p, { id: crypto.randomUUID(), libelle: `Page ${p.length + 1}` }])
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
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Créer un correspondant
                </button>
              }
            >
              <SelecteurCorrespondant
                choisi={correspondant}
                onChoisir={(c) => {
                  setCorrespondant(c);
                  setValue("correspondantId", c?.id ?? 0, { shouldValidate: true });
                }}
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

                <div className="flex flex-col gap-[9px] border-t border-separateur pt-3">
                  <Controller
                    control={control}
                    name="inscrireBordereau"
                    render={({ field }) => (
                      <CaseLibellee
                        cochee={field.value}
                        onChange={field.onChange}
                        libelle="Inscrire au bordereau du jour"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="imprimerEtiquette"
                    render={({ field }) => (
                      <CaseLibellee
                        cochee={field.value}
                        onChange={field.onChange}
                        libelle="Imprimer l'étiquette du n°"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="envoyerAccuse"
                    render={({ field }) => (
                      <CaseLibellee
                        cochee={field.value}
                        onChange={field.onChange}
                        libelle="Envoyer un accusé de réception"
                      />
                    )}
                  />
                </div>
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

                {pages.length === 0 && (
                  <LigneControle ton="alerte">
                    Aucune page numérisée : le courrier ne sera consultable qu'en version papier
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
    </form>
  );
}
