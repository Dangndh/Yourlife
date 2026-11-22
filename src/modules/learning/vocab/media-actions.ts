"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { lookupEnglish } from "./dictionary";
import { IMAGE_BUCKET } from "./queries";

const isId = (v: unknown): v is string => z.uuid().safeParse(v).success;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const OPENVERSE = "https://api.openverse.org/v1/images";

// ---------------------------------------------------------------------
// Pronunciation
// ---------------------------------------------------------------------

/**
 * Look up real-speaker recordings for cards not checked yet (English decks only).
 * Returns the audio URL for every requested card that has one.
 */
export async function ensureAudio(cardIds: string[]): Promise<Record<string, string>> {
  const ids = cardIds.filter(isId).slice(0, 30);
  if (!ids.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_cards").select("id, deck_id, term, pronunciation, audio_url, audio_checked_at").in("id", ids);
  const deckIds = Array.from(new Set((data ?? []).map((c) => c.deck_id)));
  const { data: decks } = deckIds.length ? await supabase.from("lrn_decks").select("id, language").in("id", deckIds) : { data: [] };
  const languageOf = new Map((decks ?? []).map((d) => [d.id, d.language]));
  const out: Record<string, string> = {};
  const todo: { id: string; term: string; pronunciation: string | null; language: string }[] = [];
  for (const c of data ?? []) {
    if (c.audio_url) out[c.id] = c.audio_url;
    const language = languageOf.get(c.deck_id) ?? "";
    if (!c.audio_checked_at && language.startsWith("en")) todo.push({ id: c.id, term: c.term, pronunciation: c.pronunciation, language });
  }
  // A few at a time, so a long list doesn't flood the free API.
  for (let i = 0; i < todo.length; i += 5) {
    await Promise.all(
      todo.slice(i, i + 5).map(async (c) => {
        const found = await lookupEnglish(c.term, c.language);
        if (!found) return; // network problem: try again next time
        const patch: { audio_url: string | null; audio_checked_at: string; pronunciation?: string } = {
          audio_url: found.audio,
          audio_checked_at: new Date().toISOString(),
        };
        if (!c.pronunciation && found.ipa) patch.pronunciation = found.ipa;
        await supabase.from("lrn_cards").update(patch).eq("id", c.id);
        if (found.audio) out[c.id] = found.audio;
      }),
    );
  }
  return out;
}

// ---------------------------------------------------------------------
// Pictures
// ---------------------------------------------------------------------

export type ImageResult = { id: string; thumb: string; title: string; credit: string };

/** Openly licensed pictures from Openverse (no key needed). */
export async function searchImages(query: string): Promise<{ ok: boolean; results: ImageResult[] }> {
  const q = query.trim().slice(0, 100);
  if (!q) return { ok: true, results: [] };
  try {
    const res = await fetch(`${OPENVERSE}/?q=${encodeURIComponent(q)}&page_size=12&mature=false`, {
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { ok: false, results: [] };
    const body = (await res.json()) as {
      results?: { id: string; title?: string; creator?: string; license?: string; license_version?: string }[];
    };
    const results = (body.results ?? [])
      .filter((r) => isId(r.id))
      .map((r) => ({
        id: r.id,
        thumb: `${OPENVERSE}/${r.id}/thumb/`,
        title: (r.title ?? "").slice(0, 120),
        credit: [r.creator, r.license ? `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim() : null, "Openverse"]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 300),
      }));
    return { ok: true, results };
  } catch {
    return { ok: false, results: [] };
  }
}

async function storeImage(cardId: string, bytes: ArrayBuffer, type: string, credit: string | null) {
  const ext = IMAGE_TYPES[type];
  if (!ext || bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false as const, error: "badImage" };
  const supabase = await createClient();
  const [{ data: auth }, { data: card }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("lrn_cards").select("id, image_path").eq("id", cardId).maybeSingle(),
  ]);
  if (!auth.user || !card) return { ok: false as const, error: "saveFailed" };
  const path = `${auth.user.id}/vocab/${cardId}-${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType: type, upsert: false });
  if (error) return { ok: false as const, error: "saveFailed" };
  const { error: updateError } = await supabase.from("lrn_cards").update({ image_path: path, image_credit: credit }).eq("id", cardId);
  if (updateError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    return { ok: false as const, error: "saveFailed" };
  }
  if (card.image_path) await supabase.storage.from(IMAGE_BUCKET).remove([card.image_path]);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** A picture from the user's device (the browser shrinks it first). */
export async function uploadCardImage(formData: FormData) {
  const cardId = formData.get("card_id");
  const file = formData.get("file");
  if (!isId(cardId) || !(file instanceof File)) return { ok: false, error: "badImage" };
  return storeImage(cardId, await file.arrayBuffer(), file.type, null);
}

/** Copy a picked Openverse picture into the user's storage, so it keeps working. */
export async function setCardImageFromOpenverse(cardId: string, imageId: string, credit: string) {
  if (!isId(cardId) || !isId(imageId)) return { ok: false, error: "badImage" };
  try {
    const res = await fetch(`${OPENVERSE}/${imageId}/thumb/`, { signal: AbortSignal.timeout(10000) });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok) return { ok: false, error: "badImage" };
    return storeImage(cardId, await res.arrayBuffer(), type, credit.slice(0, 300) || null);
  } catch {
    return { ok: false, error: "badImage" };
  }
}

export async function removeCardImage(cardId: string) {
  if (!isId(cardId)) return { ok: false };
  const supabase = await createClient();
  const { data: card } = await supabase.from("lrn_cards").select("image_path").eq("id", cardId).maybeSingle();
  await supabase.from("lrn_cards").update({ image_path: null, image_credit: null }).eq("id", cardId);
  if (card?.image_path) await supabase.storage.from(IMAGE_BUCKET).remove([card.image_path]);
  revalidatePath("/", "layout");
  return { ok: true };
}
