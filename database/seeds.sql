-- ============================================================================
-- Bluecon Aquaculture Management System - Sample Data (Seeds)
-- ============================================================================
-- PostgreSQL 14+
-- Purpose: Realistic aquarium fish farm data with BD-based fish stores
-- Dataset Size:
--   - 4 farms, 12 tanks, 8 species (freshwater aquarium fish)
--   - 25 batches with financials
--   - 120 feeding logs, 30 health logs, 40 water logs
--   - 8 customers (Katabon & Gazipur fish stores), 12 orders, 30 order items
--   - 8 shipments, 20 shipment details
-- ============================================================================

-- Clear existing data (in reverse dependency order)
TRUNCATE TABLE shipment_certification, shipment_detail, shipment, order_item, customer_order, customer RESTART IDENTITY CASCADE;
TRUNCATE TABLE alert, health_log, feeding_log, water_log, batch_financials, batch RESTART IDENTITY CASCADE;
TRUNCATE TABLE tank, farm, species RESTART IDENTITY CASCADE;

-- ============================================================================
-- MASTER DATA: Species (Freshwater Aquarium Fish)
-- ============================================================================

INSERT INTO species (common_name, scientific_name, description, target_profit_margin, ideal_temp_min, ideal_temp_max, ideal_ph_min, ideal_ph_max) VALUES
('Discus', 'Symphysodon aequifasciatus', 'King of the aquarium. Vibrant colors, disc-shaped body. High value ornamental fish', 1.60, 28.0, 30.0, 6.0, 7.0),
('Guppy', 'Poecilia reticulata', 'Hardy livebearer, prolific breeder, wide color variety. Beginner-friendly', 1.40, 24.0, 28.0, 6.8, 7.8),
('Molly', 'Poecilia sphenops', 'Peaceful livebearer, many color morphs including dalmatian and balloon', 1.35, 24.0, 28.0, 7.0, 8.0),
('Angelfish', 'Pterophyllum scalare', 'Elegant freshwater cichlid with tall fins, graceful swimmer', 1.50, 26.0, 30.0, 6.0, 7.5),
('Goldfish', 'Carassius auratus', 'Classic ornamental, many varieties (Oranda, Ryukin). Cold-water tolerant', 1.30, 18.0, 24.0, 6.5, 7.5),
('Ranchu', 'Carassius auratus var. ranchu', 'Premium Japanese-style fancy goldfish. Lionhead shape, no dorsal fin', 1.70, 18.0, 22.0, 7.0, 7.5),
('Betta', 'Betta splendens', 'Siamese fighting fish. Brilliant colors, flowing fins. High demand', 1.45, 26.0, 30.0, 6.5, 7.5),
('Corydoras', 'Corydoras paleatus', 'Peaceful bottom-dweller catfish, great community tank addition', 1.35, 22.0, 26.0, 6.0, 7.5);

-- ============================================================================
-- MASTER DATA: Farms
-- ============================================================================

INSERT INTO farm (farm_name, location, license_number, manager_name, phone, total_capacity_liters, established_date) VALUES
('Katabon Aqua Breeding', 'Katabon, Dhaka', 'BFRI-DH-2018-0421', 'Rafiqul Islam', '+880-1711-123456', 250000.00, '2018-03-15'),
('Gazipur Ornamental Fish Farm', 'Tongi, Gazipur', 'BFRI-GZ-2019-0187', 'Shahidul Haque', '+880-1811-234567', 400000.00, '2019-06-20'),
('Savar Aquarium Fish Center', 'Savar, Dhaka', 'BFRI-DH-2017-0095', 'Kamrul Hassan', '+880-1911-345678', 320000.00, '2017-01-10'),
('Uttara Fish Breeding Lab', 'Uttara Sector 11, Dhaka', 'BFRI-DH-2020-0312', 'Tahmina Akter', '+880-1611-456789', 180000.00, '2020-08-05');

-- ============================================================================
-- MASTER DATA: Tanks (3 per farm = 12 total)
-- ============================================================================

INSERT INTO tank (farm_id, tank_name, tank_type, volume_liters, is_active) VALUES
-- Katabon Aqua Breeding (farm_id: 1)
(1, 'Discus-A1', 'Recirculating', 5000.00, TRUE),
(1, 'Community-A2', 'Recirculating', 8000.00, TRUE),
(1, 'Nursery-A3', 'Pond', 3000.00, TRUE),

-- Gazipur Ornamental Fish Farm (farm_id: 2)
(2, 'Breeding-B1', 'Pond', 12000.00, TRUE),
(2, 'Grow-out-B2', 'Pond', 15000.00, TRUE),
(2, 'Quarantine-B3', 'Quarantine', 2500.00, FALSE),

-- Savar Aquarium Fish Center (farm_id: 3)
(3, 'Premium-C1', 'Recirculating', 10000.00, TRUE),
(3, 'Livebearer-C2', 'Recirculating', 9000.00, TRUE),
(3, 'Goldfish-C3', 'Pond', 6000.00, TRUE),

-- Uttara Fish Breeding Lab (farm_id: 4)
(4, 'Betta-D1', 'Recirculating', 4000.00, TRUE),
(4, 'Fancy-D2', 'Flow-through', 7000.00, TRUE),
(4, 'Fry-D3', 'Pond', 5500.00, TRUE);

-- ============================================================================
-- OPERATIONAL DATA: Batches (25 batches with varied status)
-- ============================================================================

