-- Tighten Realtime policy: drop wildcard postgres_changes access so users
-- can only subscribe to their own user:<uid> topics.
DROP POLICY IF EXISTS "User-scoped realtime topics" ON realtime.messages;

CREATE POLICY "User-scoped realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
);