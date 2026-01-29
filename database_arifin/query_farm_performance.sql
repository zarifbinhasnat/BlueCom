-- View: v_farm_performance_summary
-- Purpose: High-level dashboard for farm operations and health status
-- Source: extracted from business_logic.sql

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
