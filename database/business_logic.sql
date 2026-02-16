-- ============================================================================
-- BLUECON Aquaculture Management System - Business Logic
-- ============================================================================
-- PostgreSQL 14+
-- Date: 2026-01-28
-- Purpose: Advanced queries and stored procedures for business intelligence
-- ============================================================================

-- ============================================================================
-- 1. TRACEABILITY AUDIT
-- Purpose: Links specific shipments back to the original farm for customs compliance
-- Use Case: International buyers need to verify disease history and farm origin
-- ============================================================================

-- View: traceability_report
-- Purpose: Complete traceability from farm to customer for each shipment
CREATE OR REPLACE VIEW v_traceability_report AS
SELECT 
    sh.shipment_id,
    sh.airway_bill_no,
    sh.shipment_date,
    c.company_name AS customer_name,
    c.country_code AS destination_country,
    c.import_license_no,
    sp.common_name AS species_name,
    sp.scientific_name,
    b.batch_id,
    b.birth_date AS batch_birth_date,
    b.stage AS batch_stage,
    f.farm_name,
    f.location AS farm_location,
    f.license_number AS farm_license,
    f.manager_name AS farm_manager,
    t.tank_name,
    t.tank_type,
    sd.quantity_shipped,
    sd.box_label_id,
    -- Disease history check
    (
        SELECT COUNT(*) 
        FROM health_log hl 
        WHERE hl.batch_id = b.batch_id 
        AND hl.condition_notes IS NOT NULL
    ) AS disease_event_count,
    -- Mortality rate
    ROUND(
        (b.initial_quantity - b.current_quantity)::DECIMAL / 
        NULLIF(b.initial_quantity, 0) * 100, 2
    ) AS mortality_rate_percent
FROM shipment sh
JOIN customer_order co ON sh.order_id = co.order_id
JOIN customer c ON co.customer_id = c.customer_id
JOIN shipment_detail sd ON sh.shipment_id = sd.shipment_id
JOIN batch b ON sd.batch_id = b.batch_id
JOIN species sp ON b.species_id = sp.species_id
JOIN tank t ON b.tank_id = t.tank_id
JOIN farm f ON t.farm_id = f.farm_id
ORDER BY sh.shipment_date DESC;

COMMENT ON VIEW v_traceability_report IS 'Complete end-to-end traceability for customs and compliance audits';

