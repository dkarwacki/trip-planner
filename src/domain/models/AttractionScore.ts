import type { Attraction } from "./Attraction";

export interface AttractionScore {
  attraction: Attraction;
  score: number;
  breakdown: {
    qualityScore: number;
    diversityScore: number;
    localityScore: number;
  };
}