INSERT INTO batch (species_id, tank_id, birth_date, initial_quantity, current_quantity, stage, estimated_harvest_date) VALUES
-- Active batches (currently growing)
(1, 1, '2025-11-01', 200, 188, 'Adult', '2026-03-01'),        -- Discus
(2, 2, '2025-12-15', 1500, 1460, 'Juvenile', '2026-04-15'),   -- Guppy
(3, 5, '2025-10-20', 2000, 1920, 'Adult', '2026-02-20'),      -- Molly
(4, 3, '2026-01-05', 300, 300, 'Fry', '2026-05-05'),          -- Angelfish (just started)
(7, 10, '2025-12-01', 800, 760, 'Juvenile', '2026-03-15'),    -- Betta

(2, 4, '2025-11-20', 3000, 2850, 'Adult', '2026-03-20'),      -- Guppy (large batch)
(8, 7, '2025-12-10', 1200, 1150, 'Juvenile', '2026-04-10'),   -- Corydoras
(3, 8, '2025-10-15', 2500, 2400, 'Adult', '2026-02-15'),      -- Molly
(5, 9, '2025-11-25', 400, 380, 'Juvenile', '2026-03-25'),     -- Goldfish
(6, 11, '2025-12-20', 150, 140, 'Juvenile', '2026-04-01'),    -- Ranchu

(4, 2, '2025-11-30', 500, 470, 'Adult', '2026-03-30'),        -- Angelfish
(1, 7, '2025-12-05', 180, 170, 'Juvenile', '2026-04-05'),     -- Discus

-- Ready for sale batches
(2, 5, '2025-08-01', 2500, 2400, 'Ready for Sale', '2025-12-01'),   -- Guppy
(5, 9, '2025-07-15', 600, 560, 'Ready for Sale', '2025-11-15'),     -- Goldfish
(7, 10, '2025-08-20', 700, 650, 'Ready for Sale', '2025-12-20'),    -- Betta

-- Completed batches (fully sold)
(1, 1, '2025-05-10', 250, 0, 'Adult', '2025-09-10'),     -- Discus
(8, 3, '2025-04-15', 1000, 0, 'Adult', '2025-08-15'),    -- Corydoras
(2, 4, '2025-06-01', 3500, 0, 'Adult', '2025-10-01'),    -- Guppy
(6, 11, '2025-05-20', 120, 0, 'Adult', '2025-09-20'),    -- Ranchu
(3, 8, '2025-07-01', 2000, 0, 'Adult', '2025-11-01'),    -- Molly

-- Problematic batches (high mortality)
(1, 7, '2025-10-01', 200, 128, 'Juvenile', '2026-02-01'),   -- Discus 36% loss
(4, 2, '2025-11-10', 400, 280, 'Juvenile', '2026-03-10'),   -- Angelfish 30% loss
(6, 11, '2025-10-25', 100, 70, 'Juvenile', '2026-02-25'),   -- Ranchu 30% loss

-- Recent batches with minimal activity
(3, 3, '2026-01-15', 1800, 1800, 'Fry', '2026-05-15'),   -- Molly fry
(7, 12, '2026-01-10', 600, 600, 'Fry', '2026-04-25');     -- Betta fry

-- ============================================================================
-- OPERATIONAL DATA: Batch Financials (1:1 with batches)
-- ============================================================================

INSERT INTO batch_financials (batch_id, total_feed_cost, total_labor_cost, water_electricity_cost, medication_cost) VALUES
-- Active batches
(1, 2800.00, 1500.00, 500.00, 120.00),     -- Discus (high value, moderate cost)
(2, 800.00, 400.00, 200.00, 50.00),         -- Guppy (low cost per fish)
(3, 1200.00, 600.00, 300.00, 80.00),        -- Molly
(4, 350.00, 200.00, 100.00, 0.00),          -- Angelfish (just started)
(5, 1800.00, 900.00, 350.00, 100.00),       -- Betta

(6, 1600.00, 800.00, 400.00, 100.00),       -- Guppy large batch
(7, 1500.00, 700.00, 300.00, 80.00),        -- Corydoras
(8, 1400.00, 700.00, 350.00, 60.00),        -- Molly
(9, 900.00, 450.00, 200.00, 50.00),         -- Goldfish
(10, 3200.00, 1600.00, 600.00, 150.00),     -- Ranchu (premium, high cost)

(11, 1100.00, 550.00, 250.00, 60.00),       -- Angelfish
(12, 2600.00, 1300.00, 450.00, 100.00),     -- Discus

-- Ready for sale (full cost)
(13, 1400.00, 700.00, 350.00, 80.00),       -- Guppy
(14, 1800.00, 900.00, 400.00, 100.00),      -- Goldfish
(15, 2200.00, 1100.00, 400.00, 120.00),     -- Betta

-- Completed batches
(16, 4500.00, 2200.00, 800.00, 200.00),     -- Discus PROFITABLE
(18, 1800.00, 900.00, 450.00, 100.00),      -- Guppy PROFITABLE
(20, 1200.00, 600.00, 300.00, 80.00),       -- Molly PROFITABLE

(17, 1300.00, 650.00, 300.00, 100.00),      -- Corydoras BREAK-EVEN

(19, 4800.00, 2400.00, 900.00, 1200.00),    -- Ranchu LOSS (high medication)

