// Central place for the platform's manual payment instructions.
// To change the payout phone or add bank info later, edit this file only.
export const PAYMENT_INSTRUCTIONS = {
  method: "M-Pesa / Mobile Money",
  phone: "0706075259",
  name: "AurumDrive",
  steps: [
    "Open your mobile money app (M-Pesa, Airtel Money, etc.).",
    "Send the total amount to the number above.",
    "Copy the transaction reference / M-Pesa code from the confirmation SMS.",
    "Paste it below and submit \u2014 the host will confirm payment shortly.",
  ],
};
