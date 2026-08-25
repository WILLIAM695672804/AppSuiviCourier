/**
 * Erreur renvoyee par le serveur, portee jusqu'a l'ecran.
 *
 * Dans son propre fichier plutot que dans `api.ts` : elle est importee par des
 * modules que `api.ts` importe lui-meme, et la sortir du client rompt le cycle.
 * C'est ce qui a permis de debrancher le serveur simule (ADR 008) sans toucher
 * aux ecrans qui rattrapent une erreur.
 */
export class ErreurApi extends Error {
  statut: number;
  details: unknown;

  constructor(statut: number, message: string, details?: unknown) {
    super(message);
    this.name = "ErreurApi";
    this.statut = statut;
    this.details = details;
  }
}

/** Vrai lorsque le serveur refuse la requete faute de session valide. */
export function estNonAuthentifie(erreur: unknown): boolean {
  return erreur instanceof ErreurApi && erreur.statut === 401;
}

/**
 * Le message a montrer a l'agent quand une ecriture est refusee.
 *
 * Les erreurs metier du backend sont **redigees pour lui** : elles disent ce
 * qui bloque et ce qui debloquerait (« Redefinissez son perimetre, puis
 * reprenez cette affectation »). Les remplacer par un « l'operation a echoue »
 * generique jette precisement l'information qui permet de s'en sortir.
 *
 * Trois cas ne se transmettent pas tels quels. Le **401** dit « session
 * expiree » ou « droit manquant » selon la route, et son message serveur est
 * volontairement avare — le front redirige de toute facon. Le **500** n'a pas
 * de message pense pour un lecteur ; en montrer un donnerait a une panne
 * l'apparence d'un refus normal. Le **422**, lui, a un message serveur trop
 * pauvre pour servir a quoi que ce soit : voir `messageDeSaisieInvalide`.
 */
export function messageDErreur(erreur: unknown, defaut = "L'enregistrement a échoué."): string {
  if (!(erreur instanceof ErreurApi)) return defaut;
  if (erreur.statut === 401) return "Votre session n'autorise plus cette action.";
  if (erreur.statut >= 500) return defaut;
  if (erreur.statut === 422) return messageDeSaisieInvalide(erreur);
  return erreur.message || defaut;
}

/**
 * Le 422 est le seul refus qui ne s'adresse pas à l'agent.
 *
 * Les 400 et 409 disent ce qui bloque dans le métier ; le 422 dit que le
 * **formulaire** a envoyé une donnée que le serveur ne sait pas lire — un champ
 * omis, un identifiant vide parti en chaîne. Aucun agent ne peut corriger cela
 * en ressaisissant, et le message générique de `config/api.py`, « La saisie
 * comporte des erreurs », l'enfermait dans une boucle : il rejouait le même
 * geste, obtenait le même refus, et n'apprenait jamais quel champ était en
 * cause.
 *
 * On déplie donc `details`, et on nomme les champs. Le message dit aussi que le
 * défaut est dans l'application : c'est ce qui transforme un agent bloqué en un
 * agent qui signale.
 */
function messageDeSaisieInvalide(erreur: ErreurApi): string {
  const corps = erreur.details as { details?: unknown } | null;
  const lignes = Array.isArray(corps?.details) ? corps.details.map(decrireDetail) : [];
  const utiles = lignes.filter((ligne): ligne is string => ligne !== null);

  if (utiles.length === 0) return erreur.message || "La saisie comporte des erreurs.";
  return `Le formulaire a envoyé une donnée que le serveur refuse — ${utiles.join(" ; ")}. C'est un défaut de l'application : signalez-le plutôt que de ressaisir.`;
}

/**
 * Les raisons que django-ninja renvoie, en français.
 *
 * La table ne couvre pas tout, et n'a pas à le faire : `pydantic` en produit
 * une soixantaine, dont l'écrasante majorité ne peut pas se produire ici. Les
 * autres passent avec leur libellé d'origine entre parenthèses — en anglais,
 * certes, mais exact. Le remplacer par un « valeur refusée » français aurait
 * l'air plus propre et n'apprendrait rien à qui lit le signalement.
 */
const RAISONS: Readonly<Record<string, string>> = {
  missing: "champ obligatoire, absent de l'envoi",
  json_invalid: "corps de requête illisible",
  string_type: "attendu du texte",
  int_type: "attendu un nombre entier",
  int_parsing: "attendu un nombre entier",
  float_type: "attendu un nombre",
  float_parsing: "attendu un nombre",
  bool_type: "attendu vrai ou faux",
  date_type: "attendu une date",
  date_parsing: "date illisible",
  date_from_datetime_parsing: "date illisible",
  list_type: "attendu une liste",
  string_too_short: "valeur trop courte",
  string_too_long: "valeur trop longue",
  greater_than: "valeur trop petite",
  less_than: "valeur trop grande",
  enum: "valeur hors des choix acceptés",
};

/**
 * Une entrée de `details` en une phrase, ou `null` si elle n'en porte pas.
 *
 * `loc` arrive sous la forme `["body", "saisie", "code"]` : la source, le nom
 * du paramètre de la vue, puis le chemin du champ. Seul le dernier élément
 * intéresse le lecteur — les deux premiers nomment la plomberie de
 * django-ninja. Le nom du champ n'est **pas** traduit : c'est l'identifiant que
 * le front envoie, et le franciser en « poste supérieur » ferait chercher à
 * l'écran un libellé qui n'y est pas.
 */
function decrireDetail(detail: unknown): string | null {
  if (typeof detail !== "object" || detail === null) return null;
  const { loc, type, msg } = detail as { loc?: unknown; type?: unknown; msg?: unknown };

  const chemin = Array.isArray(loc) ? loc.filter((part) => typeof part === "string") : [];
  const champ = chemin.length > 0 ? chemin[chemin.length - 1] : null;

  const connue = typeof type === "string" ? RAISONS[type] : undefined;
  const raison = connue ?? (typeof msg === "string" ? `refusé (${msg})` : "refusé");

  return champ === null ? raison : `« ${champ} » : ${raison}`;
}