-- Problematic batches
(21, 5500.00, 2800.00, 900.00, 3200.00),    -- Discus 36% died, HIGH medication
(22, 2200.00, 1100.00, 400.00, 1500.00),    -- Angelfish 30% died
(23, 3800.00, 1900.00, 700.00, 2000.00),    -- Ranchu 30% died

-- Recent batches
(24, 180.00, 100.00, 60.00, 0.00),
(25, 250.00, 120.00, 70.00, 0.00);

-- ============================================================================
-- OPERATIONAL DATA: Feeding Logs
-- ============================================================================

INSERT INTO feeding_log (batch_id, feed_time, amount_grams, food_type, cost_per_kg, notes) VALUES
-- Batch 1 (Discus) - Premium feeding
(1, '2025-11-02 08:00:00', 200, 'Beefheart Mix', 850.00, 'First feeding — discus beefheart'),
(1, '2025-11-02 16:00:00', 200, 'Beefheart Mix', 850.00, 'Evening feed'),
(1, '2025-11-10 08:00:00', 250, 'Hikari Discus Bio-Gold', 1200.00, 'Switched to pellets'),
(1, '2025-11-10 16:00:00', 250, 'Hikari Discus Bio-Gold', 1200.00, NULL),
(1, '2025-11-20 08:00:00', 280, 'Beefheart Mix', 850.00, NULL),
(1, '2025-11-20 16:00:00', 280, 'Beefheart Mix', 850.00, NULL),
(1, '2025-12-01 08:00:00', 300, 'Hikari Discus Bio-Gold', 1200.00, NULL),
(1, '2025-12-01 16:00:00', 300, 'Hikari Discus Bio-Gold', 1200.00, NULL),
(1, '2025-12-15 08:00:00', 320, 'Bloodworm (frozen)', 950.00, 'Color enhancement feeding'),
(1, '2025-12-15 16:00:00', 320, 'Bloodworm (frozen)', 950.00, NULL),
(1, '2026-01-01 08:00:00', 340, 'Beefheart Mix', 850.00, NULL),
(1, '2026-01-01 16:00:00', 340, 'Beefheart Mix', 850.00, NULL),

-- Batch 2 (Guppy) - Basic flake feeding
(2, '2025-12-16 08:00:00', 150, 'Tropical Flake', 320.00, NULL),
(2, '2025-12-16 16:00:00', 150, 'Tropical Flake', 320.00, NULL),
(2, '2026-01-01 08:00:00', 180, 'Tropical Flake', 320.00, NULL),
(2, '2026-01-01 16:00:00', 180, 'Tropical Flake', 320.00, NULL),

-- Batch 3 (Molly) - Mixed feeding
(3, '2025-10-21 07:00:00', 300, 'Algae Wafer', 280.00, NULL),
(3, '2025-10-21 15:00:00', 300, 'Tropical Flake', 320.00, NULL),
(3, '2025-11-05 07:00:00', 350, 'Spirulina Flake', 380.00, NULL),
(3, '2025-11-05 15:00:00', 350, 'Spirulina Flake', 380.00, NULL),
(3, '2025-11-20 07:00:00', 380, 'Spirulina Flake', 380.00, NULL),
(3, '2025-11-20 15:00:00', 380, 'Spirulina Flake', 380.00, NULL),
(3, '2025-12-05 07:00:00', 400, 'Tropical Flake', 320.00, NULL),
(3, '2025-12-05 15:00:00', 400, 'Tropical Flake', 320.00, NULL),
(3, '2025-12-20 07:00:00', 420, 'Spirulina Flake', 380.00, NULL),
(3, '2025-12-20 15:00:00', 420, 'Spirulina Flake', 380.00, NULL),
(3, '2026-01-10 07:00:00', 440, 'Tropical Flake', 320.00, NULL),
(3, '2026-01-10 15:00:00', 440, 'Tropical Flake', 320.00, NULL),

-- Batch 5 (Betta) - Specialized
(5, '2025-12-02 06:00:00', 80, 'Betta Pellet', 750.00, 'High-protein micro pellet'),
(5, '2025-12-02 18:00:00', 80, 'Bloodworm (frozen)', 950.00, NULL),
(5, '2025-12-12 06:00:00', 90, 'Betta Pellet', 750.00, NULL),
(5, '2025-12-12 18:00:00', 90, 'Bloodworm (frozen)', 950.00, NULL),
(5, '2025-12-22 06:00:00', 100, 'Betta Pellet', 750.00, NULL),
(5, '2025-12-22 18:00:00', 100, 'Daphnia (live)', 600.00, NULL),
(5, '2026-01-05 06:00:00', 110, 'Betta Pellet', 750.00, NULL),
(5, '2026-01-05 18:00:00', 110, 'Bloodworm (frozen)', 950.00, NULL),

-- Batch 6 (Guppy large)
(6, '2025-11-21 07:30:00', 400, 'Tropical Flake', 320.00, NULL),
(6, '2025-11-21 17:30:00', 400, 'Tropical Flake', 320.00, NULL),
(6, '2025-12-10 07:30:00', 450, 'Tropical Flake', 320.00, NULL),
(6, '2025-12-10 17:30:00', 450, 'Micro Pellet', 420.00, NULL),
(6, '2026-01-05 07:30:00', 480, 'Tropical Flake', 320.00, NULL),
(6, '2026-01-05 17:30:00', 480, 'Tropical Flake', 320.00, NULL),

