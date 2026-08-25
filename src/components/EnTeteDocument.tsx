/**
 * En-tete et pied institutionnels des documents.
 *
 * Reproduction fidele de `public/Entête DSR à utiliser.docx`, seul modele
 * valide pour ce que l'application sort d'elle-meme : fiche de cotation,
 * bordereau de transmission, rapport imprime, export PDF. Un document sorti
 * du logiciel doit etre reconnaissable comme un document du Port autonome de
 * Douala, sans retouche dans un traitement de texte.
 *
 * Le Word est un tableau de trois colonnes — francais a gauche, armoiries au
 * centre, anglais a droite — et un pied de page fait d'un bandeau d'image. La
 * grille ci-dessous est ce tableau ; les images viennent du `.docx` lui-meme,
 * extraites dans `public/entete/`.
 *
 * Le bilinguisme n'est pas decoratif : c'est la forme officielle des actes au
 * Cameroun. Ne jamais retirer la colonne anglaise pour gagner de la place.
 */

/** Ce que porte la troisieme ligne : la structure emettrice. */
type Structure = {
  /** Ex. « Division du suivi et de la relance ». */
  libelle: string;
  /** Le meme, en anglais : la colonne de droite ne reste jamais vide. */
  libelleEn: string;
};

/** L'emetteur par defaut, celui du modele Word remis : la DSR. */
const DSR: Structure = {
  libelle: "Division du suivi et de la relance",
  libelleEn: "Monitoring and Recovery Division",
};

export function EnTeteDocument({
  structure = DSR,
  /** Sur un ecran, l'en-tete n'a de sens qu'au moment d'imprimer. */
  impressionSeule = false,
}: {
  structure?: Structure;
  impressionSeule?: boolean;
}) {
  return (
    <header
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 ${
        impressionSeule ? "hidden print:grid" : ""
      }`}
    >
      <Colonne
        blocs={[
          ["République du Cameroun", "Paix – Travail – Patrie"],
          ["Port autonome de Douala", "(P.A.D)"],
          ["Direction générale", structure.libelle],
        ]}
      />

      <img src="/entete/logo-pad.png" alt="Port autonome de Douala" className="h-[74px] w-auto" />

      <Colonne
        blocs={[
          ["Republic of Cameroon", "Peace – Work – Fatherland"],
          ["Port Authority of Douala", "(P.A.D)"],
          ["Head Office", structure.libelleEn],
        ]}
      />
    </header>
  );
}

/**
 * Le pied de page : le bandeau legal du modele Word.
 *
 * Il porte le capital social, le numero de contribuable, le RCCM et l'adresse
 * — des mentions que l'institution est tenue de faire figurer. C'est une image
 * et non du texte : les redessiner en HTML ferait diverger la version imprimee
 * du modele officiel au premier changement de police.
 */
export function PiedDocument({
  /** Reference du document, posee a gauche sous le bandeau. */
  reference,
  impressionSeule = false,
}: {
  reference?: string;
  impressionSeule?: boolean;
}) {
  return (
    <footer className={`mt-8 ${impressionSeule ? "hidden print:block" : ""}`}>
      <img src="/entete/bandeau-pad.png" alt="" className="w-full" />
      {reference && (
        <p className="mt-2 text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
          {reference}
        </p>
      )}
    </footer>
  );
}

/**
 * Une colonne de l'en-tete : trois blocs separes par un filet.
 *
 * Le Word ecrit ces filets en tirets (`--------------------`). Un trait CSS
 * dit la meme chose sans dependre de la chasse de la police.
 */
function Colonne({ blocs }: { blocs: [string, string][] }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {blocs.map(([premier, second], rang) => (
        <div key={premier} className="flex w-full flex-col items-center gap-0.5">
          {rang > 0 && <span className="mb-1 h-px w-16 bg-encre-tenue" />}
          <p className="text-[10px] leading-tight font-bold tracking-[.4px] text-encre uppercase">
            {premier}
          </p>
          <p className="text-[9.5px] leading-tight font-medium text-encre-moyenne">{second}</p>
        </div>
      ))}
    </div>
  );
}
