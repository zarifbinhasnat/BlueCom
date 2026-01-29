-- ============================================================================
-- Bluecon Aquaculture Management System - Database Schema
-- ============================================================================
-- PostgreSQL 14+
-- Date: 2026-01-28
-- Update: Added Security, Compliance, and Alerting modules
-- Description: Complete schema for fish farm management from hatchery to delivery
-- ============================================================================

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS shipment_certification CASCADE;
DROP TABLE IF EXISTS certification_type CASCADE;
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS shipment_detail CASCADE;
DROP TABLE IF EXISTS shipment CASCADE;
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS customer_order CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS health_log CASCADE;
DROP TABLE IF EXISTS feeding_log CASCADE;
DROP TABLE IF EXISTS water_log CASCADE;
DROP TABLE IF EXISTS batch_financials CASCADE;
DROP TABLE IF EXISTS batch CASCADE;
DROP TABLE IF EXISTS tank CASCADE;
DROP TABLE IF EXISTS farm CASCADE;
DROP TABLE IF EXISTS species CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS user_role CASCADE;

-- ============================================================================
-- SECURITY & ACCESS CONTROL
-- ============================================================================

-- Table: user_role
-- Purpose: Role-based access control (RBAC) definitions
CREATE TABLE user_role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'admin', 'farm_manager', 'worker'
    description TEXT
);

COMMENT ON TABLE user_role IS 'Defines user permission levels';

-- Table: app_user
-- Purpose: System users with login credentials
CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INT NOT NULL REFERENCES user_role(role_id),
    email VARCHAR(100) UNIQUE,
    farm_id INT, -- Optional: link user to specific farm if applicable
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE app_user IS 'Registered users of the application';

-- ============================================================================
-- MASTER DATA TABLES
-- ============================================================================

-- Table: species
-- Purpose: Fish species catalog with profit margins and environmental requirements
CREATE TABLE species (
    species_id SERIAL PRIMARY KEY,
    common_name VARCHAR(100) NOT NULL UNIQUE,
    scientific_name VARCHAR(100),
    description TEXT,
    target_profit_margin DECIMAL(5,2) NOT NULL CHECK (target_profit_margin >= 1.0),
    ideal_temp_min DECIMAL(4,2),
    ideal_temp_max DECIMAL(4,2),
    ideal_ph_min DECIMAL(4,2),
    ideal_ph_max DECIMAL(4,2),
    CONSTRAINT check_temp_range CHECK (ideal_temp_min < ideal_temp_max),
    CONSTRAINT check_ph_range CHECK (ideal_ph_min < ideal_ph_max)
);

COMMENT ON TABLE species IS 'Fish species catalog with breeding specifications';
COMMENT ON COLUMN species.target_profit_margin IS 'Markup multiplier (e.g., 1.30 = 30% profit)';

-- Table: farm
-- Purpose: Physical farm locations with licensing and capacity tracking
CREATE TABLE farm (
    farm_id SERIAL PRIMARY KEY,
    farm_name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    manager_name VARCHAR(100),
    phone VARCHAR(20),
    total_capacity_liters DECIMAL(15,2) CHECK (total_capacity_liters > 0),
    established_date DATE,
    CONSTRAINT unique_farm_location UNIQUE (farm_name, location)
);

COMMENT ON TABLE farm IS 'Fish farm locations managed by the system';
COMMENT ON COLUMN farm.total_capacity_liters IS 'Total water capacity across all tanks in the farm';

-- Add foreign key to app_user now that farm exists
ALTER TABLE app_user ADD CONSTRAINT fk_user_farm FOREIGN KEY (farm_id) REFERENCES farm(farm_id) ON DELETE SET NULL;

