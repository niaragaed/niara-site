// Links to the other Niara products, from env (public values). A link is shown only
// when its variable holds an absolute https URL; anything else is ignored.
const httpsUrl = (v: string | undefined): string | null => {
  if (!v || v.trim() === "") return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

export interface ExternalProduct {
  key: "register" | "smes";
  url: string;
}

// Next.js inlines only literal `process.env.NEXT_PUBLIC_X` reads.
const REGISTER_URL = httpsUrl(process.env.NEXT_PUBLIC_REGISTER_URL);
const SMES_URL = httpsUrl(process.env.NEXT_PUBLIC_SMES_URL);

export const EXTERNAL_PRODUCTS: ExternalProduct[] = [
  ...(REGISTER_URL ? [{ key: "register" as const, url: REGISTER_URL }] : []),
  ...(SMES_URL ? [{ key: "smes" as const, url: SMES_URL }] : []),
];
