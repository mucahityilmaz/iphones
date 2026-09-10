-- Subscribers for the preorder reminder list.
--
-- There is no confirmation email, so `consent_text_version` is the only record of
-- what the person actually agreed to. It stores the version constant from
-- src/config/consent.ts; never edit CONSENT_TEXT without bumping CONSENT_VERSION,
-- or old rows will claim consent to wording that was never shown.

CREATE TABLE IF NOT EXISTS subscribers (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  -- normalised (trimmed + lowercased) before insert so UNIQUE actually holds
  email                TEXT NOT NULL UNIQUE,
  consent_text_version TEXT NOT NULL,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ip                   TEXT,
  user_agent           TEXT,
  -- NULL means still subscribed
  unsubscribed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_created_at
  ON subscribers (created_at);

-- Partial index: the export and any future send only ever ask for active rows.
CREATE INDEX IF NOT EXISTS idx_subscribers_active
  ON subscribers (unsubscribed_at)
  WHERE unsubscribed_at IS NULL;
