import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const { userId, clientAmount } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // 1. Fetch user's cart from Firestore
    let calculatedGrandTotal = clientAmount;
    try {
      const cartRef = doc(db, "carts", userId);
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        const items = cartSnap.data().items || [];
        if (items.length > 0) {
          // Validate amounts server-side by loading original product prices
          let subtotal = 0;
          const groupedBySeller: Record<string, number> = {};

          for (const item of items) {
            const prodRef = doc(db, "products", item.productId);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const product = prodSnap.data();
              const itemSubtotal = (product.price || 0) * item.quantity;
              subtotal += itemSubtotal;

              const sellerId = product.sellerId || "default_seller";
              groupedBySeller[sellerId] = (groupedBySeller[sellerId] || 0) + itemSubtotal;
            }
          }

          // Calculate delivery charge per seller
          let deliveryCharge = 0;
          for (const sellerId in groupedBySeller) {
            const sellerSubtotal = groupedBySeller[sellerId];
            deliveryCharge += sellerSubtotal >= 500 ? 0 : 50;
          }

          const gst = subtotal * 0.05;
          const serverCalculated = subtotal + gst + deliveryCharge;

          if (serverCalculated > 0) {
            calculatedGrandTotal = serverCalculated;

            // Check for client amount mismatch / tampering
            if (clientAmount && Math.abs(serverCalculated - clientAmount) > 1.0) {
              return NextResponse.json({
                error: "Order amount mismatch. Possible price tampering detected.",
                serverCalculated: serverCalculated,
                clientSubmitted: clientAmount
              }, { status: 400 });
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("[RAZORPAY VALIDATION FALLBACK] Server-side Firestore read restricted (unauthenticated session). Falling back to client-submitted totals.", e.message || e);
    }

    // 3. Initialize Razorpay Order
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const isSimulated = !keyId || !keySecret || keyId.includes("placeholder") || keySecret.includes("placeholder");
    const amountInPaise = Math.round(calculatedGrandTotal * 100);
    const receiptId = `rcpt_${userId.slice(0, 6)}_${Date.now()}`;

    if (isSimulated) {
      console.log("[RAZORPAY SERVICE] Running in Simulated secure checkout mode.");
      return NextResponse.json({
        id: `order_sim_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        simulated: true,
        key: "rzp_test_placeholder"
      });
    }

    // Call Razorpay API
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        notes: { userId }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[RAZORPAY ERROR]", errText);
      return NextResponse.json({ error: "Failed to initialize Razorpay transaction" }, { status: 502 });
    }

    const rzpOrder = await response.json();
    return NextResponse.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      simulated: false,
      key: keyId
    });

  } catch (error: any) {
    console.error("Create order endpoint error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
