export const RATING_FIELDS = [
  { key: "value", label: "Price vs. value" },
  { key: "condition", label: "Condition" },
  { key: "location", label: "Street & location" },
  { key: "quiet", label: "Quietness" },
] as const;

export type RatingKey = (typeof RATING_FIELDS)[number]["key"];

export const COMMENT_TAGS = [
  { key: "visited", label: "Visited in person" },
  { key: "open-house", label: "Saw the open house" },
  { key: "nearby", label: "Lives nearby" },
] as const;

export const TAG_LABELS: Record<string, string> = Object.fromEntries(
  COMMENT_TAGS.map((tag) => [tag.key, tag.label]),
);

export const MAX_COMMENT_LENGTH = 4000;
export const COMMENTS_PER_HOUR = 20;
