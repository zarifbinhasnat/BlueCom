-- Query: Financial Summary of Completed Batches
-- Purpose: Detailed P&L analysis for completed batches to assess profitability
-- Source: extracted from batch_profit_calculation.sql logic

SELECT 
    b.batch_id,
    s.common_name,
    f.farm_name,
    -- Calculate profit using the function we defined
    calculate_batch_profit(b.batch_id) AS net_profit,
    
    -- Calculate Margin %
    ROUND(
        (calculate_batch_profit(b.batch_id) / 
        NULLIF(
            (SELECT total_feed_cost + total_labor_cost + water_electricity_cost + medication_cost 
             FROM batch_financials WHERE batch_id = b.batch_id), 
        0)) * 100, 
    2) AS profit_margin_percent
FROM batch b
JOIN species s ON b.species_id = s.species_id
JOIN tank t ON b.tank_id = t.tank_id
JOIN farm f ON t.farm_id = f.farm_id
WHERE b.stage = 'Ready for Sale'
ORDER BY net_profit DESC;
