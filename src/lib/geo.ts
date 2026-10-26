// Fixed reference list of Malaysian states, so filters and forms stay
// consistent (design.md: "States and districts are a fixed reference list in
// code"). Districts are intentionally open text for the MVP — the launch
// niche spans many small districts and a full gazetteer is out of scope.

export const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya",
] as const;

export type MalaysianState = (typeof MALAYSIAN_STATES)[number];

export function isMalaysianState(value: unknown): value is MalaysianState {
  return (
    typeof value === "string" &&
    (MALAYSIAN_STATES as readonly string[]).includes(value)
  );
}
