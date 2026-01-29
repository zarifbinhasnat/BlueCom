-- View: v_traceability_report
-- Purpose: Complete traceability from farm to customer for each shipment
-- Source: extracted from business_logic.sql

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