-- Batch 7 (Corydoras)
(7, '2025-12-11 08:00:00', 200, 'Sinking Pellet', 350.00, NULL),
(7, '2025-12-11 16:00:00', 200, 'Algae Wafer', 280.00, NULL),
(7, '2026-01-01 08:00:00', 220, 'Sinking Pellet', 350.00, NULL),
(7, '2026-01-01 16:00:00', 220, 'Bloodworm (frozen)', 950.00, NULL),

-- Batch 8 (Molly)
(8, '2025-10-16 07:00:00', 350, 'Spirulina Flake', 380.00, NULL),
(8, '2025-10-16 15:00:00', 350, 'Spirulina Flake', 380.00, NULL),
(8, '2025-11-05 07:00:00', 380, 'Tropical Flake', 320.00, NULL),
(8, '2025-11-05 15:00:00', 380, 'Tropical Flake', 320.00, NULL),
(8, '2025-12-01 07:00:00', 400, 'Spirulina Flake', 380.00, NULL),
(8, '2025-12-01 15:00:00', 400, 'Spirulina Flake', 380.00, NULL),

-- Batch 9 (Goldfish)
(9, '2025-11-26 08:00:00', 200, 'Goldfish Pellet', 300.00, NULL),
(9, '2025-11-26 16:00:00', 200, 'Goldfish Pellet', 300.00, NULL),
(9, '2025-12-15 08:00:00', 220, 'Goldfish Pellet', 300.00, NULL),
(9, '2025-12-15 16:00:00', 220, 'Blanched Peas', 80.00, 'Fiber supplement'),

-- Batch 10 (Ranchu) - Premium
(10, '2025-12-21 06:00:00', 120, 'Saki-Hikari Fancy Goldfish', 1500.00, 'Premium Japanese feed'),
(10, '2025-12-21 18:00:00', 120, 'Saki-Hikari Fancy Goldfish', 1500.00, NULL),
(10, '2026-01-10 06:00:00', 130, 'Saki-Hikari Fancy Goldfish', 1500.00, NULL),
(10, '2026-01-10 18:00:00', 130, 'Bloodworm (frozen)', 950.00, NULL),

-- Batch 11 (Angelfish)
(11, '2025-12-01 08:00:00', 150, 'Cichlid Pellet', 450.00, NULL),
(11, '2025-12-01 16:00:00', 150, 'Bloodworm (frozen)', 950.00, NULL),
(11, '2026-01-01 08:00:00', 170, 'Cichlid Pellet', 450.00, NULL),
(11, '2026-01-01 16:00:00', 170, 'Brine Shrimp (frozen)', 880.00, NULL),

-- Batch 12 (Discus)
(12, '2025-12-06 07:00:00', 180, 'Beefheart Mix', 850.00, NULL),
(12, '2025-12-06 15:00:00', 180, 'Hikari Discus Bio-Gold', 1200.00, NULL),
(12, '2026-01-05 07:00:00', 200, 'Beefheart Mix', 850.00, NULL),
(12, '2026-01-05 15:00:00', 200, 'Bloodworm (frozen)', 950.00, NULL),

-- Harvesting batches
(13, '2025-11-20 08:00:00', 350, 'Tropical Flake', 320.00, NULL),
(13, '2025-12-10 08:00:00', 350, 'Tropical Flake', 320.00, NULL),

(14, '2025-11-15 08:00:00', 250, 'Goldfish Pellet', 300.00, NULL),
(14, '2025-12-05 08:00:00', 250, 'Goldfish Pellet', 300.00, NULL),

(15, '2025-11-25 07:00:00', 100, 'Betta Pellet', 750.00, NULL),
(15, '2025-12-15 07:00:00', 100, 'Betta Pellet', 750.00, NULL),

-- Problematic batches (reduced feeding)
(21, '2025-10-15 08:00:00', 200, 'Beefheart Mix', 850.00, NULL),
(21, '2025-11-01 08:00:00', 180, 'Hikari Discus Bio-Gold', 1200.00, 'Reduced — disease outbreak'),
(21, '2025-11-20 08:00:00', 160, 'Beefheart Mix', 850.00, NULL),
(21, '2025-12-10 08:00:00', 140, 'Hikari Discus Bio-Gold', 1200.00, NULL),

(22, '2025-11-11 08:00:00', 120, 'Cichlid Pellet', 450.00, NULL),
(22, '2025-12-01 08:00:00', 100, 'Cichlid Pellet', 450.00, 'Bacterial infection'),
(22, '2025-12-20 08:00:00', 90, 'Cichlid Pellet', 450.00, NULL),

(23, '2025-10-26 08:00:00', 100, 'Saki-Hikari Fancy Goldfish', 1500.00, NULL),
(23, '2025-11-15 08:00:00', 80, 'Saki-Hikari Fancy Goldfish', 1500.00, NULL),
(23, '2025-12-05 08:00:00', 70, 'Goldfish Pellet', 300.00, NULL),

-- Recent batches (just started)
(24, '2026-01-16 07:00:00', 250, 'Tropical Flake', 320.00, 'Molly fry initial feeding'),
(24, '2026-01-16 15:00:00', 250, 'Micro Worm (live)', 500.00, NULL),

(25, '2026-01-11 06:00:00', 60, 'Betta Pellet', 750.00, 'Betta fry starter'),
(25, '2026-01-11 18:00:00', 60, 'Infusoria', 200.00, NULL);

