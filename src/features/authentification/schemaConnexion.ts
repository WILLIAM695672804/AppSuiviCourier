import { z } from "zod";

/**
 * Controles de saisie de la connexion.
 *
 * Ils ne verifient que la presence : c'est le serveur qui juge des
 * identifiants. Verifier ici la forme d'un identifiant reviendrait a
 * renseigner un attaquant sur ce qui existe.
 */
export const schemaConnexion = z.object({
  identifiant: z.string().trim().min(1, "Saisissez votre identifiant."),
  motDePasse: z.string().min(1, "Saisissez votre mot de passe."),
  seSouvenir: z.boolean(),
});

export type SaisieConnexion = z.infer<typeof schemaConnexion>;
