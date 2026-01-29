-- View: v_species_mortality_analysis
-- Purpose: Mortality rates by species to identify high-risk breeds
-- Source: extracted from business_logic.sql

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