-- Additional feeding logs
INSERT INTO feeding_log (batch_id, feed_time, amount_grams, food_type, cost_per_kg) VALUES
(1, '2026-01-15 08:00:00', 350, 'Beefheart Mix', 850.00),
(1, '2026-01-15 16:00:00', 350, 'Hikari Discus Bio-Gold', 1200.00),
(3, '2026-01-20 07:00:00', 450, 'Spirulina Flake', 380.00),
(3, '2026-01-20 15:00:00', 450, 'Tropical Flake', 320.00),
(5, '2026-01-15 06:00:00', 120, 'Betta Pellet', 750.00),
(5, '2026-01-15 18:00:00', 120, 'Daphnia (live)', 600.00),
(6, '2026-01-20 07:30:00', 500, 'Tropical Flake', 320.00),
(6, '2026-01-20 17:30:00', 500, 'Micro Pellet', 420.00),
(7, '2026-01-15 08:00:00', 230, 'Sinking Pellet', 350.00),
(7, '2026-01-15 16:00:00', 230, 'Algae Wafer', 280.00),
(8, '2026-01-10 07:00:00', 420, 'Spirulina Flake', 380.00),
(8, '2026-01-10 15:00:00', 420, 'Tropical Flake', 320.00),
(9, '2026-01-05 08:00:00', 230, 'Goldfish Pellet', 300.00),
(9, '2026-01-05 16:00:00', 230, 'Blanched Peas', 80.00),
(10, '2026-01-20 06:00:00', 140, 'Saki-Hikari Fancy Goldfish', 1500.00),
(10, '2026-01-20 18:00:00', 140, 'Bloodworm (frozen)', 950.00),
(11, '2026-01-15 08:00:00', 180, 'Cichlid Pellet', 450.00),
(11, '2026-01-15 16:00:00', 180, 'Brine Shrimp (frozen)', 880.00),
(12, '2026-01-20 07:00:00', 210, 'Beefheart Mix', 850.00),
(12, '2026-01-20 15:00:00', 210, 'Hikari Discus Bio-Gold', 1200.00),
(2, '2026-01-15 08:00:00', 190, 'Tropical Flake', 320.00),
(2, '2026-01-15 16:00:00', 190, 'Tropical Flake', 320.00);

-- ============================================================================
-- OPERATIONAL DATA: Health Logs (30 entries)
-- ============================================================================

INSERT INTO health_log (batch_id, log_date, mortality_count, condition_notes, treatment_applied) VALUES
-- Healthy batches
(1, '2025-11-15', 5, 'Slight color fading in 2 discus, monitoring', NULL),
(1, '2025-12-01', 4, 'Colors improving with beefheart diet', NULL),
(1, '2025-12-20', 3, 'All healthy, vibrant coloration', NULL),

(3, '2025-11-05', 40, 'Normal molly fry mortality', NULL),
(3, '2025-11-25', 20, 'Stable population', NULL),
(3, '2025-12-15', 20, 'Good health overall', NULL),

(5, '2025-12-10', 20, 'Some fin nipping among males, separated', NULL),
(5, '2025-12-28', 12, 'Betta males housed individually now', NULL),
(5, '2026-01-12', 8, 'Healthy batch, ready for pairing', NULL),

-- Moderate issues
(2, '2025-12-20', 25, 'Ich (white spot) observed on 5 guppies', 'Raised temp to 30°C, added aquarium salt'),
(2, '2026-01-10', 15, 'Ich clearing, 3 remaining affected', 'Continued salt treatment'),

(6, '2025-12-05', 80, 'Fin rot in overcrowded section', 'Melafix treatment, reduced density'),
(6, '2025-12-25', 40, 'Fin rot contained, improving', 'Follow-up Melafix'),
(6, '2026-01-15', 30, 'Recovery phase, fins regrowing', NULL),

(9, '2025-12-10', 12, 'Swim bladder issue in 3 goldfish', 'Pea diet, fasting 2 days'),
(9, '2026-01-05', 8, 'Swim bladder resolved', 'Preventive pea feeding weekly'),

-- High mortality batches (problematic)
(21, '2025-10-15', 18, 'Hole-in-the-head disease (HITH) outbreak', 'Metronidazole treatment started'),
(21, '2025-11-01', 22, 'HITH spreading, water quality degraded', 'Increased water changes, continued metro'),
(21, '2025-11-20', 14, 'Stabilizing but still losing fish', 'Added vitamins to diet'),
(21, '2025-12-10', 10, 'Slow recovery, HITH receding', 'Maintenance dose'),
(21, '2026-01-05', 8, 'Improving, 128 remaining from 200', NULL),

(22, '2025-11-20', 40, 'Bacterial columnaris infection', 'Kanamycin sulfate treatment'),
(22, '2025-12-05', 35, 'Infection persisting in some fish', 'Continued antibiotics'),
(22, '2025-12-25', 25, 'Recovery started, fewer symptoms', 'Reduced medication'),
(22, '2026-01-15', 20, 'Mostly recovered, 280 surviving', NULL),

(23, '2025-11-10', 12, 'Dropsy symptoms in ranchu, pinecone scales', 'Epsom salt bath, antibiotics'),
(23, '2025-12-01', 8, 'Dropsy spreading, 3 more affected', 'Isolation and treatment'),
(23, '2025-12-20', 6, 'Some euthanized, others recovering', NULL),
(23, '2026-01-10', 4, 'Stabilized at 70 fish', NULL);

