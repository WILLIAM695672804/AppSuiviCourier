import { z } from "zod";

/**
 * Regles de saisie d'un courrier arrive (A-01).
 *
 * Ces controles doublent ceux du serveur, ils ne les remplacent pas : ils
 * evitent un aller-retour a l'agent, rien de plus. Les messages sont ecrits
 * pour etre lus par un agent de session, pas par un developpeur.
 */
export const schemaEnregistrement = z.object({
  typeSession: z.enum(["ARRIVE", "INTERNE", "CONFIDENTIEL"]),

  natureId: z.coerce.number().int().positive("Choisissez la nature du courrier."),

  correspondantId: z.number().int().positive("Désignez l'expéditeur."),

  referenceExpediteur: z.string().trim().max(60, "60 caractères au maximum.").optional(),

  /** Date portee sur la lettre, distincte de la date d'arrivee. */
  dateLettre: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Date incomplète."),

  nombrePages: z.coerce
    .number()
    .int()
    .min(1, "Au moins une page.")
    .max(999, "Nombre de pages invraisemblable."),

  objet: z
    .string()
    .trim()
    .min(5, "L'objet doit permettre de reconnaître le courrier.")
    .max(300, "300 caractères au maximum."),

  delaiJours: z.coerce.number().int().positive(),

  urgent: z.boolean(),
  reponseAttendue: z.boolean(),

  /** Suites immediates cochees a l'enregistrement. */
  coterMaintenant: z.boolean(),
  /** Pre-selection de la fenetre de cotation, quand on cote des l'enregistrement. */
  structureDestinataireId: z.number().int().positive().nullable(),
});

export type SaisieEnregistrement = z.infer<typeof schemaEnregistrement>;

export const VALEURS_INITIALES: SaisieEnregistrement = {
  typeSession: "ARRIVE",
  natureId: 0,
  correspondantId: 0,
  referenceExpediteur: "",
  dateLettre: "",
  nombrePages: 1,
  objet: "",
  delaiJours: 5,
  urgent: false,
  reponseAttendue: false,
  coterMaintenant: false,
  structureDestinataireId: null,
};