-- Table: tank
-- Purpose: Individual tanks/ponds within farms
CREATE TABLE tank (
    tank_id SERIAL PRIMARY KEY,
    farm_id INT NOT NULL REFERENCES farm(farm_id) ON DELETE CASCADE,
    tank_name VARCHAR(50) NOT NULL,
    tank_type VARCHAR(50) DEFAULT 'Recirculating' CHECK (tank_type IN ('Pond', 'Recirculating', 'Flow-through', 'Quarantine')),
    volume_liters DECIMAL(12,2) NOT NULL CHECK (volume_liters > 0),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_tank_per_farm UNIQUE (farm_id, tank_name)
);

COMMENT ON TABLE tank IS 'Storage units (tanks/ponds) holding fish batches';
COMMENT ON COLUMN tank.tank_type IS 'Tank classification: Pond, Recirculating, Flow-through, or Quarantine';

CREATE INDEX idx_tank_farm ON tank(farm_id);
CREATE INDEX idx_tank_active ON tank(is_active);

-- Table: certification_type
-- Purpose: Types of certificates (CITES, Health, Origin)
CREATE TABLE certification_type (
    cert_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, 
    issuing_authority VARCHAR(100),
    description TEXT
);

COMMENT ON TABLE certification_type IS 'Catalog of required trade certificates';

-- ============================================================================
-- OPERATIONAL DATA TABLES
-- ============================================================================

-- Table: batch
-- Purpose: Groups of fish from the same species bred together
CREATE TABLE batch (
    batch_id SERIAL PRIMARY KEY,
    species_id INT NOT NULL REFERENCES species(species_id) ON DELETE RESTRICT,
    tank_id INT NOT NULL REFERENCES tank(tank_id) ON DELETE RESTRICT,
    birth_date DATE NOT NULL,
    initial_quantity INT NOT NULL CHECK (initial_quantity > 0),
    current_quantity INT NOT NULL CHECK (current_quantity >= 0),
    stage VARCHAR(30) DEFAULT 'Fry' CHECK (stage IN ('Fry', 'Juvenile', 'Adult', 'Quarantine', 'Ready for Sale')),
    estimated_harvest_date DATE,
    CONSTRAINT check_batch_quantity CHECK (current_quantity <= initial_quantity),
    CONSTRAINT check_harvest_date CHECK (estimated_harvest_date IS NULL OR estimated_harvest_date > birth_date)
);

COMMENT ON TABLE batch IS 'Groups of fish tracked from birth to harvest';
COMMENT ON COLUMN batch.stage IS 'Life stage: Fry, Juvenile, Adult, Quarantine, or Ready for Sale';

CREATE INDEX idx_batch_species ON batch(species_id);
CREATE INDEX idx_batch_tank ON batch(tank_id);
CREATE INDEX idx_batch_stage ON batch(stage);

