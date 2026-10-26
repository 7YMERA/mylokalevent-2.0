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

// Approximate [minLon, minLat, maxLon, maxLat] bounding boxes for the OSM map
// embed. Coarse on purpose — enough to centre the map on the right region
// without a geocoding service. Malaysia overall is the fallback.
export const MALAYSIA_BBOX: [number, number, number, number] = [
  99.6, 0.8, 119.3, 7.4,
];

export const STATE_BBOX: Record<
  MalaysianState,
  [number, number, number, number]
> = {
  Johor: [102.5, 1.2, 104.4, 2.8],
  Kedah: [99.6, 5.1, 101.1, 6.7],
  Kelantan: [101.3, 4.6, 102.7, 6.25],
  Melaka: [102.1, 2.1, 102.5, 2.5],
  "Negeri Sembilan": [101.6, 2.4, 102.5, 3.2],
  Pahang: [101.3, 2.5, 104.0, 4.8],
  Perak: [100.1, 3.6, 101.8, 5.8],
  Perlis: [100.0, 6.4, 100.4, 6.7],
  "Pulau Pinang": [100.1, 5.1, 100.5, 5.6],
  Sabah: [115.2, 4.0, 119.3, 7.4],
  Sarawak: [109.6, 0.8, 115.6, 5.0],
  Selangor: [100.8, 2.6, 101.9, 3.8],
  Terengganu: [102.5, 3.9, 103.8, 5.9],
  "Kuala Lumpur": [101.6, 3.0, 101.8, 3.25],
  Labuan: [115.1, 5.2, 115.3, 5.4],
  Putrajaya: [101.6, 2.9, 101.75, 3.0],
};
