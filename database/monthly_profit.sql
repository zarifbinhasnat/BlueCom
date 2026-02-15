-- ============================================================================
-- Monthly Profit Tracking Table + Seed Data
-- ============================================================================
-- Run: psql -U your_username -d bluecon -f database/monthly_profit.sql
-- ============================================================================

DROP TABLE IF EXISTS monthly_profit CASCADE;

CREATE TABLE monthly_profit (
    id SERIAL PRIMARY KEY,
    month DATE NOT NULL UNIQUE,         -- first day of the month (e.g. 2026-01-01)
    revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
    profit DECIMAL(14,2) GENERATED ALWAYS AS (revenue - total_cost) STORED
);

COMMENT ON TABLE monthly_profit IS 'Monthly aggregated revenue, costs, and profit for dashboard reporting';

-- Seed with 12 months of sample data (Jan 2025 → Dec 2025)
INSERT INTO monthly_profit (month, revenue, total_cost) VALUES
  ('2025-01-01', 4200.00,  2800.00),
  ('2025-02-01', 5100.00,  3200.00),
  ('2025-03-01', 4800.00,  3000.00),
  ('2025-04-01', 6300.00,  3500.00),
  ('2025-05-01', 7200.00,  3800.00),
  ('2025-06-01', 6800.00,  4100.00),
  ('2025-07-01', 8100.00,  4300.00),
  ('2025-08-01', 9400.00,  4600.00),
  ('2025-09-01', 8800.00,  4900.00),
  ('2025-10-01', 10200.00, 5100.00),
  ('2025-11-01', 11500.00, 5400.00),
  ('2025-12-01', 12800.00, 5800.00),
  ('2026-01-01', 13200.00, 6100.00),
  ('2026-02-01', 14500.00, 6400.00);
