# Architecture rules

- Keep the customer overview at `/dashboard`, with user-scoped reads of existing tables and database RLS as the authorization boundary, so no parallel customer data store is needed.
- Keep operational role hubs separate from the customer overview and link only to hubs matching server-sourced roles, so existing workflows remain intact.
- Route `/payouts` to the existing owner hub, which owns payout accounts and payout history, rather than importing a nonexistent payout page.
- Keep static sitewide metadata in `index.html` and route canonicals in the shared Helmet SEO component, so canonical tags are not duplicated.