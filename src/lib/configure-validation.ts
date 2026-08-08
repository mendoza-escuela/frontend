import { z } from "zod";

/** Configura en español los mensajes predeterminados de todos los schemas Zod. */
export function configureValidationMessages() {
  z.config(z.locales.es());
}
