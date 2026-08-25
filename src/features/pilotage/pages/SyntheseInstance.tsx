import { useQuery } from "@tanstack/react-query";
import { EnTeteDocument, PiedDocument } from "@/components/EnTeteDocument";
import { EnTetePage } from "@/components/EnTetePage";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Bouton } from "@/components/ui/Bouton";
import { Feu } from "@/components/ui/Feu";
import { adresseExportSynthese, syntheseQuery } from "@/features/pilotage/apiCockpit";
import { formaterDate } from "@/lib/format";

/**
 * Note de synthèse produite avant une instance — §3.1 et §3.2.
 *
 * Le Directeur général « exporte en un clic les synthèses au format PDF pour
 * diffusion avant les instances » ; le comité de direction « reçoit, avant
 * chaque instance, les exports de synthèse générés automatiquement ».
 *
 * C'est donc un document, pas un tableau de bord : il se lit une fois, sur
 * papier, en séance. La mise en page suit cette destination — colonne unique
 * étroite, pas de couleur de fond, pas d'élément interactif, une hiérarchie de
 * titres qui survit à l'impression en noir et blanc. Les feux portent leur
 * libellé en toutes lettres pour la même raison.
 *
 * La feuille reprend l'apparence du papier institutionnel plutôt que celle de
 * l'application, mais **elle n'est plus la source du document** : le Word et le
 * PDF sont écrits par le serveur depuis le gabarit officiel de la DSR
 * (ADR 023). Cet écran sert à lire la note avant de la diffuser ; les deux
 * boutons téléchargent le document, ils n'impriment plus la page.
 */
export function SyntheseInstance() {
  const { data: synthese } = useQuery(syntheseQuery());

  if (!synthese) {
    return (
      <>
        <EnTetePage titre="Synthèse pour l'instance" />
        <EtatChargement message="Préparation de la synthèse…" />
      </>
    );
  }

  return (
    <>
      <EnTetePage
        titre="Synthèse pour l'instance"
        sousTitre={`${synthese.seance} — préparée par la ${synthese.producteur}`}
        actions={
          <>
            <Bouton icone="exporter" href={adresseExportSynthese("docx")}>
              Télécharger en Word
            </Bouton>
            <Bouton variante="principal" icone="exporter" href={adresseExportSynthese("pdf")}>
              Télécharger en PDF
            </Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        {/* L'en-tete institutionnel n'apparait qu'a l'impression : a l'ecran,
            la barre de titre dit deja ou l'on est. */}
        <EnTeteDocument impressionSeule />

        <article className="mx-auto flex max-w-[760px] flex-col gap-7 rounded-none border border-bordure bg-surface px-6 py-8 md:px-12 md:py-12 print:border-0 print:px-0">
          <header className="flex flex-col gap-2 border-b border-encre pb-5">
            <span className="text-[10.5px] leading-none font-bold tracking-[.6px] text-encre-tenue uppercase">
              {synthese.producteur}
            </span>
            <h1 className="text-[22px] leading-tight font-extrabold tracking-[-.4px] text-encre">
              Note de synthèse — {synthese.instance}
            </h1>
            <p className="text-[12px] leading-[1.5] font-medium text-encre-moyenne">
              {synthese.seance} · séance du {formaterDate(synthese.dateSeance)} · période observée :{" "}
              {synthese.periode}
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] leading-none font-extrabold text-encre">
              1. Faits marquants de la période
            </h2>
            <ul className="flex flex-col gap-2">
              {synthese.faitsMarquants.map((fait) => (
                <li key={fait} className="flex gap-2.5">
                  <span className="mt-[7px] size-1 flex-none rounded-none bg-encre-moyenne" />
                  <span className="text-[12.5px] leading-[1.6] font-medium text-encre-douce">
                    {fait}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] leading-none font-extrabold text-encre">
              2. Chiffres d'ensemble
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
              <Chiffre libelle="Exécution des activités" valeur={`${synthese.executionActivites} %`} />
              <Chiffre libelle="Décisions arrivées à échéance" valeur={String(synthese.decisionsEchues)} />
              <Chiffre libelle="Décisions exécutées" valeur={String(synthese.decisionsExecutees)} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] leading-none font-extrabold text-encre">
              3. Classement des structures
            </h2>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-encre-tenue">
                  <th className="py-2 pr-3 text-[10px] leading-none font-bold tracking-[.4px] text-encre-tenue uppercase">
                    Rang
                  </th>
                  <th className="py-2 pr-3 text-[10px] leading-none font-bold tracking-[.4px] text-encre-tenue uppercase">
                    Structure
                  </th>
                  <th className="py-2 pr-3 text-right text-[10px] leading-none font-bold tracking-[.4px] text-encre-tenue uppercase">
                    Score
                  </th>
                  <th className="py-2 text-[10px] leading-none font-bold tracking-[.4px] text-encre-tenue uppercase">
                    Cotation
                  </th>
                </tr>
              </thead>
              <tbody>
                {synthese.classement.map((ligne) => (
                  <tr key={ligne.sigle} className="border-b border-separateur">
                    <td className="py-2.5 pr-3 text-[12px] font-bold text-encre tabular-nums">
                      {ligne.rang}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-[12px] font-semibold text-encre">{ligne.sigle}</span>
                      <span className="ml-2 text-[10.5px] font-medium text-encre-tenue">
                        {ligne.libelle}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-[12px] font-bold text-encre tabular-nums">
                      {ligne.score}
                    </td>
                    <td className="py-2.5">
                      <Feu niveau={ligne.feu} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] leading-none font-extrabold text-encre">
              4. Points appelant un arbitrage
            </h2>
            <ul className="flex flex-col gap-4">
              {synthese.pointsDAttention.map((point) => (
                <li key={point.titre} className="flex flex-col gap-1.5 border-l-2 border-encre pl-3.5">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[12.5px] leading-none font-bold text-encre">
                      {point.titre}
                    </span>
                    <Feu niveau={point.feu} />
                  </span>
                  <span className="text-[12px] leading-[1.6] font-medium text-encre-douce">
                    {point.texte}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="border-t border-separateur pt-4">
            <p className="text-[10.5px] leading-[1.6] font-medium text-encre-tenue">
              Document produit automatiquement à partir des registres tenus dans l'application.
              Les chiffres portent sur {synthese.periode} et n'engagent que les données remontées
              par les structures à la date d'édition.
            </p>
          </footer>
        </article>

        <PiedDocument impressionSeule />
      </div>
    </>
  );
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10.5px] leading-none font-semibold tracking-[.4px] text-encre-tenue uppercase">
        {libelle}
      </span>
      <span className="text-[24px] leading-none font-extrabold tracking-[-.5px] text-encre tabular-nums">
        {valeur}
      </span>
    </div>
  );
}
