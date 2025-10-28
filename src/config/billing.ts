export const WHOP_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL ||
  process.env.WHOP_CHECKOUT_URL ||
  "https://whop.com/embedded-checkout";

export const WHOP_VERIFY_ENDPOINT = "/api/whop/verify";
