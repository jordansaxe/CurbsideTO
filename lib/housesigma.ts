export type ParsedListing = {
  citySlug: string;
  addressSlug: string;
  city: string;
  address: string;
  /** Canonical link back to HouseSigma, without tracking parameters. */
  url: string;
};

const PATH = /\/on\/([a-z0-9-]+)-real-estate\/([a-z0-9-]+)\/home\/([a-z0-9]+)(?:\/|$)/i;

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Reads the city and street address out of a HouseSigma listing link.
 * Nothing is fetched: the link itself is the only input.
 * Returns null when the text is not an Ontario HouseSigma home link.
 */
export function parseHouseSigmaUrl(input: string): ParsedListing | null {
  const text = input.trim();
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "housesigma.com" && !host.endsWith(".housesigma.com")) return null;

  const match = PATH.exec(parsed.pathname);
  if (!match) return null;

  const citySlug = match[1].toLowerCase();
  const addressSlug = match[2].toLowerCase();
  const homeId = match[3].toLowerCase();

  return {
    citySlug,
    addressSlug,
    city: titleCase(citySlug),
    address: titleCase(addressSlug),
    url: `https://housesigma.com/on/${citySlug}-real-estate/${addressSlug}/home/${homeId}`,
  };
}
