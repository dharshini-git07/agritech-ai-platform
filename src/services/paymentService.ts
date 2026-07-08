/**
 * PaymentService.ts
 * Frontend service to load Razorpay SDK, communicate with backend routes,
 * and manage Checkout popup options.
 */

export const PaymentService = {
  /**
   * Dynamically loads the external Razorpay Checkout SDK script
   */
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      // If already loaded, return true
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay Checkout script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  /**
   * Requests backend API to create a Razorpay order session
   */
  async createRazorpayOrder(userId: string, clientAmount: number): Promise<any> {
    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, clientAmount }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create order session.");
    }

    return response.json();
  },

  /**
   * Requests backend verification of transaction details
   */
  async verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature?: string
  ): Promise<boolean> {
    const response = await fetch("/api/payments/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Verification rejected.");
    }

    const data = await response.json();
    return !!data.verified;
  },
};