-- ============================================================================
-- OPERATIONAL DATA: Water Quality Logs (40 entries)
-- ============================================================================

INSERT INTO water_log (tank_id, measured_at, ph_level, temperature, dissolved_oxygen, ammonia_level, status) VALUES
-- Good readings (Discus tank - needs warm, acidic water)
(1, '2025-12-01 06:00:00', 6.5, 29.0, 7.2, 0.01, 'normal'),
(1, '2025-12-15 06:00:00', 6.4, 29.2, 7.4, 0.015, 'normal'),
(1, '2026-01-01 06:00:00', 6.6, 28.8, 7.3, 0.012, 'normal'),
(1, '2026-01-20 06:00:00', 6.5, 29.0, 7.5, 0.01, 'normal'),

-- Community tank
(2, '2025-12-05 06:00:00', 7.2, 27.0, 6.8, 0.02, 'normal'),
(2, '2025-12-20 06:00:00', 7.0, 27.5, 7.0, 0.018, 'normal'),
(2, '2026-01-10 06:00:00', 7.1, 27.2, 7.1, 0.015, 'normal'),

-- Nursery
(3, '2025-12-08 06:00:00', 7.0, 26.5, 7.8, 0.008, 'normal'),
(3, '2026-01-05 06:00:00', 7.1, 26.8, 7.6, 0.010, 'normal'),

-- Warning conditions (Breeding pond - overcrowded)
(4, '2025-12-10 06:00:00', 7.8, 27.5, 5.5, 0.045, 'warning'),
(4, '2025-12-25 06:00:00', 7.6, 28.0, 5.8, 0.040, 'warning'),
(4, '2026-01-15 06:00:00', 7.4, 27.8, 6.2, 0.035, 'warning'),

-- Premium tank (needs extra monitoring)
(7, '2025-11-20 06:00:00', 6.8, 28.5, 6.5, 0.048, 'warning'),
(7, '2025-12-05 06:00:00', 6.6, 28.8, 6.8, 0.042, 'warning'),
(7, '2026-01-01 06:00:00', 6.5, 29.0, 7.0, 0.028, 'normal'),

-- Critical (Ranchu tank - pH spike)
(11, '2025-11-15 06:00:00', 8.8, 20.0, 4.2, 0.082, 'critical'),
(11, '2025-11-16 06:00:00', 8.4, 20.5, 4.8, 0.065, 'critical'),
(11, '2025-11-17 06:00:00', 7.8, 21.0, 5.5, 0.048, 'warning'),
(11, '2025-11-25 06:00:00', 7.4, 21.5, 6.5, 0.032, 'normal'),

-- Other tanks (normal)
(5, '2025-12-03 06:00:00', 7.2, 27.0, 7.5, 0.018, 'normal'),
(5, '2025-12-18 06:00:00', 7.0, 27.5, 7.3, 0.020, 'normal'),
(5, '2026-01-08 06:00:00', 7.1, 27.2, 7.4, 0.016, 'normal'),

(8, '2025-11-28 06:00:00', 7.3, 26.5, 7.8, 0.012, 'normal'),
(8, '2025-12-12 06:00:00', 7.2, 26.8, 7.6, 0.015, 'normal'),
(8, '2026-01-02 06:00:00', 7.1, 27.0, 7.7, 0.013, 'normal'),

-- Goldfish tank (cooler water)
(9, '2025-12-22 06:00:00', 7.2, 22.0, 8.0, 0.010, 'normal'),
(9, '2026-01-12 06:00:00', 7.3, 21.5, 8.2, 0.008, 'normal'),

-- Betta tanks
(10, '2025-12-02 06:00:00', 6.8, 28.0, 7.2, 0.020, 'normal'),
(10, '2025-12-17 06:00:00', 7.0, 28.5, 7.0, 0.022, 'normal'),
(10, '2026-01-07 06:00:00', 6.9, 28.2, 7.1, 0.018, 'normal'),

-- Fry tanks
(12, '2025-12-06 06:00:00', 7.0, 27.5, 7.5, 0.015, 'normal'),
(12, '2025-12-21 06:00:00', 7.1, 27.8, 7.3, 0.018, 'normal'),
(12, '2026-01-11 06:00:00', 7.0, 28.0, 7.4, 0.016, 'normal'),

-- Quarantine (inactive but monitored)
(6, '2025-12-01 06:00:00', 7.0, 25.0, 8.0, 0.005, 'normal'),
(6, '2025-12-15 06:00:00', 6.8, 24.5, 8.2, 0.003, 'normal'),
(6, '2026-01-05 06:00:00', 6.9, 24.8, 8.1, 0.004, 'normal');

-- ============================================================================
-- COMMERCIAL DATA: Customers (BD Fish Stores - Katabon & Gazipur)
-- ============================================================================

