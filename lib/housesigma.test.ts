import { describe, expect, it } from "vitest";
import { parseHouseSigmaUrl } from "./housesigma";

describe("parseHouseSigmaUrl", () => {
  it("reads city and address from a listing link and drops tracking params", () => {
    expect(
      parseHouseSigmaUrl(
        "https://housesigma.com/on/etobicoke-real-estate/104-great-oak-dr/home/r56k97w6mmxykrjd?id_listing=xlkv3v1wqop7dbnr&utm_source=share",
      ),
    ).toEqual({
      citySlug: "etobicoke",
      addressSlug: "104-great-oak-dr",
      city: "Etobicoke",
      address: "104 Great Oak Dr",
      url: "https://housesigma.com/on/etobicoke-real-estate/104-great-oak-dr/home/r56k97w6mmxykrjd",
    });
  });

  it("accepts trailing slashes, www, missing scheme and multi-word cities", () => {
    expect(parseHouseSigmaUrl("https://housesigma.com/on/toronto-real-estate/407-annette-st/home/vgaaoyl1roa7gxmb/")?.address).toBe("407 Annette St");
    expect(parseHouseSigmaUrl("www.housesigma.com/on/richmond-hill-real-estate/12-elm-ave/home/abc123")?.city).toBe("Richmond Hill");
    expect(parseHouseSigmaUrl("  https://housesigma.com/en/on/toronto-real-estate/2-rexford-rd/home/zexrx30k4gd7okln  ")?.addressSlug).toBe("2-rexford-rd");
  });

  it("rejects other sites, look-alike hosts and non-listing pages", () => {
    expect(parseHouseSigmaUrl("https://example.com/on/toronto-real-estate/2-rexford-rd/home/abc")).toBeNull();
    expect(parseHouseSigmaUrl("https://nothousesigma.com/on/toronto-real-estate/2-rexford-rd/home/abc")).toBeNull();
    expect(parseHouseSigmaUrl("https://housesigma.com/on/map/")).toBeNull();
    expect(parseHouseSigmaUrl("https://housesigma.com/bc/vancouver-real-estate/1-main-st/home/abc")).toBeNull();
    expect(parseHouseSigmaUrl("not a link")).toBeNull();
    expect(parseHouseSigmaUrl("")).toBeNull();
  });
});