-- Table: batch_financials
-- Purpose: Cost tracking per batch
CREATE TABLE batch_financials (
    cost_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL UNIQUE REFERENCES batch(batch_id) ON DELETE CASCADE,
    total_feed_cost DECIMAL(12,2) DEFAULT 0.00 CHECK (total_feed_cost >= 0),
    total_labor_cost DECIMAL(12,2) DEFAULT 0.00 CHECK (total_labor_cost >= 0),
    water_electricity_cost DECIMAL(12,2) DEFAULT 0.00 CHECK (water_electricity_cost >= 0),
    medication_cost DECIMAL(12,2) DEFAULT 0.00 CHECK (medication_cost >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE batch_financials IS 'Accumulated costs for each batch';

CREATE INDEX idx_financials_batch ON batch_financials(batch_id);

-- Table: feeding_log
-- Purpose: Record each feeding event
CREATE TABLE feeding_log (
    feed_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL REFERENCES batch(batch_id) ON DELETE CASCADE,
    feed_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    food_type VARCHAR(50) NOT NULL,
    amount_grams DECIMAL(10,2) NOT NULL CHECK (amount_grams > 0),
    cost_per_kg DECIMAL(10,2) NOT NULL CHECK (cost_per_kg > 0),
    recorded_by INT REFERENCES app_user(user_id),
    notes TEXT
);

COMMENT ON TABLE feeding_log IS 'Historical record of all feeding events';
COMMENT ON COLUMN feeding_log.food_type IS 'Type of feed used (e.g., pellets, flakes, live food)';

CREATE INDEX idx_feeding_batch ON feeding_log(batch_id);
CREATE INDEX idx_feeding_time ON feeding_log(feed_time);

-- Table: health_log
-- Purpose: Track mortality and health events
CREATE TABLE health_log (
    health_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL REFERENCES batch(batch_id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    condition_notes TEXT,
    treatment_applied TEXT,
    mortality_count INT DEFAULT 0 CHECK (mortality_count >= 0),
    recorded_by INT REFERENCES app_user(user_id)
);

COMMENT ON TABLE health_log IS 'Health monitoring and mortality tracking';
COMMENT ON COLUMN health_log.condition_notes IS 'Description of observed health conditions or diseases';
COMMENT ON COLUMN health_log.treatment_applied IS 'Medications or treatments administered';

CREATE INDEX idx_health_batch ON health_log(batch_id);
CREATE INDEX idx_health_log_date ON health_log(log_date);

-- Table: water_log
-- Purpose: Water quality monitoring per tank
CREATE TABLE water_log (
    log_id SERIAL PRIMARY KEY,
    tank_id INT NOT NULL REFERENCES tank(tank_id) ON DELETE CASCADE,
    measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ph_level DECIMAL(4,2) CHECK (ph_level BETWEEN 0 AND 14),
    temperature DECIMAL(5,2),
    dissolved_oxygen DECIMAL(5,2) CHECK (dissolved_oxygen >= 0),
    ammonia_level DECIMAL(6,3) CHECK (ammonia_level >= 0),
    measured_by_user_id INT REFERENCES app_user(user_id),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical'))
);

COMMENT ON TABLE water_log IS 'Water quality measurements for environmental monitoring';
COMMENT ON COLUMN water_log.measured_by_user_id IS 'User ID of the person who took the measurement';

CREATE INDEX idx_water_tank ON water_log(tank_id);
CREATE INDEX idx_water_measured_at ON water_log(measured_at);

-- Table: alert
-- Purpose: System-generated or manual alerts for critical conditions
CREATE TABLE alert (
    alert_id SERIAL PRIMARY KEY,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    alert_type VARCHAR(50) NOT NULL, -- e.g., 'PH_HIGH', 'MORTALITY_SPIKE'
    message TEXT NOT NULL,
    tank_id INT REFERENCES tank(tank_id) ON DELETE CASCADE,
    batch_id INT REFERENCES batch(batch_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INT REFERENCES app_user(user_id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved'))
);

COMMENT ON TABLE alert IS 'Active and historical alerts requiring attention';

CREATE INDEX idx_alert_status ON alert(status);
CREATE INDEX idx_alert_tank ON alert(tank_id);

-- ============================================================================
-- COMMERCIAL DATA TABLES
-- ============================================================================

-- Table: customer
-- Purpose: International buyers requiring traceability and compliance
CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    country_code CHAR(3),
    import_license_no VARCHAR(100),
    registration_date DATE DEFAULT CURRENT_DATE
);

COMMENT ON TABLE customer IS 'Fish buyers and distributors, particularly international importers';
COMMENT ON COLUMN customer.country_code IS 'ISO 3166-1 alpha-3 country code (e.g., USA, JPN, DEU)';
COMMENT ON COLUMN customer.import_license_no IS 'Required for customs compliance and traceability';

CREATE INDEX idx_customer_country ON customer(country_code);

-- Table: customer_order
-- Purpose: Customer purchase orders (renamed from ORDER to avoid SQL keyword conflicts)
CREATE TABLE customer_order (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_value DECIMAL(12,2) NOT NULL CHECK (total_value >= 0),
    currency_code CHAR(3) DEFAULT 'USD',
    delivery_address TEXT,
    created_by INT REFERENCES app_user(user_id),
    notes TEXT
);

COMMENT ON TABLE customer_order IS 'Customer purchase orders';
COMMENT ON COLUMN customer_order.currency_code IS 'ISO 4217 currency code (e.g., USD, EUR, JPY)';

CREATE INDEX idx_order_customer ON customer_order(customer_id);
CREATE INDEX idx_order_status ON customer_order(status);

-- Table: order_item
-- Purpose: Line items in a customer order
CREATE TABLE order_item (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES customer_order(order_id) ON DELETE CASCADE,
    species_id INT NOT NULL REFERENCES species(species_id) ON DELETE RESTRICT,
    quantity_requested INT NOT NULL CHECK (quantity_requested > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity_requested * unit_price) STORED
);

COMMENT ON TABLE order_item IS 'Individual line items within customer orders';
COMMENT ON COLUMN order_item.quantity_requested IS 'Number of fish requested by customer';

CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_species ON order_item(species_id);

-- Table: shipment
-- Purpose: Fulfillment of customer orders (physical delivery)
CREATE TABLE shipment (
    shipment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES customer_order(order_id) ON DELETE RESTRICT,
    shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    airway_bill_no VARCHAR(100) UNIQUE,
    driver_name VARCHAR(100),
    vehicle_number VARCHAR(50),
    transport_cost DECIMAL(10,2) DEFAULT 0.00 CHECK (transport_cost >= 0),
    packaging_cost DECIMAL(10,2) DEFAULT 0.00 CHECK (packaging_cost >= 0),
    status VARCHAR(20) DEFAULT 'preparing' CHECK (status IN ('preparing', 'in_transit', 'delivered', 'cancelled')),
    actual_delivery_date DATE,
    CONSTRAINT check_delivery_date CHECK (actual_delivery_date IS NULL OR actual_delivery_date >= shipment_date)
);

COMMENT ON TABLE shipment IS 'Physical delivery of fish to customers';
COMMENT ON COLUMN shipment.airway_bill_no IS 'Tracking number for air freight shipments';

CREATE INDEX idx_shipment_order ON shipment(order_id);
CREATE INDEX idx_shipment_status ON shipment(status);

-- Table: shipment_detail
-- Purpose: Which batches were allocated to each shipment (end-to-end traceability)
CREATE TABLE shipment_detail (
    detail_id SERIAL PRIMARY KEY,
    shipment_id INT NOT NULL REFERENCES shipment(shipment_id) ON DELETE CASCADE,
    batch_id INT NOT NULL REFERENCES batch(batch_id) ON DELETE RESTRICT,
    quantity_shipped INT NOT NULL CHECK (quantity_shipped > 0),
    box_label_id VARCHAR(50),
    batch_cost_at_shipment DECIMAL(12,2)
);

COMMENT ON TABLE shipment_detail IS 'Batch allocation details for each shipment';
COMMENT ON COLUMN shipment_detail.box_label_id IS 'Physical box identifier for customs and tracking';

CREATE INDEX idx_shipment_detail_shipment ON shipment_detail(shipment_id);
CREATE INDEX idx_shipment_detail_batch ON shipment_detail(batch_id);

-- Table: shipment_certification
-- Purpose: Linking required docs to international shipments
CREATE TABLE shipment_certification (
    ship_cert_id SERIAL PRIMARY KEY,
    shipment_id INT NOT NULL REFERENCES shipment(shipment_id) ON DELETE CASCADE,
    cert_type_id INT NOT NULL REFERENCES certification_type(cert_type_id),
    certificate_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    document_url TEXT
);

COMMENT ON TABLE shipment_certification IS 'Compliance documents attached to shipments';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Tables: 18
-- Security: user_role, app_user
-- Master Data: species, farm, tank, certification_type
-- Operational: batch, batch_financials, feeding_log, health_log, water_log, alert
-- Commercial: customer, customer_order, order_item, shipment, shipment_detail, shipment_certification
-- ============================================================================
