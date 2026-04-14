export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export const derivePaymentStatus = (
  expectedAmount: number,
  receivedAmount: number,
): PaymentStatus => {
  if (receivedAmount <= 0) {
    return "UNPAID";
  }

  if (receivedAmount >= expectedAmount) {
    return "PAID";
  }

  return "PARTIAL";
};

export const calculateRemaining = (
  expectedAmount: number,
  receivedAmount: number,
) => {
  return Math.max(expectedAmount - receivedAmount, 0);
};
