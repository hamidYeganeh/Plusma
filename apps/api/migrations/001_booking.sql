CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL
);
CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  slug text NOT NULL UNIQUE, name text NOT NULL, time_zone text NOT NULL DEFAULT 'Asia/Tehran',
  opens_at time NOT NULL DEFAULT '10:00', closes_at time NOT NULL DEFAULT '23:00',
  duration_minutes integer NOT NULL DEFAULT 90 CHECK (duration_minutes BETWEEN 30 AND 240),
  slot_minutes integer NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 15 AND 120),
  CHECK (closes_at > opens_at), UNIQUE (id, organization_id)
);
CREATE TABLE staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
  name text NOT NULL, password_hash text NOT NULL
);
CREATE TABLE memberships (
  user_id uuid NOT NULL REFERENCES staff_users(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  role text NOT NULL CHECK (role IN ('owner','staff')),
  PRIMARY KEY (user_id, organization_id)
);
CREATE TABLE venue_permissions (
  user_id uuid NOT NULL, organization_id uuid NOT NULL, venue_id uuid NOT NULL,
  PRIMARY KEY (user_id, venue_id),
  FOREIGN KEY (user_id, organization_id) REFERENCES memberships(user_id, organization_id),
  FOREIGN KEY (venue_id, organization_id) REFERENCES venues(id, organization_id)
);
CREATE TABLE staff_sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES staff_users(id),
  expires_at timestamptz NOT NULL
);
CREATE INDEX staff_sessions_expiry ON staff_sessions(expires_at);
CREATE TABLE cafe_tables (
  venue_id uuid NOT NULL REFERENCES venues(id), table_id integer NOT NULL CHECK (table_id > 0),
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 50), zone text NOT NULL,
  PRIMARY KEY (venue_id, table_id)
);
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE,
  venue_id uuid NOT NULL, table_id integer NOT NULL,
  guests integer NOT NULL CHECK (guests BETWEEN 1 AND 50),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  status text NOT NULL CHECK (status IN ('held','confirmed','checked_in','cancelled','expired')),
  expires_at timestamptz NOT NULL,
  guest_name text, guest_phone text, token_hash text NOT NULL,
  hold_key text NOT NULL, request_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (venue_id, table_id) REFERENCES cafe_tables(venue_id, table_id),
  UNIQUE (venue_id, hold_key),
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    venue_id WITH =, table_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('held','confirmed','checked_in'))
);
CREATE INDEX reservations_venue_day ON reservations(venue_id, starts_at);
CREATE TABLE reservation_commands (
  reservation_id uuid NOT NULL REFERENCES reservations(id),
  action text NOT NULL, key text NOT NULL, request_hash text NOT NULL, result jsonb NOT NULL,
  PRIMARY KEY (reservation_id, action, key)
);
CREATE TABLE reservation_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES reservations(id),
  action text NOT NULL, staff_user_id uuid REFERENCES staff_users(id), occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE request_limits (
  bucket text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), hits integer NOT NULL
);
