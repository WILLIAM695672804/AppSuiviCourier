import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { SqueletteTexte } from "@/components/ui/Squelette";
import { Bouton, BoutonIcone } from "@/components/ui/Bouton";
import { CarteIndicateur } from "@/components/ui/CarteIndicateur";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { Etiquette } from "@/components/ui/Etiquette";
import { Onglets, type Onglet } from "@/components/ui/Onglets";
import { registreDepartsQuery, type VueDeparts } from "@/features/depart/api";
import { ChaineVisas } from "@/features/depart/components/ChaineVisas";
import { STATUT_DEPART } from "@/features/depart/statut";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { useValeurDifferee } from "@/lib/useValeurDifferee";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * B-03 — registre des departs.
 *
 * La colonne « N° de départ » reste vide tant que le courrier n'est pas signe :
 * le numero s'attribue a la signature, pas a la redaction. C'est ce qui garantit
 * qu'aucun numero du registre ne corresponde a un courrier jamais parti.
 */
const ONGLETS: readonly Onglet<VueDeparts>[] = [
  { cle: "tous", libelle: "Tous" },
  { cle: "brouillons", libelle: "Brouillons" },
  { cle: "enVisa", libelle: "En visa" },
  { cle: "aSigner", libelle: "À signer" },
  { cle: "signes", libelle: "Signés" },
  { cle: "partis", libelle: "Partis" },
  { cle: "renvoyes", libelle: "Renvoyés" },
];

const GRILLE =
  "grid grid-cols-[116px_minmax(150px,1fr)_minmax(200px,1.5fr)_110px_130px_110px_100px] items-center gap-2.5 px-[26px]";

const COLONNES = ["N° de départ", "Destinataire", "Objet", "Statut", "Rédacteur", "Visas", "Mise à jour"];

export function RegistreDeparts() {
  const naviguer = useNavigate();
  const [vue, setVue] = useState<VueDeparts>("tous");
  const [saisie, setSaisie] = useState("");
  const recherche = useValeurDifferee(saisie);

  const peutRediger = usePermission(PERMISSIONS.TRA);
  const peutSigner = usePermission(PERMISSIONS.VAL);
  const { data, isPending } = useQuery(registreDepartsQuery(vue, recherche));

  const lignes = data?.lignes ?? [];

  return (
    <>
      <EnTetePage
        titre="Courriers départ"
        compte={data?.total}
        actions={
          peutRediger && (
            <Bouton variante="principal" icone="plus" onClick={() => naviguer("/courriers/departs/nouveau")}>
              Nouveau courrier
            </Bouton>
          )
        }
      />

      {data && (
        <div className="grid flex-none grid-cols-2 divide-x divide-bordure border-b border-bordure xl:grid-cols-4">
          <CarteIndicateur
            libelle="Départs signés ce mois"
            valeur={String(data.indicateurs.signesCeMois)}
            variation={{ texte: "▲ 8 %", ton: "succes" }}
          />
          <CarteIndicateur
            libelle="En attente de visa"
            valeur={String(data.indicateurs.enAttenteVisa)}
            variation={{ texte: "▲ 3", ton: "alerte" }}
          />
          <CarteIndicateur
            libelle="Délai moyen visa → signature"
            valeur={`${data.indicateurs.delaiVisaSignature.toLocaleString("fr-FR")} j`}
            variation={{ texte: "▼ 9 %", ton: "succes" }}
          />
          <CarteIndicateur
            libelle="Signés non partis"
            valeur={String(data.indicateurs.signesNonPartis)}
            note="à mettre au bordereau"
          />
        </div>
      )}

      <div className="flex-none">
        <Onglets onglets={ONGLETS} actif={vue} onChange={setVue} />
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2.5 px-[26px] py-[13px]">
        <ChampRecherche
          valeur={saisie}
          onChange={setSaisie}
          placeholder="N°, destinataire, objet…"
          className="w-[268px]"
        />
        <BoutonIcone icone="filtre" libelle="Filtrer" />
        <BoutonIcone icone="tri" libelle="Trier" />

        <div className="flex-1" />

        {peutSigner && (
          <Bouton variante="doux" icone="document" onClick={() => naviguer("/courriers/departs/signature")}>
            File de signature
          </Bouton>
        )}
        <Bouton icone="exporter">Exporter</Bouton>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[1080px]">
          <div className={`${GRILLE} sticky top-0 z-2 border-y border-bordure bg-surface-tete py-2.5`}>
            {COLONNES.map((titre) => (
              <span
                key={titre}
                className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
              >
                {titre}
              </span>
            ))}
          </div>

          {isPending && (
            <div className="px-[26px] py-4">
              <SqueletteTexte lignes={6} />
            </div>
          )}

          {lignes.map((depart) => {
            const statut = STATUT_DEPART[depart.etape];
            return (
              <Link
                key={depart.id}
                to={`/courriers/departs/${depart.id}`}
                className={`${GRILLE} border-b border-separateur py-3 transition-colors duration-150 hover:bg-[#fbfbfc]`}
              >
                <span
                  className={`text-[11.5px] leading-none font-semibold tabular-nums ${
                    depart.numero ? "text-encre-faible" : "text-encre-tenue italic"
                  }`}
                >
                  {depart.numero ?? "à la signature"}
                </span>
                <span className="truncate text-xs leading-[1.3] font-semibold text-encre-douce">
                  {depart.destinataire}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[12.5px] leading-[1.3] font-semibold text-encre">
                    {depart.objet}
                  </span>
                  {depart.horsDelai && <Etiquette ton="danger">Hors délai</Etiquette>}
                </span>
                <span className="justify-self-start">
                  <Etiquette ton={statut.ton}>{statut.libelle}</Etiquette>
                </span>
                <span className="truncate text-[11.5px] leading-none font-medium text-encre-moyenne">
                  {depart.redacteur}
                </span>
                <ChaineVisas visas={depart.visas} />
                <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                  {formaterDate(depart.majLe)}
                </span>
              </Link>
            );
          })}

          {lignes.length === 0 && !isPending && (
            <p className="px-[26px] py-16 text-center text-[12.5px] font-medium text-encre-tenue">
              Aucun courrier départ dans cette vue.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
