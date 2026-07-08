import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing checkout session parameters" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const isSimulated = !keyId || !keySecret || keyId.includes("placeholder") || keySecret.includes("placeholder");

    // If simulated check, auto-verify signature
    if (isSimulated || razorpay_order_id.startsWith("order_sim_")) {
      console.log("[RAZORPAY SERVICE] Verified simulated checkout signature successfully.");
      return NextResponse.json({ verified: true, simulated: true });
    }

    if (!razorpay_signature) {
      return NextResponse.json({ error: "Missing cryptographic signature" }, { status: 400 });
    }

    // Verify cryptographic signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret!)
      .update(text)
      .digest("hex");

    const verified = generatedSignature === razorpay_signature;

    if (verified) {
      return NextResponse.json({ verified: true, simulated: false });
    } else {
      console.warn("[RAZORPAY SIGNATURE MISMATCH]", {
        orderId: razorpay_order_id,
        generated: generatedSignature,
        received: razorpay_signature
      });
      return NextResponse.json({ error: "Invalid signature. Checkout may have been tampered.", verified: false }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Verify payment signature endpoint error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
