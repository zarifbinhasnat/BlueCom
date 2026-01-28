-- ============================================================================
-- BLUECON Aquaculture Management System - Additional Triggers
-- ============================================================================
-- PostgreSQL 14+
-- Date: 2026-01-28
-- Purpose: Automated data integrity and business rule enforcement
-- ============================================================================

-- ============================================================================
-- Trigger: Auto-update batch current_quantity when mortality is logged
-- ============================================================================

CREATE OR REPLACE FUNCTION update_batch_quantity_on_mortality()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Decrease current_quantity by the mortality count
    UPDATE batch
    SET current_quantity = GREATEST(0, current_quantity - NEW.mortality_count)
    WHERE batch_id = NEW.batch_id;
    
    -- Check if batch is now empty and should be marked as completed
    UPDATE batch
    SET stage = 'Ready for Sale'
    WHERE batch_id = NEW.batch_id
      AND current_quantity = 0
      AND stage NOT IN ('Ready for Sale');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_quantity_on_mortality
AFTER INSERT ON health_log
FOR EACH ROW
WHEN (NEW.mortality_count > 0)
EXECUTE FUNCTION update_batch_quantity_on_mortality();

COMMENT ON TRIGGER trg_update_quantity_on_mortality ON health_log IS 
'Automatically decreases batch current_quantity when mortality is recorded';

-- ============================================================================
-- Trigger: Validate shipment quantity doesn't exceed batch availability
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_shipment_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_available_quantity INT;
BEGIN
    -- Get current available quantity for the batch
    SELECT current_quantity INTO v_available_quantity
    FROM batch
    WHERE batch_id = NEW.batch_id;
    
    -- Check if we have enough fish
    IF v_available_quantity < NEW.quantity_shipped THEN
        RAISE EXCEPTION 'Cannot ship % fish from batch %. Only % available.',
            NEW.quantity_shipped, NEW.batch_id, v_available_quantity;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_shipment_quantity
BEFORE INSERT OR UPDATE ON shipment_detail
FOR EACH ROW
EXECUTE FUNCTION validate_shipment_quantity();

COMMENT ON TRIGGER trg_validate_shipment_quantity ON shipment_detail IS 
'Prevents shipping more fish than available in batch';

-- ============================================================================
-- Trigger: Decrease batch quantity when shipment is created
-- ============================================================================

CREATE OR REPLACE FUNCTION decrease_batch_on_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Decrease the batch current_quantity
    UPDATE batch
    SET current_quantity = current_quantity - NEW.quantity_shipped
    WHERE batch_id = NEW.batch_id;
    
    -- Mark batch as completed if fully shipped
    UPDATE batch
    SET stage = 'Ready for Sale'
    WHERE batch_id = NEW.batch_id
      AND current_quantity = 0;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrease_batch_on_shipment
AFTER INSERT ON shipment_detail
FOR EACH ROW
EXECUTE FUNCTION decrease_batch_on_shipment();

COMMENT ON TRIGGER trg_decrease_batch_on_shipment ON shipment_detail IS 
'Automatically updates batch inventory when fish are shipped';

-- ============================================================================
-- Trigger: Prevent deletion of batches with shipment history
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_batch_deletion_with_shipments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_shipment_count INT;
BEGIN
    -- Check if batch has any shipment records
    SELECT COUNT(*) INTO v_shipment_count
    FROM shipment_detail
    WHERE batch_id = OLD.batch_id;
    
    IF v_shipment_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete batch %. It has % shipment record(s). Traceability must be maintained.',
            OLD.batch_id, v_shipment_count;
    END IF;
    
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_batch_deletion
BEFORE DELETE ON batch
FOR EACH ROW
EXECUTE FUNCTION prevent_batch_deletion_with_shipments();

COMMENT ON TRIGGER trg_prevent_batch_deletion ON batch IS 
'Prevents deletion of batches that have shipment history (maintains traceability)';

-- ============================================================================
-- Trigger: Auto-create alert for sudden mortality spike
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_mortality_spike()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_batch_quantity INT;
    v_species_name VARCHAR(100);
    v_mortality_rate DECIMAL(5,2);
    v_alert_message TEXT;
