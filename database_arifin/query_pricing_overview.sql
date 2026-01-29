-- Query: Batch Pricing Overview
-- Purpose: Production costs and recommended selling prices for saleable batches
-- Source: extracted from business_logic.sql

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
