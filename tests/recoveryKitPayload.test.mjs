import assert from "node:assert/strict";
import test from "node:test";
import { omitUndefinedFields } from "../src/services/firestorePayload.ts";

test("recovery-kit payload omits missing optional fields and keeps generated data", () => {
  const payload = {
    cropAnalysisId: "analysis-123",
    estimatedTotalCost: 330,
    recommendations: [
      {
        productName: "Organic Neem Oil",
        category: "Organic Farming Inputs",
        organicCertified: true,
        quantity: 1,
        estimatedPrice: 210,
        suitabilityScore: 96,
        isAvailable: false,
        productId: undefined,
        whyThisProduct: "AI generated recommendation details",
        metadata: { optionalNote: undefined, source: "AI" },
      },
    ],
    timeline: [{ day: "Day 1", title: "Treatment", actions: ["Apply treatment", undefined] }],
  };

  const cleaned = omitUndefinedFields(payload);

  assert.equal(Object.hasOwn(cleaned.recommendations[0], "productId"), false);
  assert.equal(Object.hasOwn(cleaned.recommendations[0].metadata, "optionalNote"), false);
  assert.deepEqual(cleaned.timeline[0].actions, ["Apply treatment"]);
  assert.equal(cleaned.recommendations[0].whyThisProduct, "AI generated recommendation details");
  assert.equal(cleaned.estimatedTotalCost, 330);
  assert.equal(payload.recommendations[0].whyThisProduct, "AI generated recommendation details");
});
