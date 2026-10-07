# Owners, Lenders, Drivers, Payouts, Verification, Messaging

Everything is added on top of the current site. Nothing that works today is removed.

## 1. Car owners (improve the Owner hub)
- Tabs: Listings, Bookings, Calendar (blocked dates per car), Earnings, Verification.
- Owners can block dates when the car isn't available. Bookings can't use those dates.

## 2. Owner verification
- Owners upload their national ID, driving licence and logbook (stored privately).
- Status: not submitted → pending → approved / rejected, with a reason if rejected.
- Rental listings only go public after the owner is approved. Admin gets a "Verifications" tab to review files and approve or reject.

## 3. Owner earnings and payouts
- Earnings: completed, paid bookings showing the 70% owner share plus delivery fees, against your 30%.
- Owners save their M-Pesa payout number.
- Admin "Payouts" tab: see what each owner is owed, and mark a payout sent with its M-Pesa code. The owner sees payout history.

## 4. Lender portal (car loans)
- New "lender" role and a `/lender` page.
- Lenders see submitted finance applications, review them, and approve or decline with an offered rate and term and a note.
- Applicants see the decision on their Account page and get a notification.
- Admin can grant the lender role from the existing Roles tab.

## 5. Driver hire
- Drivers sign up with the existing "driver" role, set a daily rate and upload their licence. Admin approves them, using the same verification flow.
- When booking a rental, the renter can tick "Add a driver". The driver's daily rate is added to the price.
- The owner or admin assigns an available approved driver. The driver gets a `/driver` page with assigned trips and earnings.

## 6. Messaging
- A conversation per booking, finance application or vehicle enquiry between the people involved.
- A `/messages` inbox page with an unread count in the header, updated live.
- New messages trigger a notification.

## Technical details
- New tables: `owner_verifications`, `vehicle_blocked_dates`, `payout_accounts`, `payouts`, `lender_decisions`, `driver_profiles`, `booking_drivers`, `conversations`, `conversation_participants`, `messages`. All have grants and RLS, and only the people involved can read them. Admin access uses `has_role`.
- Add `lender` to the `app_role` enum. Add nullable `driver_fee` (default 0) and `with_driver` columns to bookings. Extend `protect_booking_financials` to cover `driver_fee`.
- A private storage bucket `verification-docs` scoped per user folder. Admins can read all files.
- Extend `validate_booking_insert` to reject blocked dates. Public rental listings filtered to approved owners, through the existing public view and policy.
- Notification triggers for lender decisions, payouts, driver assignment and new messages. Realtime on `messages`.
- New pages: `/lender`, `/driver`, `/messages`. Owner hub tabs. Admin gets Verifications and Payouts tabs. Signup gets Lender and Driver choices. Header links shown by role.
- After building: run a security scan and test the main flows in a browser.
