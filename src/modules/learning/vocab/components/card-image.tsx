"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { removeCardImage, searchImages, setCardImageFromOpenverse, uploadCardImage, type ImageResult } from "../media-actions";

const MAX_SIDE = 800;

/** Shrink a photo in the browser (max 800px, JPEG) so uploads are small and fast. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85));
}

export function CardImage({
  cardId,
  imageUrl,
  credit,
  defaultQuery,
}: {
  cardId: string;
  imageUrl: string | null;
  credit: string | null;
  defaultQuery: string;
}) {
  const t = useTranslations("vocab");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<ImageResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(t("imageFailed"));
      else {
        setResults(null);
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col gap-3">
      {imageUrl ? (
        <figure className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="bg-muted max-h-48 w-fit max-w-full rounded-md border object-contain" />
          {credit && <figcaption className="text-muted-foreground text-[11px]">{credit}</figcaption>}
        </figure>
      ) : (
        <p className="text-muted-foreground text-sm">{t("noImage")}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            run(async () => {
              try {
                const fd = new FormData();
                fd.set("card_id", cardId);
                fd.set("file", new File([await shrink(file)], "image.jpg", { type: "image/jpeg" }));
                return await uploadCardImage(fd);
              } catch {
                return { ok: false };
              }
            });
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => fileRef.current?.click()}>
          <ImagePlus />
          {t("uploadImage")}
        </Button>
        {imageUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(() => removeCardImage(cardId))}>
            <Trash2 />
            {t("removeImage")}
          </Button>
        )}
        {pending && <Loader2 className="text-muted-foreground size-4 animate-spin self-center" />}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setError(null);
            const r = await searchImages(query);
            if (!r.ok) setError(t("searchFailed"));
            setResults(r.results);
          });
        }}
      >
        <Input value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t("searchImages")} placeholder={t("searchImages")} />
        <Button type="submit" variant="outline" disabled={pending || !query.trim()}>
          <Search />
          {t("search")}
        </Button>
      </form>
      {error && <p className="text-destructive text-xs">{error}</p>}
      {results && results.length === 0 && !error && <p className="text-muted-foreground text-xs">{t("noResults")}</p>}
      {results && results.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={pending}
                onClick={() => run(() => setCardImageFromOpenverse(cardId, r.id, r.credit))}
                className="bg-muted hover:ring-primary aspect-square overflow-hidden rounded-md border hover:ring-2 disabled:opacity-50"
                title={r.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.thumb} alt={r.title} loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-[11px]">{t("openverseNote")}</p>
        </>
      )}
    </div>
  );
}