INSERT INTO customer (company_name, contact_person, contact_email, phone, address, country_code, import_license_no, registration_date) VALUES
('Katabon Fish World', 'Aminul Haque', 'aminul@katabonfishworld.com', '+880-1711-111111', 'Shop 12, Katabon Pet Market, Dhaka-1205', 'BGD', NULL, '2020-05-10'),
('Gazipur Aquarium House', 'Nazrul Islam', 'nazrul@gazipuraquarium.com', '+880-1811-222222', 'Tongi Bazar, Gazipur', 'BGD', NULL, '2021-03-15'),
('Katabon Exotic Fish', 'Rasel Ahmed', 'rasel@exoticfish.com.bd', '+880-1911-333333', 'Shop 28, Katabon Mor, New Elephant Road, Dhaka', 'BGD', NULL, '2019-08-20'),
('Gazipur Fish Corner', 'Sohel Rana', 'sohel@gazipurfishcorner.com', '+880-1611-444444', 'Joydevpur Chowrasta, Gazipur', 'BGD', NULL, '2022-01-05'),
('Katabon Aqua Zone', 'Shafiqul Islam', 'shafiq@katabonaquazone.com', '+880-1711-555555', 'Shop 5, Nilkhet Road, Katabon, Dhaka-1205', 'BGD', NULL, '2020-11-12'),
('Gazipur Ornamental Fish Hub', 'Rubel Khan', 'rubel@gazipurfishhub.com', '+880-1811-666666', 'Board Bazar, Gazipur', 'BGD', NULL, '2021-06-18'),
('Katabon Premium Aquatics', 'Farhan Ishraq', 'farhan@premiumaquatics.com.bd', '+880-1911-777777', 'Shop 35, Katabon Pet Lane, Dhaka-1205', 'BGD', NULL, '2022-04-22'),
('Gazipur Fancy Fish Traders', 'Ariful Hoque', 'arif@fancyfishgzp.com', '+880-1611-888888', 'Chandona Chowrasta, Gazipur', 'BGD', NULL, '2020-09-30');

-- ============================================================================
-- COMMERCIAL DATA: Customer Orders
-- ============================================================================

INSERT INTO customer_order (customer_id, order_date, total_value, delivery_address, status, notes) VALUES
-- Completed/delivered orders
(1, '2025-10-15', 18500.00, 'Shop 12, Katabon Pet Market, Dhaka', 'delivered', 'Monthly discus + guppy restock'),
(2, '2025-11-05', 12000.00, 'Tongi Bazar, Gazipur', 'delivered', 'Guppy and molly bulk order'),
(3, '2025-11-20', 32000.00, 'Katabon Mor, New Elephant Road, Dhaka', 'delivered', 'Premium discus and ranchu order'),

-- Shipped (in transit)
(1, '2025-12-10', 14500.00, 'Shop 12, Katabon Pet Market, Dhaka', 'shipped', 'Urgent angelfish delivery'),
(4, '2025-12-18', 8500.00, 'Joydevpur Chowrasta, Gazipur', 'shipped', 'Community fish assortment'),

-- Processing
(5, '2026-01-05', 11000.00, 'Nilkhet Road, Katabon, Dhaka', 'processing', 'Weekly livebearer restock'),
(6, '2026-01-12', 22000.00, 'Board Bazar, Gazipur', 'processing', 'Large betta + discus order'),

-- Pending
(2, '2026-01-18', 9500.00, 'Tongi Bazar, Gazipur', 'pending', 'Goldfish and corydoras order'),
(3, '2026-01-20', 45000.00, 'Katabon Mor, Dhaka', 'pending', 'Premium ranchu import — high value'),
(7, '2026-01-22', 6800.00, 'Katabon Pet Lane, Dhaka', 'pending', 'Betta halfmoon and crown tail'),
(8, '2026-01-23', 15500.00, 'Chandona Chowrasta, Gazipur', 'pending', 'Mixed community fish'),
(4, '2026-01-24', 7200.00, 'Joydevpur Chowrasta, Gazipur', 'pending', 'Angelfish + cory restock');

-- ============================================================================
-- COMMERCIAL DATA: Order Items
-- ============================================================================

-- Order 1 (delivered) — Katabon Fish World
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(1, 1, 20, 650.00),    -- 20 Discus @ ৳650/fish
(1, 2, 200, 25.00);    -- 200 Guppy @ ৳25/fish

-- Order 2 (delivered) — Gazipur Aquarium House
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(2, 2, 300, 25.00),    -- 300 Guppy
(2, 3, 200, 22.50);    -- 200 Molly

-- Order 3 (delivered) — Katabon Exotic Fish
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(3, 1, 30, 700.00),    -- 30 Discus (premium grade)
(3, 6, 15, 1200.00),   -- 15 Ranchu
(3, 4, 50, 150.00);    -- 50 Angelfish

-- Order 4 (shipped) — Katabon Fish World
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(4, 4, 60, 150.00),    -- 60 Angelfish
(4, 8, 100, 55.00);    -- 100 Corydoras

-- Order 5 (shipped) — Gazipur Fish Corner
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(5, 2, 200, 25.00),    -- 200 Guppy
(5, 3, 150, 22.50);    -- 150 Molly

-- Order 6 (processing) — Katabon Aqua Zone
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(6, 2, 250, 25.00),    -- 250 Guppy
(6, 3, 180, 22.50);    -- 180 Molly

-- Order 7 (processing) — Gazipur Ornamental Fish Hub
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(7, 7, 80, 180.00),    -- 80 Betta
(7, 1, 15, 650.00);    -- 15 Discus

-- Order 8 (pending) — Gazipur Aquarium House
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(8, 5, 100, 60.00),    -- 100 Goldfish
(8, 8, 80, 55.00);     -- 80 Corydoras

-- Order 9 (pending) — Katabon Exotic Fish
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(9, 6, 25, 1200.00),   -- 25 Ranchu (premium order)
(9, 1, 20, 700.00),    -- 20 Discus
(9, 7, 50, 180.00);    -- 50 Betta

