import { describe, expect, it } from "vitest";
import { scoreAttractions } from "@/domain/map/scoring/attractions";
import { PlaceId } from "@/domain/common/models";
import { PERSONA_TYPES } from "@/domain/plan/models/Persona";
import { AttractionFixtures } from "./fixtures";

describe("Attraction Scoring Algorithm", () => {
  describe("TC-DISC-003: Scoring Algorithm Validation", () => {
    describe("Quality Score Component", () => {
      it("should calculate quality score with formula: rating (60%) + log10(reviews) (40%)", () => {
        // Given
        const attraction1 = AttractionFixtures.create({
          id: "test-1",
          rating: 4.5,
          userRatingsTotal: 1000,
        });
        const attraction2 = AttractionFixtures.create({
          id: "test-2",
          rating: 5.0,
          userRatingsTotal: 10000,
        });

        // When
        const result1 = scoreAttractions([attraction1], []);
        const result2 = scoreAttractions([attraction2], []);

        // Then
        // (4.5/5 * 60) + (log10(1001)/5 * 40) = 54 + 24.0032 ≈ 78.0
        expect(result1[0].breakdown.qualityScore).toBeCloseTo(78.0, 1);
        // (5.0/5 * 60) + (log10(10001)/5 * 40) = 60 + 32 = 92.0
        expect(result2[0].breakdown.qualityScore).toBeCloseTo(92.0, 1);
      });

      it("should return 0 for missing or zero rating", () => {
        // Given
        const attractionNoRating = AttractionFixtures.create({
          rating: undefined,
          userRatingsTotal: 1000,
        });
        const attractionZeroRating = AttractionFixtures.create({
          rating: 0,
          userRatingsTotal: 1000,
        });

        // When
        const resultNoRating = scoreAttractions([attractionNoRating], []);
        const resultZeroRating = scoreAttractions([attractionZeroRating], []);

        // Then
        expect(resultNoRating[0].breakdown.qualityScore).toBe(0);
        expect(resultZeroRating[0].breakdown.qualityScore).toBe(0);
      });

      it("should return 0 for missing or zero reviews", () => {
        // Given
        const attractionNoReviews = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: undefined,
        });
        const attractionZeroReviews = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: 0,
        });

        // When
        const resultNoReviews = scoreAttractions([attractionNoReviews], []);
        const resultZeroReviews = scoreAttractions([attractionZeroReviews], []);

        // Then
        expect(resultNoReviews[0].breakdown.qualityScore).toBe(0);
        expect(resultZeroReviews[0].breakdown.qualityScore).toBe(0);
      });
    });

    describe("Persona Score Component", () => {
      it("should return 100 when attraction type matches persona", () => {
        // Given
        const attraction = AttractionFixtures.withTypes(["museum", "tourist_attraction"]);

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        expect(result[0].breakdown.personaScore).toBe(100);
      });

      it("should return 10 when attraction type does not match persona", () => {
        // Given
        const attraction = AttractionFixtures.withTypes(["amusement_park", "tourist_attraction"]);

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        expect(result[0].breakdown.personaScore).toBe(10);
      });

      it("should return 10 for FOODIE_TRAVELER persona (restaurants handled separately)", () => {
        // Given
        const attraction = AttractionFixtures.withTypes(["restaurant", "food"]);

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.FOODIE_TRAVELER]);

        // Then
        expect(result[0].breakdown.personaScore).toBe(10);
      });

      it("should return 10 when no persona is provided", () => {
        // Given
        const attraction = AttractionFixtures.withTypes(["museum"]);

        // When
        const result = scoreAttractions([attraction], []);

        // Then
        expect(result[0].breakdown.personaScore).toBe(10);
      });

      it("should use best matching persona when multiple personas provided", () => {
        // Given
        const attraction = AttractionFixtures.withTypes(["museum", "art_gallery"]);

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.ADVENTURE_SEEKER, PERSONA_TYPES.ART_ENTHUSIAST]);

        // Then
        expect(result[0].breakdown.personaScore).toBe(100);
      });
    });

    describe("Diversity Score Component", () => {
      it("should give high score (~66.7) to rare types", () => {
        // Given
        const attractions = [
          AttractionFixtures.withTypes(["museum"], { id: "common-1" }),
          AttractionFixtures.withTypes(["museum"], { id: "common-2" }),
          AttractionFixtures.withTypes(["museum"], { id: "common-3" }),
          AttractionFixtures.withTypes(["sculpture"], { id: "rare-1" }),
        ];

        // When
        const result = scoreAttractions(attractions, []);
        const rareAttraction = result.find((r) => r.attraction.id === PlaceId("rare-1"));

        // Then
        // Formula: 100 - (minFreq/maxFreq)*100 = 100 - (1/3)*100 = 66.7
        expect(rareAttraction?.breakdown.diversityScore).toBeCloseTo(66.7, 1);
      });

      it("should give low score (~0) to common types", () => {
        // Given
        const attractions = [
          AttractionFixtures.withTypes(["museum"], { id: "common-1" }),
          AttractionFixtures.withTypes(["museum"], { id: "common-2" }),
          AttractionFixtures.withTypes(["museum"], { id: "common-3" }),
          AttractionFixtures.withTypes(["sculpture"], { id: "rare-1" }),
        ];

        // When
        const result = scoreAttractions(attractions, []);
        const commonAttraction = result.find((r) => r.attraction.id === PlaceId("common-1"));

        // Then
        // Formula: 100 - (3/3)*100 = 0
        expect(commonAttraction?.breakdown.diversityScore).toBe(0);
      });

      it("should return 0 for single attraction with same type", () => {
        // Given
        const attraction = AttractionFixtures.withTypes(["museum"]);

        // When
        const result = scoreAttractions([attraction], []);

        // Then
        // Formula: 100 - (1/1)*100 = 0
        expect(result[0].breakdown.diversityScore).toBe(0);
      });

      it("should use minimum frequency to reward rare types", () => {
        // Given
        const attractions = [
          AttractionFixtures.withTypes(["museum", "sculpture"], { id: "mixed-1" }),
          AttractionFixtures.withTypes(["museum"], { id: "common-1" }),
          AttractionFixtures.withTypes(["museum"], { id: "common-2" }),
        ];

        // When
        const result = scoreAttractions(attractions, []);
        const mixedAttraction = result.find((r) => r.attraction.id === PlaceId("mixed-1"));

        // Then
        // Uses min frequency (sculpture=1): 100 - (1/3)*100 = 66.7
        expect(mixedAttraction?.breakdown.diversityScore).toBeCloseTo(66.7, 1);
      });
    });

    describe("Confidence Score Component", () => {
      it("should return 100 for >100 reviews", () => {
        // Given
        const attraction = AttractionFixtures.withReviews(150);

        // When
        const result = scoreAttractions([attraction], []);

        // Then
        expect(result[0].breakdown.confidenceScore).toBe(100);
      });

      it("should return 70 for 21-100 reviews", () => {
        // Given
        const attraction = AttractionFixtures.withReviews(50);

        // When
        const result = scoreAttractions([attraction], []);

        // Then
        expect(result[0].breakdown.confidenceScore).toBe(70);
      });

      it("should return 40 for <20 reviews", () => {
        // Given
        const attraction = AttractionFixtures.withReviews(15);

        // When
        const result = scoreAttractions([attraction], []);

        // Then
        expect(result[0].breakdown.confidenceScore).toBe(40);
      });

      it("should return 40 for undefined reviews", () => {
        // Given
        const attraction = AttractionFixtures.create({
          userRatingsTotal: undefined,
        });

        // When
        const result = scoreAttractions([attraction], []);

        // Then
        expect(result[0].breakdown.confidenceScore).toBe(40);
      });
    });

    describe("Weighted Score Calculation", () => {
      it("should apply weights: quality 50%, persona 10%, diversity 20%, confidence 20%", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 5.0,
          userRatingsTotal: 200,
          types: ["museum"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        // qualityScore: ≈78.4, personaScore: 100, diversityScore: 0, confidenceScore: 100
        // Weighted: 78.4*0.5 + 100*0.1 + 0*0.2 + 100*0.2 = 69.2
        expect(result[0].score).toBeCloseTo(69.2, 0);
      });

      it("should calculate final score correctly with known inputs", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: 1000,
          types: ["amusement_park"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        // qualityScore: ≈78.0, personaScore: 10, diversityScore: 0, confidenceScore: 100
        // Weighted: 78*0.5 + 10*0.1 + 0*0.2 + 100*0.2 = 60.0
        expect(result[0].score).toBeCloseTo(60.0, 0);
      });

      it("should sort results descending by score", () => {
        // Given
        const attractions = [
          AttractionFixtures.createLowQuality({ id: "low-score", types: ["park"] }),
          AttractionFixtures.createHighQuality({ id: "high-score", types: ["museum"] }),
          AttractionFixtures.create({ id: "medium-score", rating: 4.0, types: ["art_gallery"] }),
        ];

        // When
        const result = scoreAttractions(attractions, [PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        expect(result[0].attraction.id).toBe(PlaceId("high-score"));
        expect(result[1].attraction.id).toBe(PlaceId("medium-score"));
        expect(result[2].attraction.id).toBe(PlaceId("low-score"));
        expect(result[0].score).toBeGreaterThan(result[1].score);
        expect(result[1].score).toBeGreaterThan(result[2].score);
      });

      it("should round scores to 1 decimal place", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 4.3,
          userRatingsTotal: 73,
          types: ["museum"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        expect(result[0].score).toBe(Math.round(result[0].score * 10) / 10);
        expect(result[0].breakdown.qualityScore).toBe(Math.round(result[0].breakdown.qualityScore * 10) / 10);
      });
    });
  });

  describe("TC-DISC-004: General Tourist Persona Scoring", () => {
    describe("Weight Redistribution", () => {
      it("should increase quality weight to 60% when general_tourist is present", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 5.0,
          userRatingsTotal: 200,
          types: ["museum"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST]);

        // Then
        // qualityScore: ≈78.4, personaScore: 0, diversityScore: 0, confidenceScore: 100
        // Weighted: 78.4*0.6 + 0*0 + 0*0.2 + 100*0.2 = 67.04
        expect(result[0].score).toBeCloseTo(67.0, 0);
      });

      it("should set persona weight to 0% when general_tourist is present", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: 100,
          types: ["museum"],
        });

        // When
        const resultWithPersona = scoreAttractions([attraction], [PERSONA_TYPES.HISTORY_BUFF]);
        const resultWithGeneralTourist = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST]);

        // Then
        expect(resultWithPersona[0].breakdown.personaScore).toBe(100);
        expect(resultWithGeneralTourist[0].breakdown.personaScore).toBeUndefined();
      });

      it("should keep diversity and confidence weights at 20% each", () => {
        // Given
        const attractions = [
          AttractionFixtures.create({ id: "common-type", rating: 4.5, userRatingsTotal: 50, types: ["museum"] }),
          AttractionFixtures.create({ id: "common-type-2", rating: 4.5, userRatingsTotal: 50, types: ["museum"] }),
          AttractionFixtures.create({ id: "rare-type", rating: 4.5, userRatingsTotal: 50, types: ["sculpture"] }),
        ];

        // When
        const result = scoreAttractions(attractions, [PERSONA_TYPES.GENERAL_TOURIST]);
        const rareAttraction = result.find((r) => r.attraction.id === PlaceId("rare-type"));
        const commonAttraction = result.find((r) => r.attraction.id === PlaceId("common-type"));

        // Then
        expect(result[0].breakdown.confidenceScore).toBe(70);
        expect(result[1].breakdown.confidenceScore).toBe(70);
        expect(result[2].breakdown.confidenceScore).toBe(70);
        expect(rareAttraction?.breakdown.diversityScore).toBeGreaterThan(
          commonAttraction?.breakdown.diversityScore ?? 0
        );
      });
    });

    describe("Persona Score Exclusion", () => {
      it("should set personaScore to 0 in calculation", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: 100,
          types: ["museum"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST]);

        // Then
        expect(result[0].breakdown.personaScore).toBeUndefined();
      });

      it("should omit personaScore from breakdown object", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: 100,
          types: ["museum"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST]);

        // Then
        expect("personaScore" in result[0].breakdown).toBe(false);
        expect(result[0].breakdown).toHaveProperty("qualityScore");
        expect(result[0].breakdown).toHaveProperty("diversityScore");
        expect(result[0].breakdown).toHaveProperty("confidenceScore");
      });

      it("should not consider type matching when general_tourist is present", () => {
        // Given
        const museumAttraction = AttractionFixtures.create({
          id: "museum",
          rating: 4.5,
          userRatingsTotal: 100,
          types: ["museum"],
        });
        const parkAttraction = AttractionFixtures.create({
          id: "park",
          rating: 4.5,
          userRatingsTotal: 100,
          types: ["park"],
        });

        // When
        const resultWithPersona = scoreAttractions([museumAttraction, parkAttraction], [PERSONA_TYPES.HISTORY_BUFF]);
        const resultWithGeneralTourist = scoreAttractions(
          [museumAttraction, parkAttraction],
          [PERSONA_TYPES.GENERAL_TOURIST]
        );

        const museumWithPersona = resultWithPersona.find((r) => r.attraction.id === PlaceId("museum"));
        const parkWithPersona = resultWithPersona.find((r) => r.attraction.id === PlaceId("park"));
        const museumWithGeneral = resultWithGeneralTourist.find((r) => r.attraction.id === PlaceId("museum"));
        const parkWithGeneral = resultWithGeneralTourist.find((r) => r.attraction.id === PlaceId("park"));

        // Then
        expect(museumWithPersona?.score).toBeGreaterThan(parkWithPersona?.score ?? 0);
        const scoreDiff = Math.abs((museumWithGeneral?.score ?? 0) - (parkWithGeneral?.score ?? 0));
        expect(scoreDiff).toBeLessThan(10);
      });
    });

    describe("Mixed Personas", () => {
      it("should exclude persona scoring if general_tourist is mixed with other personas", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 4.5,
          userRatingsTotal: 100,
          types: ["museum"],
        });

        // When
        const result = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST, PERSONA_TYPES.HISTORY_BUFF]);

        // Then
        expect(result[0].breakdown.personaScore).toBeUndefined();
      });

      it("should use 60% quality weight even with other personas present", () => {
        // Given
        const attraction = AttractionFixtures.create({
          rating: 5.0,
          userRatingsTotal: 200,
          types: ["museum"],
        });

        // When
        const resultMixed = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST, PERSONA_TYPES.HISTORY_BUFF]);
        const resultGeneral = scoreAttractions([attraction], [PERSONA_TYPES.GENERAL_TOURIST]);

        // Then
        expect(resultMixed[0].score).toBeCloseTo(resultGeneral[0].score, 1);
      });
    });
  });
});