-- Function: get_batch_traceability
-- Returns complete history for a specific batch
CREATE OR REPLACE FUNCTION get_batch_traceability(p_batch_id INT)
RETURNS TABLE(
    batch_id INT,
    species_name VARCHAR,
    farm_name VARCHAR,
    farm_license VARCHAR,
    birth_date DATE,
    age_days INT,
    initial_qty INT,
    current_qty INT,
    mortality_rate DECIMAL,
    shipments_count BIGINT,
    total_shipped INT,
    disease_events BIGINT,
    water_quality_violations BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.batch_id,
        sp.common_name,
        f.farm_name,
        f.license_number,
        b.birth_date,
        (CURRENT_DATE - b.birth_date)::INT AS age_days,
        b.initial_quantity,
        b.current_quantity,
        ROUND((b.initial_quantity - b.current_quantity)::DECIMAL / NULLIF(b.initial_quantity, 0) * 100, 2),
        COUNT(DISTINCT sd.shipment_id),
        COALESCE(SUM(sd.quantity_shipped), 0)::INT,
        (SELECT COUNT(*) FROM health_log hl WHERE hl.batch_id = b.batch_id AND hl.condition_notes IS NOT NULL),
        (SELECT COUNT(*) FROM water_log wl 
         JOIN tank t2 ON wl.tank_id = t2.tank_id
         WHERE t2.tank_id = b.tank_id 
         AND wl.status IN ('warning', 'critical'))
    FROM batch b
    JOIN species sp ON b.species_id = sp.species_id
    JOIN tank t ON b.tank_id = t.tank_id
    JOIN farm f ON t.farm_id = f.farm_id
    LEFT JOIN shipment_detail sd ON b.batch_id = sd.batch_id
    WHERE b.batch_id = p_batch_id
    GROUP BY b.batch_id, sp.common_name, f.farm_name, f.license_number, 
             b.birth_date, b.initial_quantity, b.current_quantity;
END;
$$;

COMMENT ON FUNCTION get_batch_traceability IS 'Retrieves complete traceability information for a specific batch';

-- ============================================================================
-- 2. DYNAMIC PRICING MODEL
-- Purpose: Calculate selling prices based on production costs + profit margin
-- Use Case: Ensures transparent, cost-based pricing with target margins
-- ============================================================================

-- Function: calculate_batch_unit_cost
-- Returns the total production cost per fish for a batch
CREATE OR REPLACE FUNCTION calculate_batch_unit_cost(p_batch_id INT)
RETURNS DECIMAL(12,4)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_cost DECIMAL(12,2);
    v_initial_quantity INT;
    v_unit_cost DECIMAL(12,4);
BEGIN
    -- Get total production costs
    SELECT 
        COALESCE(total_feed_cost, 0) + 
        COALESCE(total_labor_cost, 0) + 
        COALESCE(water_electricity_cost, 0) + 
        COALESCE(medication_cost, 0)
    INTO v_total_cost
    FROM batch_financials
    WHERE batch_id = p_batch_id;
    
    -- If no financial record exists, return 0
    IF v_total_cost IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get initial quantity (we spread costs across all fish born, not just survivors)
    SELECT initial_quantity INTO v_initial_quantity
    FROM batch WHERE batch_id = p_batch_id;
    
    IF v_initial_quantity IS NULL OR v_initial_quantity = 0 THEN
        RETURN 0;
    END IF;
    
    v_unit_cost := v_total_cost / v_initial_quantity;
    
    RETURN v_unit_cost;
END;
$$;

COMMENT ON FUNCTION calculate_batch_unit_cost IS 'Calculates production cost per fish (includes mortality losses)';

-- Function: calculate_selling_price
-- Returns recommended selling price with profit margin applied
CREATE OR REPLACE FUNCTION calculate_selling_price(
    p_batch_id INT,
    p_transport_cost DECIMAL DEFAULT 0,
    p_packaging_cost DECIMAL DEFAULT 0
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_unit_cost DECIMAL(12,4);
    v_profit_margin DECIMAL(5,2);
    v_total_logistics DECIMAL(12,2);
    v_selling_price DECIMAL(12,2);
BEGIN
    -- Get production cost per unit
    v_unit_cost := calculate_batch_unit_cost(p_batch_id);
    
    -- Get target profit margin for this species
    SELECT s.target_profit_margin INTO v_profit_margin
    FROM batch b
    JOIN species s ON b.species_id = s.species_id
    WHERE b.batch_id = p_batch_id;
    
    -- Add logistics costs per unit (if provided)
    v_total_logistics := COALESCE(p_transport_cost, 0) + COALESCE(p_packaging_cost, 0);
    
    -- Calculate final price: (production_cost + logistics) × profit_margin
    v_selling_price := (v_unit_cost + v_total_logistics) * v_profit_margin;
    
    RETURN ROUND(v_selling_price, 2);
END;
$$;

COMMENT ON FUNCTION calculate_selling_price IS 'Calculates selling price: (cost + logistics) × profit margin';

-- View: batch_pricing_overview
-- Shows production costs and recommended prices for all active batches
CREATE OR REPLACE VIEW v_batch_pricing_overview AS
SELECT 
    b.batch_id,
    sp.common_name AS species,
    f.farm_name,
    b.stage,
    b.initial_quantity,
    b.current_quantity,
    COALESCE(bf.total_feed_cost, 0) AS feed_cost,
    COALESCE(bf.total_labor_cost, 0) AS labor_cost,
    COALESCE(bf.water_electricity_cost, 0) AS utilities_cost,
    COALESCE(bf.medication_cost, 0) AS medication_cost,
    (
        COALESCE(bf.total_feed_cost, 0) + 
        COALESCE(bf.total_labor_cost, 0) + 
        COALESCE(bf.water_electricity_cost, 0) + 
        COALESCE(bf.medication_cost, 0)
    ) AS total_cost,
    ROUND(
        (
            COALESCE(bf.total_feed_cost, 0) + 
            COALESCE(bf.total_labor_cost, 0) + 
            COALESCE(bf.water_electricity_cost, 0) + 
            COALESCE(bf.medication_cost, 0)
        ) / NULLIF(b.initial_quantity, 0), 4
    ) AS cost_per_unit,
    sp.target_profit_margin,
    ROUND(
        (
            (
                COALESCE(bf.total_feed_cost, 0) + 
                COALESCE(bf.total_labor_cost, 0) + 
                COALESCE(bf.water_electricity_cost, 0) + 
                COALESCE(bf.medication_cost, 0)
            ) / NULLIF(b.initial_quantity, 0)
        ) * sp.target_profit_margin, 2
    ) AS recommended_price
FROM batch b
JOIN species sp ON b.species_id = sp.species_id
JOIN tank t ON b.tank_id = t.tank_id
JOIN farm f ON t.farm_id = f.farm_id
LEFT JOIN batch_financials bf ON b.batch_id = bf.batch_id
WHERE b.stage IN ('Adult', 'Ready for Sale')
ORDER BY f.farm_name, sp.common_name;

COMMENT ON VIEW v_batch_pricing_overview IS 'Production costs and recommended selling prices for saleable batches';

-- ============================================================================
-- 3. MORTALITY RISK ANALYSIS
-- Purpose: Identify high-risk species by comparing death rates
-- Use Case: Guide breeding decisions and identify biosecurity issues
-- ============================================================================

-- View: species_mortality_analysis
CREATE OR REPLACE VIEW v_species_mortality_analysis AS
SELECT 
    sp.species_id,
    sp.common_name,
    sp.scientific_name,
    COUNT(DISTINCT b.batch_id) AS total_batches,
    SUM(b.initial_quantity) AS total_fish_bred,
    SUM(b.initial_quantity - b.current_quantity) AS total_deaths,
    ROUND(
        SUM(b.initial_quantity - b.current_quantity)::DECIMAL / 
        NULLIF(SUM(b.initial_quantity), 0) * 100, 2
    ) AS overall_mortality_rate,
    -- Average mortality per batch
    ROUND(
        AVG(
            (b.initial_quantity - b.current_quantity)::DECIMAL / 
            NULLIF(b.initial_quantity, 0) * 100
        ), 2
    ) AS avg_batch_mortality_rate,
    -- Count disease incidents
    (
        SELECT COUNT(*) 
        FROM health_log hl 
        JOIN batch b2 ON hl.batch_id = b2.batch_id
        WHERE b2.species_id = sp.species_id 
        AND hl.condition_notes IS NOT NULL
    ) AS disease_incidents,
    -- Risk classification
    CASE 
        WHEN ROUND(
            SUM(b.initial_quantity - b.current_quantity)::DECIMAL / 
            NULLIF(SUM(b.initial_quantity), 0) * 100, 2
        ) > 30 THEN 'HIGH RISK'
        WHEN ROUND(
            SUM(b.initial_quantity - b.current_quantity)::DECIMAL / 
            NULLIF(SUM(b.initial_quantity), 0) * 100, 2
        ) > 15 THEN 'MEDIUM RISK'
        ELSE 'LOW RISK'
    END AS risk_level
FROM species sp
LEFT JOIN batch b ON sp.species_id = b.species_id
GROUP BY sp.species_id, sp.common_name, sp.scientific_name
HAVING COUNT(b.batch_id) > 0
ORDER BY overall_mortality_rate DESC;

COMMENT ON VIEW v_species_mortality_analysis IS 'Mortality rates by species to identify high-risk breeds';

-- Function: get_high_risk_batches
-- Returns batches with mortality rates above threshold
CREATE OR REPLACE FUNCTION get_high_risk_batches(p_mortality_threshold DECIMAL DEFAULT 20.0)
RETURNS TABLE(
    batch_id INT,
    species_name VARCHAR,
    farm_name VARCHAR,
    tank_name VARCHAR,
    age_days INT,
    mortality_rate DECIMAL,
    recent_deaths INT,
    last_health_check DATE,
    water_quality_status VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.batch_id,
        sp.common_name,
        f.farm_name,
        t.tank_name,
        (CURRENT_DATE - b.birth_date)::INT,
        ROUND(
            (b.initial_quantity - b.current_quantity)::DECIMAL / 
            NULLIF(b.initial_quantity, 0) * 100, 2
        ),
        (
            SELECT COALESCE(SUM(hl.mortality_count), 0)::INT
            FROM health_log hl 
            WHERE hl.batch_id = b.batch_id 
            AND hl.log_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        (
            SELECT MAX(hl.log_date) 
            FROM health_log hl 
            WHERE hl.batch_id = b.batch_id
        ),
        (
            SELECT wl.status
            FROM water_log wl
            WHERE wl.tank_id = b.tank_id
            ORDER BY wl.measured_at DESC
            LIMIT 1
        )::VARCHAR
    FROM batch b
    JOIN species sp ON b.species_id = sp.species_id
    JOIN tank t ON b.tank_id = t.tank_id
    JOIN farm f ON t.farm_id = f.farm_id
    WHERE 
        b.stage NOT IN ('Ready for Sale')
        AND ROUND(
            (b.initial_quantity - b.current_quantity)::DECIMAL / 
            NULLIF(b.initial_quantity, 0) * 100, 2
        ) >= p_mortality_threshold
    ORDER BY 
        ROUND(
            (b.initial_quantity - b.current_quantity)::DECIMAL / 
            NULLIF(b.initial_quantity, 0) * 100, 2
        ) DESC;
END;
$$;

COMMENT ON FUNCTION get_high_risk_batches IS 'Identifies batches exceeding mortality threshold for immediate attention';

-- ============================================================================
-- 4. BIOSECURITY ALERTS
-- Purpose: Flag tanks when water parameters deviate from species requirements
-- Use Case: Prevent mass mortality through early warning system
-- ============================================================================

-- Function: check_water_quality_compliance
-- Compares water log readings against species ideal parameters
CREATE OR REPLACE FUNCTION check_water_quality_compliance(p_tank_id INT)
RETURNS TABLE(
    tank_id INT,
    tank_name VARCHAR,
    batch_id INT,
    species_name VARCHAR,
    parameter VARCHAR,
    current_value DECIMAL,
    ideal_min DECIMAL,
    ideal_max DECIMAL,
    deviation_severity VARCHAR,
    measured_at TIMESTAMP
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Check pH levels
    SELECT 
        t.tank_id,
        t.tank_name,
        b.batch_id,
        sp.common_name,
        'pH'::VARCHAR,
        wl.ph_level,
        sp.ideal_ph_min,
        sp.ideal_ph_max,
        CASE 
            WHEN wl.ph_level < sp.ideal_ph_min - 1.0 OR wl.ph_level > sp.ideal_ph_max + 1.0 THEN 'CRITICAL'
            WHEN wl.ph_level < sp.ideal_ph_min OR wl.ph_level > sp.ideal_ph_max THEN 'WARNING'
            ELSE 'NORMAL'
        END::VARCHAR,
        wl.measured_at
    FROM water_log wl
    JOIN tank t ON wl.tank_id = t.tank_id
    JOIN batch b ON t.tank_id = b.tank_id
    JOIN species sp ON b.species_id = sp.species_id
    WHERE t.tank_id = p_tank_id
      AND wl.measured_at = (
          SELECT MAX(measured_at) 
          FROM water_log 
          WHERE tank_id = p_tank_id
      )
      AND (wl.ph_level < sp.ideal_ph_min OR wl.ph_level > sp.ideal_ph_max)
    
    UNION ALL
    
    -- Check temperature levels
    SELECT 
        t.tank_id,
        t.tank_name,
        b.batch_id,
        sp.common_name,
        'Temperature'::VARCHAR,
        wl.temperature,
        sp.ideal_temp_min,
        sp.ideal_temp_max,
        CASE 
            WHEN wl.temperature < sp.ideal_temp_min - 3.0 OR wl.temperature > sp.ideal_temp_max + 3.0 THEN 'CRITICAL'
            WHEN wl.temperature < sp.ideal_temp_min OR wl.temperature > sp.ideal_temp_max THEN 'WARNING'
            ELSE 'NORMAL'
        END::VARCHAR,
        wl.measured_at
    FROM water_log wl
    JOIN tank t ON wl.tank_id = t.tank_id
    JOIN batch b ON t.tank_id = b.tank_id
    JOIN species sp ON b.species_id = sp.species_id
    WHERE t.tank_id = p_tank_id
      AND wl.measured_at = (
          SELECT MAX(measured_at) 
          FROM water_log 
          WHERE tank_id = p_tank_id
      )
      AND (wl.temperature < sp.ideal_temp_min OR wl.temperature > sp.ideal_temp_max)
    
    ORDER BY deviation_severity DESC, measured_at DESC;
END;
$$;

COMMENT ON FUNCTION check_water_quality_compliance IS 'Detects water parameter violations against species requirements';

-- Trigger Function: auto_create_biosecurity_alert
-- Automatically creates alerts when water parameters are out of range
CREATE OR REPLACE FUNCTION auto_create_biosecurity_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_batch_record RECORD;
    v_alert_message TEXT;
    v_severity VARCHAR(20);
BEGIN
    -- Check all batches in this tank
    FOR v_batch_record IN 
        SELECT b.batch_id, b.species_id, sp.common_name,
               sp.ideal_ph_min, sp.ideal_ph_max,
               sp.ideal_temp_min, sp.ideal_temp_max
        FROM batch b
        JOIN species sp ON b.species_id = sp.species_id
        WHERE b.tank_id = NEW.tank_id
          AND b.stage NOT IN ('Ready for Sale')
    LOOP
        -- Check pH violations
        IF NEW.ph_level IS NOT NULL THEN
            IF NEW.ph_level < v_batch_record.ideal_ph_min - 1.0 OR 
               NEW.ph_level > v_batch_record.ideal_ph_max + 1.0 THEN
                v_severity := 'critical';
                v_alert_message := format(
                    'CRITICAL: pH level %.2f is dangerously out of range for %s (ideal: %.2f-%.2f)',
                    NEW.ph_level, v_batch_record.common_name,
                    v_batch_record.ideal_ph_min, v_batch_record.ideal_ph_max
                );
                
                INSERT INTO alert (severity, alert_type, message, tank_id, batch_id, status)
                VALUES (v_severity, 'PH_CRITICAL', v_alert_message, NEW.tank_id, v_batch_record.batch_id, 'open');
                
            ELSIF NEW.ph_level < v_batch_record.ideal_ph_min OR 
                  NEW.ph_level > v_batch_record.ideal_ph_max THEN
                v_severity := 'high';
                v_alert_message := format(
                    'WARNING: pH level %.2f is outside ideal range for %s (ideal: %.2f-%.2f)',
                    NEW.ph_level, v_batch_record.common_name,
                    v_batch_record.ideal_ph_min, v_batch_record.ideal_ph_max
                );
                
                INSERT INTO alert (severity, alert_type, message, tank_id, batch_id, status)
                VALUES (v_severity, 'PH_HIGH', v_alert_message, NEW.tank_id, v_batch_record.batch_id, 'open');
            END IF;
        END IF;
        
        -- Check temperature violations
        IF NEW.temperature IS NOT NULL THEN
            IF NEW.temperature < v_batch_record.ideal_temp_min - 3.0 OR 
               NEW.temperature > v_batch_record.ideal_temp_max + 3.0 THEN
                v_severity := 'critical';
                v_alert_message := format(
                    'CRITICAL: Temperature %.2f°C is dangerously out of range for %s (ideal: %.2f-%.2f°C)',
                    NEW.temperature, v_batch_record.common_name,
                    v_batch_record.ideal_temp_min, v_batch_record.ideal_temp_max
                );
                
                INSERT INTO alert (severity, alert_type, message, tank_id, batch_id, status)
                VALUES (v_severity, 'TEMP_CRITICAL', v_alert_message, NEW.tank_id, v_batch_record.batch_id, 'open');
                
            ELSIF NEW.temperature < v_batch_record.ideal_temp_min OR 
                  NEW.temperature > v_batch_record.ideal_temp_max THEN
                v_severity := 'high';
                v_alert_message := format(
                    'WARNING: Temperature %.2f°C is outside ideal range for %s (ideal: %.2f-%.2f°C)',
                    NEW.temperature, v_batch_record.common_name,
                    v_batch_record.ideal_temp_min, v_batch_record.ideal_temp_max
                );
                
                INSERT INTO alert (severity, alert_type, message, tank_id, batch_id, status)
                VALUES (v_severity, 'TEMP_HIGH', v_alert_message, NEW.tank_id, v_batch_record.batch_id, 'open');
            END IF;
        END IF;
        
        -- Check ammonia (general threshold, not species-specific)
        IF NEW.ammonia_level IS NOT NULL AND NEW.ammonia_level > 0.5 THEN
            v_severity := CASE WHEN NEW.ammonia_level > 1.0 THEN 'critical' ELSE 'high' END;
            v_alert_message := format(
                'Ammonia level %.3f ppm exceeds safe threshold in tank containing %s',
                NEW.ammonia_level, v_batch_record.common_name
            );
            
            INSERT INTO alert (severity, alert_type, message, tank_id, batch_id, status)
            VALUES (v_severity, 'AMMONIA_HIGH', v_alert_message, NEW.tank_id, v_batch_record.batch_id, 'open');
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_biosecurity_alert ON water_log;
CREATE TRIGGER trg_biosecurity_alert
AFTER INSERT ON water_log
FOR EACH ROW
EXECUTE FUNCTION auto_create_biosecurity_alert();

COMMENT ON TRIGGER trg_biosecurity_alert ON water_log IS 
'Automatically creates alerts when water parameters violate species requirements';

-- View: active_biosecurity_alerts
CREATE OR REPLACE VIEW v_active_biosecurity_alerts AS
SELECT 
    a.alert_id,
    a.severity,
    a.alert_type,
    a.message,
    a.created_at,
    f.farm_name,
    t.tank_name,
    sp.common_name AS species,
    b.batch_id,
    b.current_quantity AS fish_at_risk,
    a.status
FROM alert a
LEFT JOIN tank t ON a.tank_id = t.tank_id
LEFT JOIN farm f ON t.farm_id = f.farm_id
LEFT JOIN batch b ON a.batch_id = b.batch_id
LEFT JOIN species sp ON b.species_id = sp.species_id
WHERE a.status IN ('open', 'acknowledged')
  AND a.alert_type IN ('PH_HIGH', 'PH_CRITICAL', 'TEMP_HIGH', 'TEMP_CRITICAL', 'AMMONIA_HIGH')
ORDER BY 
    CASE a.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    a.created_at DESC;

COMMENT ON VIEW v_active_biosecurity_alerts IS 'Shows all unresolved water quality alerts requiring immediate action';

-- ============================================================================
-- 5. ADDITIONAL BUSINESS INTELLIGENCE QUERIES
-- ============================================================================

-- View: farm_performance_summary
CREATE OR REPLACE VIEW v_farm_performance_summary AS
SELECT 
    f.farm_id,
    f.farm_name,
    f.location,
    COUNT(DISTINCT t.tank_id) AS total_tanks,
    COUNT(DISTINCT b.batch_id) AS active_batches,
    COUNT(DISTINCT b.species_id) AS species_diversity,
    SUM(b.current_quantity) AS total_fish_count,
    ROUND(AVG(
        (b.initial_quantity - b.current_quantity)::DECIMAL / 
        NULLIF(b.initial_quantity, 0) * 100
    ), 2) AS avg_mortality_rate,
    (
        SELECT COUNT(*) 
        FROM alert a
        JOIN tank t2 ON a.tank_id = t2.tank_id
        WHERE t2.farm_id = f.farm_id
          AND a.status = 'open'
          AND a.severity IN ('critical', 'high')
    ) AS critical_alerts
FROM farm f
LEFT JOIN tank t ON f.farm_id = t.farm_id AND t.is_active = TRUE
LEFT JOIN batch b ON t.tank_id = b.tank_id AND b.stage NOT IN ('Ready for Sale')
GROUP BY f.farm_id, f.farm_name, f.location
ORDER BY f.farm_name;

COMMENT ON VIEW v_farm_performance_summary IS 'High-level dashboard for farm operations and health status';

-- ============================================================================
-- SUMMARY OF BUSINESS LOGIC CAPABILITIES
-- ============================================================================
-- 1. Traceability: v_traceability_report, get_batch_traceability()
-- 2. Dynamic Pricing: calculate_selling_price(), v_batch_pricing_overview
-- 3. Mortality Analysis: v_species_mortality_analysis, get_high_risk_batches()
-- 4. Biosecurity: auto_create_biosecurity_alert trigger, v_active_biosecurity_alerts
-- 5. Farm Performance: v_farm_performance_summary
-- ============================================================================
