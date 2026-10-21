import { describe, expect, it } from "vitest";
import { checkPayment } from "@/lib/checks/paymentCheck";

describe("checkPayment", () => {
  it("flags a mobile wallet payment", () => {
    const result = checkPayment("Ali Khan", "JazzCash transfer", "University of Oxford");
    expect(result.flag).toBe("PERSONAL_OR_WALLET_PAYMENT");
  });

  it("flags a cash payment", () => {
    const result = checkPayment("University of Oxford", "cash at our office", "University of Oxford");
    expect(result.flag).toBe("CASH_PAYMENT");
  });

  it("flags a payee that is not the institution", () => {
    const result = checkPayment("Ahmed Consultants Pvt Ltd", "bank transfer", "University of Oxford");
    expect(result.flag).toBe("PERSONAL_OR_WALLET_PAYMENT");
  });

  it("passes a bank transfer to the institution itself", () => {
    const result = checkPayment("University of Oxford", "bank transfer", "University of Oxford");
    expect(result.flag).toBeNull();
  });
});