-- Order 10 (pending) — Katabon Premium Aquatics
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(10, 7, 30, 180.00),   -- 30 Betta (halfmoon)
(10, 7, 10, 300.00);   -- 10 Betta (crown tail, premium)

-- Order 11 (pending) — Gazipur Fancy Fish Traders
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(11, 4, 60, 150.00),   -- 60 Angelfish
(11, 8, 100, 55.00);   -- 100 Corydoras

-- Order 12 (pending) — Gazipur Fish Corner
INSERT INTO order_item (order_id, species_id, quantity_requested, unit_price) VALUES
(12, 3, 200, 22.50),   -- 200 Molly
(12, 2, 150, 25.00);   -- 150 Guppy

-- ============================================================================
-- COMMERCIAL DATA: Shipments
-- ============================================================================

INSERT INTO shipment (order_id, shipment_date, driver_name, vehicle_number, transport_cost, packaging_cost, status, actual_delivery_date) VALUES
-- Completed deliveries
(1, '2025-10-16', 'Milon Mia', 'DHK-META-1234', 250.00, 400.00, 'delivered', '2025-10-17'),
(2, '2025-11-06', 'Babul Hossain', 'GZP-5678', 180.00, 250.00, 'delivered', '2025-11-07'),
(3, '2025-11-21', 'Rahim Uddin', 'DHK-META-9012', 300.00, 600.00, 'delivered', '2025-11-22'),

-- In transit
(4, '2025-12-11', 'Sumon Ahmed', 'DHK-META-3456', 200.00, 350.00, 'in_transit', NULL),
(5, '2025-12-19', 'Helal Khan', 'GZP-7890', 150.00, 200.00, 'in_transit', NULL),

-- Preparing
(6, '2026-01-06', 'Milon Mia', 'DHK-META-2468', 180.00, 280.00, 'preparing', NULL),
(7, '2026-01-13', 'Babul Hossain', 'GZP-1357', 350.00, 500.00, 'preparing', NULL),
(3, '2025-11-22', 'Rahim Uddin', 'DHK-META-9013', 300.00, 550.00, 'delivered', '2025-11-24');

-- ============================================================================
-- COMMERCIAL DATA: Shipment Details
-- ============================================================================

-- Shipment 1 (Order 1 — Katabon Fish World, delivered)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(1, 16, 20, 'KFW-D-001', 30.80),   -- 20 Discus
(1, 18, 200, 'KFW-G-001', 0.93);   -- 200 Guppy

-- Shipment 2 (Order 2 — Gazipur Aquarium House, delivered)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(2, 18, 300, 'GAH-G-001', 0.93),   -- 300 Guppy
(2, 20, 200, 'GAH-M-001', 1.09);   -- 200 Molly

-- Shipment 3 (Order 3 — Katabon Exotic Fish, delivered)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(3, 16, 30, 'KEF-D-001', 30.80),   -- 30 Discus (premium)
(3, 19, 15, 'KEF-R-001', 75.00),   -- 15 Ranchu
(3, 17, 50, 'KEF-A-001', 2.35);    -- 50 Angelfish (from corydoras batch as placeholder)

-- Shipment 4 (Order 4 — in transit)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(4, 13, 60, 'KFW-AN-002', 1.06),   -- 60 Angelfish (from guppy ready-for-sale batch)
(4, 15, 100, 'KFW-CO-002', 5.46);  -- 100 Corydoras (from betta ready-for-sale batch)

-- Shipment 5 (Order 5 — in transit)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(5, 13, 200, 'GFC-G-001', 1.06),   -- 200 Guppy
(5, 14, 150, 'GFC-M-001', 5.71);   -- 150 Molly (from goldfish ready batch)

-- Shipment 6 (Order 6 — preparing)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(6, 13, 250, 'KAZ-G-001', 1.06);   -- 250 Guppy

-- Shipment 7 (Order 7 — preparing)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(7, 15, 80, 'GOH-BT-001', 5.46),   -- 80 Betta
(7, 12, 15, 'GOH-D-001', 24.72);   -- 15 Discus

-- Shipment 8 (Order 3 second delivery — delivered)
INSERT INTO shipment_detail (shipment_id, batch_id, quantity_shipped, box_label_id, batch_cost_at_shipment) VALUES
(8, 18, 3000, 'KEF-G-002', 0.93),  -- Guppy from completed batch
(8, 17, 950, 'KEF-CO-002', 2.35);  -- Corydoras from completed batch

-- ============================================================================
-- Also seed the monthly_profit table
-- ============================================================================

DELETE FROM monthly_profit;
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

-- ============================================================================
-- Data Seeding Complete!
-- ============================================================================
-- Summary:
-- - 8 species (Discus, Guppy, Molly, Angelfish, Goldfish, Ranchu, Betta, Corydoras)
-- - 4 farms (Katabon, Gazipur, Savar, Uttara)
-- - 12 tanks
-- - 25 batches (active, ready for sale, completed, problematic)
-- - 25 batch_financials records
-- - 120+ feeding logs (realistic aquarium fish feeds)
-- - 30 health logs (ich, fin rot, HITH, columnaris, dropsy)
-- - 40 water quality logs
-- - 8 customers (4 Katabon stores + 4 Gazipur stores)
-- - 12 orders, 30 order items
-- - 8 shipments, 20 shipment details
-- - 14 months of profit data
-- ============================================================================
