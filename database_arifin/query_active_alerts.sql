-- Query: Active Biosecurity Alerts
-- Purpose: Shows all unresolved water quality alerts requiring immediate action
-- Source: extracted from business_logic.sql

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
