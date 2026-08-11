/**
 * Jeu d'icones de l'application.
 *
 * Les traces sont repris tels quels des maquettes. Aucune bibliotheque externe :
 * une trentaine de pictogrammes ne justifie pas une dependance, et le trait
 * doit rester exactement celui des maquettes.
 *
 * Toutes dessinent en `currentColor` : la couleur vient du parent.
 */

const TRACES = {
  tableauDeBord: (
    <>
      <rect x="1.8" y="1.8" width="5.4" height="5.4" rx="1.4" />
      <rect x="8.8" y="1.8" width="5.4" height="5.4" rx="1.4" />
      <rect x="1.8" y="8.8" width="5.4" height="5.4" rx="1.4" />
      <rect x="8.8" y="8.8" width="5.4" height="5.4" rx="1.4" />
    </>
  ),
  courrier: (
    <>
      <rect x="1.5" y="3.5" width="13" height="9.5" rx="2" />
      <path d="M2.2 5.2 8 9.2l5.8-4" />
    </>
  ),
  document: (
    <>
      <path d="M3 2.5h10v11H3z" />
      <path d="M5.6 6.2h4.8M5.6 9.2h3" />
    </>
  ),
  personnes: (
    <>
      <circle cx="6" cy="5.5" r="2.4" />
      <path d="M2 13c.6-2.2 2.1-3.3 4-3.3s3.4 1.1 4 3.3" />
      <path d="M11.5 6.5h3" />
    </>
  ),
  personneAjout: (
    <>
      <circle cx="6" cy="5.6" r="2.3" />
      <path d="M2.2 13c.6-2.1 2-3.2 3.8-3.2S9.2 10.9 9.8 13" />
      <path d="M11.4 6.6h3M12.9 5.1v3" />
    </>
  ),
  horloge: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.6V8l2.4 1.6" />
    </>
  ),
  graphique: <path d="M2.5 12.5V7M6.5 12.5V3.5M10.5 12.5V9M14 12.5h-13" />,
  organisation: (
    <>
      <circle cx="8" cy="3.2" r="1.7" />
      <circle cx="3.6" cy="12.4" r="1.7" />
      <circle cx="12.4" cy="12.4" r="1.7" />
      <path d="M8 4.9v3.2M8 8.1H3.6v2.6M8 8.1h4.4v2.6" />
    </>
  ),
  bouclier: <path d="M8 1.8l5 2v4c0 3-2.1 5.2-5 6.4C5.1 13 3 10.8 3 7.8v-4z" />,
  reglages: <path d="M2.5 4h11M2.5 8h11M2.5 12h7" />,
  recherche: (
    <>
      <circle cx="7" cy="7" r="4.6" />
      <path d="M10.5 10.5 14 14" />
    </>
  ),
  filtre: <path d="M2 4h12l-4.6 5v4.2L6.6 12V9z" />,
  tri: <path d="M5 12.5V3.5M5 3.5 2.8 5.8M11 3.5v9M11 12.5l2.2-2.3" />,
  groupe: (
    <>
      <path d="M2.5 5h11M2.5 11h11" />
      <circle cx="6" cy="5" r="1.6" fill="currentColor" />
      <circle cx="10.5" cy="11" r="1.6" fill="currentColor" />
    </>
  ),
  numeriser: (
    <>
      <rect x="2.2" y="3" width="11.6" height="10" rx="2" />
      <path d="M8 6v4.4M6 8.4 8 10.4l2-2" />
    </>
  ),
  exporter: <path d="M8 10.4V3M5 6 8 3l3 3M3 12.6h10" />,
  imprimante: (
    <>
      <rect x="3" y="6.5" width="10" height="6" rx="1.4" />
      <path d="M5 6.5V3h6v3.5M5.5 9.5h5" />
    </>
  ),
  plus: <path d="M8 3.2v9.6M3.2 8h9.6" />,
  aide: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.2v3.6M8 5.4h.01" />
    </>
  ),
  parametres: (
    <>
      <circle cx="8" cy="8" r="2.3" />
      <path d="M8 1.7v1.6M8 12.7v1.6M1.7 8h1.6M12.7 8h1.6" />
    </>
  ),
  cloche: (
    <>
      <path d="M4 6.6a4 4 0 0 1 8 0c0 2.6 1 3.6 1 3.6H3s1-1 1-3.6z" />
      <path d="M6.6 12.4a1.6 1.6 0 0 0 2.8 0" />
    </>
  ),
  panneau: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2.5" />
      <path d="M6 2.5v11" />
    </>
  ),
  chevronHaut: <path d="M3 10.5 8 5.5l5 5" />,
  chevronBas: <path d="M3 5.5 8 10.5l5-5" />,
  chevronGauche: <path d="M10 3 5 8l5 5" />,
  chevronDroite: <path d="M6 3l5 5-5 5" />,
  coche: <path d="M3.3 8.3 6.4 11.4 12.7 4.8" />,
  croix: <path d="M4 4l8 8M12 4l-8 8" />,
  oeil: (
    <>
      <path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="1.9" />
    </>
  ),
  oeilBarre: (
    <>
      <path d="M6.3 4.3A6.7 6.7 0 0 1 8 4.1c4.1 0 6.5 4 6.5 4a12 12 0 0 1-2 2.4M4.1 5.6A11.7 11.7 0 0 0 1.5 8.1s2.4 4 6.5 4a6.6 6.6 0 0 0 2.3-.4" />
      <path d="M2.4 2.4l11.2 11.2" />
    </>
  ),
  menu: <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />,
  calendrier: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.4h12M5.4 1.8v2.4M10.6 1.8v2.4" />
    </>
  ),
  cible: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <circle cx="8" cy="8" r="2.6" />
    </>
  ),
  classement: (
    <>
      <path d="M2.5 13.5V9h3.6v4.5M6.1 13.5V5h3.8v8.5M9.9 13.5V7.2h3.6v6.3" />
      <path d="M1.6 13.5h12.8" />
    </>
  ),
  archive: (
    <>
      <rect x="1.8" y="2.6" width="12.4" height="3.2" rx="1" />
      <path d="M3 5.8v6a1.6 1.6 0 0 0 1.6 1.6h6.8A1.6 1.6 0 0 0 13 11.8v-6M6.4 8.6h3.2" />
    </>
  ),
  reunion: (
    <>
      <path d="M14 11.4a1.6 1.6 0 0 1-1.6 1.6H4.9L2 15.2V4a1.6 1.6 0 0 1 1.6-1.6h8.8A1.6 1.6 0 0 1 14 4z" />
      <path d="M5.2 6.2h5.6M5.2 9h3.4" />
    </>
  ),
} as const;

export type NomIcone = keyof typeof TRACES;

type Props = {
  nom: NomIcone;
  taille?: number;
  epaisseur?: number;
  className?: string;
};

export function Icone({ nom, taille = 16, epaisseur = 1.5, className }: Props) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {TRACES[nom]}
    </svg>
  );
}
