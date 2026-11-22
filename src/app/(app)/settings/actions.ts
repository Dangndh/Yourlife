"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  // Keep profiles.locale in sync so the choice follows the user to other devices.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ locale }).eq("user_id", user.id);

  revalidatePath("/", "layout");
}

export async function setTheme(formData: FormData) {
  const theme = parseTheme(formData.get("theme"));
  (await cookies()).set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
