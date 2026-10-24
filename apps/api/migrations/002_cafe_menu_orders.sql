CREATE TABLE cafe_menu_items (
  id uuid PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES venues(id),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  category text NOT NULL CHECK (length(category) BETWEEN 1 AND 60),
  price_rials integer NOT NULL CHECK (price_rials BETWEEN 10 AND 1000000000 AND price_rials % 10=0),
  is_available boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,venue_id)
);
ALTER TABLE reservations ADD CONSTRAINT reservations_id_venue UNIQUE(id,venue_id);
CREATE TABLE cafe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE,
  venue_id uuid NOT NULL REFERENCES venues(id), reservation_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('placed','preparing','ready','served','cancelled')),
  total_rials bigint NOT NULL CHECK (total_rials BETWEEN 10 AND 400000000000),
  created_by uuid NOT NULL REFERENCES staff_users(id),
  command_key text NOT NULL, request_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(reservation_id,venue_id) REFERENCES reservations(id,venue_id),
  UNIQUE(venue_id,command_key), UNIQUE(id,venue_id)
);
CREATE INDEX cafe_orders_venue_date ON cafe_orders(venue_id,created_at);
CREATE TABLE cafe_order_lines (
  order_id uuid NOT NULL, venue_id uuid NOT NULL, menu_item_id uuid NOT NULL,
  name text NOT NULL, quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_price_rials integer NOT NULL CHECK (unit_price_rials>0),
  PRIMARY KEY(order_id,menu_item_id),
  FOREIGN KEY(order_id,venue_id) REFERENCES cafe_orders(id,venue_id),
  FOREIGN KEY(menu_item_id,venue_id) REFERENCES cafe_menu_items(id,venue_id)
);
CREATE TABLE cafe_order_commands (
  order_id uuid NOT NULL REFERENCES cafe_orders(id), command_key text NOT NULL,
  request_hash text NOT NULL, result jsonb NOT NULL,
  PRIMARY KEY(order_id,command_key)
);
CREATE TABLE cafe_order_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id uuid NOT NULL REFERENCES cafe_orders(id),
  status text NOT NULL, staff_user_id uuid NOT NULL REFERENCES staff_users(id), occurred_at timestamptz NOT NULL DEFAULT now()
);
