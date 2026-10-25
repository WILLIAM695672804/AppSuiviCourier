import { RegistreCourriers } from "@/features/courrier/pages/RegistreCourriers";

/**
 * Vue derivee du registre : meme tableau, filtre d'entree different.
 *
 * L'ecran s'ouvrait sur « tous » — il s'intitulait « Courriers à affecter » et
 * montrait le registre entier. Le responsable de structure n'avait donc nulle
 * part ou lire ce qui venait de lui etre cote et qu'il lui restait a distribuer.
 * Il s'ouvre desormais sur la file que son titre annonce.
 */
export function Affectations() {
  return <RegistreCourriers titre="Courriers à affecter" vueInitiale="aAffecter" />;
}