BEGIN
    -- Only process if there are deaths
    IF NEW.mortality_count = 0 OR NEW.mortality_count IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get batch details
    SELECT b.current_quantity, sp.common_name
    INTO v_batch_quantity, v_species_name
    FROM batch b
    JOIN species sp ON b.species_id = sp.species_id
    WHERE b.batch_id = NEW.batch_id;
    
    -- Calculate mortality rate for this event
    v_mortality_rate := (NEW.mortality_count::DECIMAL / NULLIF(v_batch_quantity + NEW.mortality_count, 0)) * 100;
    
    -- Create alert if single-day mortality exceeds 10%
    IF v_mortality_rate >= 10 THEN
        v_alert_message := format(
            'MORTALITY SPIKE: %s fish (%s%%) died in batch %s (%s). Immediate investigation required.',
            NEW.mortality_count,
            ROUND(v_mortality_rate, 1),
            NEW.batch_id,
            v_species_name
        );
        
        INSERT INTO alert (
            severity, 
            alert_type, 
            message, 
            batch_id, 
            tank_id,
            status
        )
        SELECT 
            CASE 
                WHEN v_mortality_rate >= 25 THEN 'critical'
                WHEN v_mortality_rate >= 15 THEN 'high'
                ELSE 'medium'
            END,
            'MORTALITY_SPIKE',
            v_alert_message,
            NEW.batch_id,
            b.tank_id,
            'open'
        FROM batch b
        WHERE b.batch_id = NEW.batch_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_detect_mortality_spike
AFTER INSERT ON health_log
FOR EACH ROW
EXECUTE FUNCTION detect_mortality_spike();

COMMENT ON TRIGGER trg_detect_mortality_spike ON health_log IS 
'Creates critical alerts when single-day mortality exceeds thresholds';

-- ============================================================================
-- Trigger: Update order total_value when order items change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Recalculate total for the order
    UPDATE customer_order
    SET total_value = (
        SELECT COALESCE(SUM(line_total), 0)
        FROM order_item
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_order_total_insert
AFTER INSERT ON order_item
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trg_update_order_total_update
AFTER UPDATE ON order_item
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trg_update_order_total_delete
AFTER DELETE ON order_item
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

COMMENT ON FUNCTION update_order_total IS 
'Automatically recalculates customer_order.total_value when items change';

-- ============================================================================
-- Trigger: Validate tank is active before assigning batch
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_active_tank()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_active BOOLEAN;
BEGIN
    -- Check if tank is active
    SELECT is_active INTO v_is_active
    FROM tank
    WHERE tank_id = NEW.tank_id;
    
    IF NOT v_is_active THEN
        RAISE EXCEPTION 'Cannot assign batch to inactive tank %', NEW.tank_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_active_tank
BEFORE INSERT OR UPDATE ON batch
FOR EACH ROW
EXECUTE FUNCTION validate_active_tank();

COMMENT ON TRIGGER trg_validate_active_tank ON batch IS 
'Ensures batches can only be assigned to active tanks';

-- ============================================================================
-- Trigger: Log water quality status based on readings
-- ============================================================================

CREATE OR REPLACE FUNCTION set_water_quality_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Default to normal
    NEW.status := 'normal';
    
    -- Check for critical conditions
    IF (NEW.ph_level IS NOT NULL AND (NEW.ph_level < 5.0 OR NEW.ph_level > 9.0)) OR
       (NEW.ammonia_level IS NOT NULL AND NEW.ammonia_level > 1.0) OR
       (NEW.dissolved_oxygen IS NOT NULL AND NEW.dissolved_oxygen < 3.0) THEN
        NEW.status := 'critical';
    -- Check for warning conditions
    ELSIF (NEW.ph_level IS NOT NULL AND (NEW.ph_level < 6.0 OR NEW.ph_level > 8.5)) OR
          (NEW.ammonia_level IS NOT NULL AND NEW.ammonia_level > 0.5) OR
          (NEW.dissolved_oxygen IS NOT NULL AND NEW.dissolved_oxygen < 5.0) THEN
        NEW.status := 'warning';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_water_quality_status
BEFORE INSERT ON water_log
FOR EACH ROW
EXECUTE FUNCTION set_water_quality_status();

COMMENT ON TRIGGER trg_set_water_quality_status ON water_log IS 
'Automatically sets water quality status based on measured parameters';

-- ============================================================================
-- SUMMARY OF TRIGGERS
-- ============================================================================
-- 1. trg_update_quantity_on_mortality - Decreases batch quantity when mortality logged
-- 2. trg_validate_shipment_quantity - Prevents over-shipping
-- 3. trg_decrease_batch_on_shipment - Updates inventory on shipment
-- 4. trg_prevent_batch_deletion - Maintains traceability
-- 5. trg_detect_mortality_spike - Creates alerts for unusual deaths
-- 6. trg_update_order_total_* - Recalculates order totals
-- 7. trg_validate_active_tank - Ensures batches use active tanks
-- 8. trg_set_water_quality_status - Auto-classifies water quality
-- ============================================================================
