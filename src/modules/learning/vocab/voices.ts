/**
 * Higher = sounds more natural. Neural/online voices (Edge, Chrome "Google …",
 * Apple "Premium/Enhanced", Siri) beat the old offline ones.
 */
export function voiceScore(v: Pick<SpeechSynthesisVoice, "name" | "lang" | "localService">, lang: string) {
  const name = v.name.toLowerCase();
  let s = 0;
  if (v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase()) s += 20;
  if (/natural|neural/.test(name)) s += 50;
  if (/premium|enhanced|siri/.test(name)) s += 40;
  if (/online/.test(name)) s += 15;
  if (/^google/.test(name)) s += 30;
  if (/compact|espeak|robot|novelty|whisper|zarvox|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids/.test(name)) s -= 60;
  if (!v.localService) s += 5;
  return s;
}
