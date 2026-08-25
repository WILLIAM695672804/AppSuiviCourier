import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Champ } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import {
  preferencesQuery,
  useEnregistrerPreferences,
  type CanalNotification,
} from "@/features/portail/api";

/**
 * Préférences de notification — §3.13, deuxième point, et RF-SUI-03.
 *
 * « Recevoir des notifications multicanal (courriel, SMS, portail) sur les
 * étapes clés de leur dossier », « selon le canal préféré de l'usager ».
 *
 * Le canal est un choix, pas un réglage technique : c'est l'usager qui sait
 * s'il lit ses courriels ou seulement ses SMS. D'où le sélecteur en trois
 * segments visibles plutôt qu'une liste déroulante — les trois options doivent
 * se comparer d'un regard.
 *
 * Deux notifications ne se désactivent pas et l'écran le dit : la demande de
 * complément et la décision rendue. Ce sont les deux moments où le silence
 * coûte un dossier, et laisser un usager les couper reviendrait à le laisser
 * organiser sa propre forclusion.
 */
const CANAUX: { valeur: CanalNotification; libelle: string }[] = [
  { valeur: "Courriel", libelle: "Courriel" },
  { valeur: "SMS", libelle: "SMS" },
  { valeur: "Portail seulement", libelle: "Portail seulement" },
];

/*
 * La liste des événements non désactivables ne vit plus ici.
 *
 * Elle était en dur — `["complement", "decision"]` — et le serveur, lui, la
 * porte en base avec la colonne `obligatoire`. Deux listes pour une seule
 * règle, c'est une divergence qui attend son heure : un troisième événement
 * rendu obligatoire par le métier aurait été grisé côté serveur et coché
 * côté écran. La règle est désormais lue, pas répétée.
 */

export function PreferencesNotification() {
  const { data } = useQuery(preferencesQuery());
  const enregistrer = useEnregistrerPreferences();

  /*
   * Brouillon plutot que recopie des donnees du serveur dans un effet.
   *
   * Tant que l'usager n'a rien touche, `brouillon` vaut `null` et l'ecran
   * affiche ce que dit le serveur. Au premier changement, le brouillon prend
   * le relais. Aucun effet, aucune synchronisation a maintenir, et le cas ou
   * la reponse arrive apres une premiere saisie ne l'ecrase pas.
   */
  const [brouillon, setBrouillon] = useState<{
    courriel: string;
    telephone: string;
    canal: CanalNotification;
    actifs: string[];
  } | null>(null);

  const valeurs = brouillon ?? {
    courriel: data?.courriel ?? "",
    telephone: data?.telephone ?? "",
    canal: data?.canal ?? "Courriel",
    actifs: (data?.evenements ?? []).filter((e) => e.actif).map((e) => e.cle),
  };

  const modifier = (champs: Partial<typeof valeurs>) =>
    setBrouillon({ ...valeurs, ...champs });

  /** Les clés que le serveur déclare non désactivables. */
  const obligatoires = (data?.evenements ?? [])
    .filter((e) => e.obligatoire)
    .map((e) => e.cle);

  function basculer(cle: string) {
    if (obligatoires.includes(cle)) return;
    modifier({
      actifs: valeurs.actifs.includes(cle)
        ? valeurs.actifs.filter((c) => c !== cle)
        : [...valeurs.actifs, cle],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-.5px] text-encre">
          Notifications
        </h1>
        <p className="text-[13px] leading-[1.55] font-medium text-encre-faible">
          Comment souhaitez-vous être averti de l'avancement de vos dossiers ?
        </p>
      </div>

      {enregistrer.isSuccess && (
        <Encart ton="succes" icone="coche">
          Vos préférences ont été enregistrées.
        </Encart>
      )}

      <Carte titre="Vos coordonnées">
        <div className="mt-4 flex flex-col gap-4">
          <Champ
            libelle="Adresse électronique"
            type="email"
            value={valeurs.courriel}
            onChange={(e) => modifier({ courriel: e.target.value })}
            aide="C'est aussi l'adresse sur laquelle vous vous connectez."
          />
          <Champ
            libelle="Téléphone mobile"
            type="tel"
            value={valeurs.telephone}
            onChange={(e) => modifier({ telephone: e.target.value })}
            placeholder="+237 6 00 00 00 00"
            aide="Nécessaire si vous choisissez le SMS."
          />
        </div>
      </Carte>

      <Carte titre="Canal préféré">
        <div className="mt-4 flex flex-col gap-3">
          <SelecteurSegments
            options={CANAUX}
            valeur={valeurs.canal}
            onChange={(canal) => modifier({ canal })}
            libelle="Choisir le canal de notification"
            pleineLargeur
          />

          {valeurs.canal === "SMS" && !valeurs.telephone.trim() && (
            <Encart ton="alerte" icone="cloche">
              Renseignez un numéro de téléphone, sans quoi aucune notification
              ne pourra vous parvenir.
            </Encart>
          )}

          {valeurs.canal === "Portail seulement" && (
            <Encart ton="alerte" icone="horloge">
              Vous ne serez averti nulle part ailleurs : il vous faudra revenir
              sur ce portail pour savoir où en sont vos dossiers. Les délais
              courent malgré tout.
            </Encart>
          )}
        </div>
      </Carte>

      <Carte titre="Ce dont vous voulez être averti">
        <ul className="mt-4 flex flex-col gap-1">
          {(data?.evenements ?? []).map((evenement) => {
            const obligatoire = evenement.obligatoire;

            return (
              <li
                key={evenement.cle}
                className={`flex flex-col gap-1 rounded-none px-2 py-2.5 ${
                  obligatoire ? "bg-surface-douce" : ""
                }`}
              >
                <CaseLibellee
                  libelle={evenement.libelle}
                  cochee={obligatoire || valeurs.actifs.includes(evenement.cle)}
                  onChange={() => basculer(evenement.cle)}
                  desactivee={obligatoire}
                />
                {obligatoire && (
                  <span className="pl-7 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                    Cette notification ne peut pas être désactivée : c'est un
                    moment où le silence peut vous faire perdre le bénéfice de
                    votre dossier.
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Carte>

      <div>
        <Bouton
          variante="principal"
          icone="coche"
          chargement={enregistrer.isPending}
          onClick={() =>
            enregistrer.mutate({
              courriel: valeurs.courriel,
              telephone: valeurs.telephone.trim() || null,
              canal: valeurs.canal,
              evenements: [...new Set([...valeurs.actifs, ...obligatoires])],
            })
          }
        >
          {enregistrer.isPending
            ? "Enregistrement…"
            : "Enregistrer mes préférences"}
        </Bouton>
      </div>
    </div>
  );
}
