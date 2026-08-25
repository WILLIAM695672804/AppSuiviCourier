import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { EnTeteDocument, PiedDocument } from "@/components/EnTeteDocument";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { bordereauQuery } from "@/features/depart/api";
import { formaterDate } from "@/lib/format";

/**
 * B-05 — bordereau de remise au coursier.
 *
 * C'est un document, pas un ecran : il sera imprime, signe par le coursier et
 * conserve. Sa mise en page imite donc le papier — en-tete institutionnel,
 * tableau des plis, cadres de signature — et non l'interface autour.
 *
 * Les regles d'impression sont posees en `print:` : la barre laterale et les
 * actions disparaissent, le fond redevient blanc.
 */
export function BordereauCoursier() {
  const { numero } = useParams();
  const { data, isPending } = useQuery(bordereauQuery(numero ?? ""));

  if (isPending || !data) {
    return (
      <>
        <div className="print:hidden">
          <EnTetePage
            titre="Bordereau"
            miettes={[{ libelle: "Courriers départ", chemin: "/courriers/departs" }]}
          />
        </div>
        <EtatChargement message="Chargement du bordereau…" />
      </>
    );
  }

  return (
    <>
      <div className="print:hidden">
        <EnTetePage
          titre={`Bordereau ${data.numero}`}
          miettes={[
            { libelle: "Courriers départ", chemin: "/courriers/departs" },
            { libelle: data.numero },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Bouton icone="exporter">Exporter en PDF</Bouton>
              <Bouton variante="principal" icone="imprimante" onClick={() => window.print()}>
                Imprimer et remettre
              </Bouton>
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] py-6 print:overflow-visible print:bg-white print:p-0">
        <article className="mx-auto max-w-[820px] rounded-none border border-bordure bg-surface p-10 shadow-[0_1px_2px_rgba(16,24,40,.04)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <EnTeteDocument />

          <div className="mt-6 text-center">
            <h2 className="text-base leading-none font-extrabold tracking-[-.2px] text-encre">
              Bordereau de transmission
            </h2>
            <p className="mt-2 text-[11.5px] leading-none font-semibold text-encre-faible tabular-nums">
              N° {data.numero} · {formaterDate(data.date)}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {[
              { libelle: "Coursier", valeur: data.coursier },
              { libelle: "Tournée", valeur: data.tournee },
              { libelle: "Remis par", valeur: data.remisPar },
              { libelle: "Nombre de plis", valeur: String(data.plis.length) },
            ].map((champ) => (
              <div key={champ.libelle} className="flex flex-col gap-1.5">
                <dt className="text-[10px] leading-none font-bold tracking-[.5px] text-encre-tenue uppercase">
                  {champ.libelle}
                </dt>
                <dd className="text-[12px] leading-none font-semibold text-encre">{champ.valeur}</dd>
              </div>
            ))}
          </dl>

          <table className="mt-7 w-full border-collapse">
            <thead>
              <tr className="border-y border-bordure-forte bg-neutre-voile print:bg-transparent">
                {["Référence", "Objet", "Destinataire", "Pages"].map((titre) => (
                  <th
                    key={titre}
                    className="px-2.5 py-2 text-left text-[9.5px] leading-none font-bold tracking-[.5px] text-encre-faible uppercase last:text-right"
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.plis.map((pli) => (
                <tr key={pli.reference} className="border-b border-separateur">
                  <td className="px-2.5 py-2.5 text-[11px] leading-none font-semibold text-encre-faible tabular-nums">
                    {pli.reference}
                  </td>
                  <td className="px-2.5 py-2.5 text-[11.5px] leading-[1.4] font-semibold text-encre">
                    {pli.objet}
                  </td>
                  <td className="px-2.5 py-2.5 text-[11.5px] leading-[1.4] font-medium text-encre-moyenne">
                    {pli.destinataire}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-[11.5px] leading-none font-medium text-encre-moyenne tabular-nums">
                    {pli.pages}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Deux signatures : celle qui remet et celle qui recoit. C'est la
              seule preuve que le pli a quitte le service. */}
          <div className="mt-12 grid grid-cols-2 gap-10">
            {["Le remettant", "Le coursier — nom et signature"].map((cadre) => (
              <div key={cadre}>
                <p className="text-[10.5px] leading-none font-semibold text-encre-faible">{cadre}</p>
                <div className="mt-12 border-t border-encre-tenue" />
              </div>
            ))}
          </div>

          <PiedDocument reference={data.numero} />
        </article>
      </div>
    </>
  );
}
