-- ============================================================================
-- VALIDATION SCHEMA - LotoMind Analytics
-- Extended schema for prediction validation, historical testing, and analysis
-- ============================================================================

-- ============================================================================
-- VALIDATION JOBS TABLE - Track validation processes
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    job_type ENUM('full_backtest', 'strategy_validation', 'historical_check', 'daily_prediction') NOT NULL,
    
    -- Job Configuration
    start_concurso INT,
    end_concurso INT,
    strategies_to_test JSON COMMENT 'Array of strategy IDs to test, null = all',
    
    -- Progress Tracking
    status ENUM('queued', 'running', 'paused', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
    progress_current INT DEFAULT 0,
    progress_total INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_concurso INT,
    current_strategy VARCHAR(100),
    
    -- Results Summary
    total_predictions_tested INT DEFAULT 0,
    total_hits INT DEFAULT 0,
    best_strategy_id INT,
    best_hit_count INT,
    avg_hits DECIMAL(5,2),
    
    -- Timing
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    estimated_completion TIMESTAMP NULL,
    execution_time_seconds INT,
    
    -- Error Handling
    error_message TEXT,
    retry_count INT DEFAULT 0,
    
    -- Metadata
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_status (status),
    INDEX idx_job_type (job_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (best_strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VALIDATION RESULTS TABLE - Detailed results per concurso/strategy
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    validation_job_id INT NOT NULL,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    concurso INT NOT NULL,
    
    -- Prediction Details
    predicted_numbers JSON NOT NULL,
    actual_numbers JSON NOT NULL,
    matched_numbers JSON COMMENT 'Numbers that matched',
    hits INT NOT NULL DEFAULT 0,
    
    -- Analysis Details
    prediction_sum INT COMMENT 'Sum of predicted numbers',
    actual_sum INT COMMENT 'Sum of actual numbers',
    sum_difference INT,
    odd_even_predicted VARCHAR(20) COMMENT 'e.g., "3-3" for 3 odd, 3 even',
    odd_even_actual VARCHAR(20),
    
    -- Strategy Metadata
    confidence_score DECIMAL(5,4),
    strategy_parameters JSON COMMENT 'Parameters used for this prediction',
    reasoning TEXT COMMENT 'Explanation of how strategy arrived at prediction',
    
    -- Historical Context
    draws_used_for_prediction INT COMMENT 'How many historical draws were analyzed',
    prediction_timestamp TIMESTAMP,
    
    -- Performance Flags
    is_perfect_match BOOLEAN DEFAULT FALSE COMMENT 'All 6 numbers correct',
    is_quina BOOLEAN DEFAULT FALSE COMMENT '5 numbers correct',
    is_quadra BOOLEAN DEFAULT FALSE COMMENT '4 numbers correct',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_job_strategy_concurso (validation_job_id, strategy_id, concurso),
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_concurso (concurso),
    INDEX idx_hits (hits),
    INDEX idx_validation_job (validation_job_id),
    FOREIGN KEY (validation_job_id) REFERENCES validation_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STRATEGY HISTORICAL PERFORMANCE TABLE - Aggregated per strategy
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_historical_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    
    -- Overall Performance
    total_predictions INT DEFAULT 0,
    total_hits INT DEFAULT 0,
    perfect_matches INT DEFAULT 0 COMMENT '6/6 hits',
    quina_matches INT DEFAULT 0 COMMENT '5/6 hits',
    quadra_matches INT DEFAULT 0 COMMENT '4/6 hits',
    terno_matches INT DEFAULT 0 COMMENT '3/6 hits',
    
    -- Statistics
    avg_hits DECIMAL(5,3),
    max_hits INT DEFAULT 0,
    min_hits INT DEFAULT 0,
    std_dev_hits DECIMAL(5,3),
    hit_rate_4plus DECIMAL(5,4) COMMENT 'Percentage with 4+ hits',
    hit_rate_5plus DECIMAL(5,4) COMMENT 'Percentage with 5+ hits',
    
    -- Ranking
    overall_rank INT,
    category_rank INT COMMENT 'Rank within strategy category',
    
    -- Trend Analysis
    last_30_avg_hits DECIMAL(5,3),
    last_60_avg_hits DECIMAL(5,3),
    last_100_avg_hits DECIMAL(5,3),
    performance_trend ENUM('improving', 'stable', 'declining') DEFAULT 'stable',
    
    -- Best Performance
    best_concurso INT,
    best_concurso_hits INT,
    best_concurso_date DATE,
    
    -- Recent Activity
    last_prediction_concurso INT,
    last_prediction_hits INT,
    last_validated_at TIMESTAMP,
    
    -- Special Events Performance (Mega da Virada, etc)
    special_events_tested INT DEFAULT 0,
    special_events_avg_hits DECIMAL(5,3),
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_strategy (lottery_type_id, strategy_id),
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_overall_rank (overall_rank),
    INDEX idx_hit_rate (hit_rate_4plus),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DAILY PREDICTIONS TABLE - Pre-generated predictions for upcoming draws
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    target_concurso INT NOT NULL,
    target_draw_date DATE NOT NULL,
    
    -- Prediction Status
    status ENUM('pending', 'validated', 'expired') DEFAULT 'pending',
    
    -- All Strategy Predictions (stored as JSON for flexibility)
    predictions JSON NOT NULL COMMENT 'Array of {strategyId, numbers, confidence}',
    
    -- Recommended Prediction
    recommended_strategy_id INT,
    recommended_numbers JSON,
    recommended_confidence DECIMAL(5,4),
    
    -- After Draw Validation
    actual_numbers JSON,
    validation_results JSON COMMENT 'Array of {strategyId, hits, matched}',
    best_performing_strategy_id INT,
    best_hits INT,
    
    -- Metadata
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,
    
    UNIQUE KEY unique_lottery_concurso (lottery_type_id, target_concurso),
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_status (status),
    INDEX idx_target_date (target_draw_date),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (recommended_strategy_id) REFERENCES strategies(id) ON DELETE SET NULL,
    FOREIGN KEY (best_performing_strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SPECIAL DRAWS TABLE - Mega da Virada and other special events
-- ============================================================================
CREATE TABLE IF NOT EXISTS special_draws (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    concurso INT NOT NULL,
    draw_date DATE NOT NULL,
    
    -- Special Event Info
    event_name VARCHAR(100) NOT NULL COMMENT 'Mega da Virada, Lotofácil da Independência, etc',
    event_type ENUM('yearly', 'seasonal', 'promotional', 'other') DEFAULT 'yearly',
    
    -- Historical Data
    numbers JSON NOT NULL,
    accumulated_prize DECIMAL(20,2),
    winners_count INT,
    
    -- Strategy Analysis for Special Events
    best_strategy_id INT,
    best_strategy_prediction JSON,
    best_strategy_hits INT,
    all_strategies_results JSON COMMENT 'Results from all strategies for this special draw',
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_concurso (lottery_type_id, concurso),
    INDEX idx_event_name (event_name),
    INDEX idx_event_type (event_type),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (best_strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WEBSOCKET EVENTS LOG - Track real-time events
-- ============================================================================
CREATE TABLE IF NOT EXISTS websocket_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    channel VARCHAR(100),
    payload JSON,
    clients_notified INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS FOR VALIDATION ANALYTICS
-- ============================================================================

-- View: Strategy Rankings by Lottery Type
CREATE OR REPLACE VIEW v_strategy_rankings AS
SELECT 
    lt.name as lottery_type,
    lt.display_name as lottery_display_name,
    s.name as strategy_name,
    s.display_name as strategy_display_name,
    s.category as strategy_category,
    shp.total_predictions,
    shp.avg_hits,
    shp.max_hits,
    shp.hit_rate_4plus,
    shp.hit_rate_5plus,
    shp.perfect_matches,
    shp.quina_matches,
    shp.quadra_matches,
    shp.overall_rank,
    shp.performance_trend,
    shp.last_validated_at
FROM strategy_historical_performance shp
JOIN lottery_types lt ON shp.lottery_type_id = lt.id
JOIN strategies s ON shp.strategy_id = s.id
ORDER BY lt.id, shp.overall_rank;

-- View: Recent Validation Results
CREATE OR REPLACE VIEW v_recent_validations AS
SELECT 
    vr.concurso,
    lt.display_name as lottery_name,
    s.display_name as strategy_name,
    vr.predicted_numbers,
    vr.actual_numbers,
    vr.matched_numbers,
    vr.hits,
    vr.confidence_score,
    vr.is_perfect_match,
    vr.is_quina,
    vr.is_quadra,
    vr.created_at
FROM validation_results vr
JOIN lottery_types lt ON vr.lottery_type_id = lt.id
JOIN strategies s ON vr.strategy_id = s.id
ORDER BY vr.concurso DESC, vr.hits DESC
LIMIT 1000;

-- View: Today's Predictions
CREATE OR REPLACE VIEW v_todays_predictions AS
SELECT 
    dp.target_concurso,
    lt.display_name as lottery_name,
    dp.target_draw_date,
    dp.status,
    dp.recommended_numbers,
    s.display_name as recommended_strategy,
    dp.recommended_confidence,
    dp.actual_numbers,
    dp.best_hits,
    dp.generated_at
FROM daily_predictions dp
JOIN lottery_types lt ON dp.lottery_type_id = lt.id
LEFT JOIN strategies s ON dp.recommended_strategy_id = s.id
WHERE dp.target_draw_date >= CURDATE()
ORDER BY dp.target_draw_date, lt.id;

-- ============================================================================
-- STORED PROCEDURES FOR VALIDATION
-- ============================================================================

DELIMITER //

-- Procedure: Update strategy historical performance after validation
CREATE PROCEDURE update_strategy_performance(
    IN p_lottery_type_id INT,
    IN p_strategy_id INT
)
BEGIN
    DECLARE v_total_predictions INT;
    DECLARE v_total_hits INT;
    DECLARE v_avg_hits DECIMAL(5,3);
    DECLARE v_max_hits INT;
    DECLARE v_min_hits INT;
    DECLARE v_perfect INT;
    DECLARE v_quina INT;
    DECLARE v_quadra INT;
    DECLARE v_terno INT;
    
    -- Calculate aggregates
    SELECT 
        COUNT(*),
        SUM(hits),
        AVG(hits),
        MAX(hits),
        MIN(hits),
        SUM(CASE WHEN hits = 6 THEN 1 ELSE 0 END),
        SUM(CASE WHEN hits = 5 THEN 1 ELSE 0 END),
        SUM(CASE WHEN hits = 4 THEN 1 ELSE 0 END),
        SUM(CASE WHEN hits = 3 THEN 1 ELSE 0 END)
    INTO 
        v_total_predictions,
        v_total_hits,
        v_avg_hits,
        v_max_hits,
        v_min_hits,
        v_perfect,
        v_quina,
        v_quadra,
        v_terno
    FROM validation_results
    WHERE lottery_type_id = p_lottery_type_id
    AND strategy_id = p_strategy_id;
    
    -- Insert or update performance record
    INSERT INTO strategy_historical_performance (
        lottery_type_id,
        strategy_id,
        total_predictions,
        total_hits,
        avg_hits,
        max_hits,
        min_hits,
        perfect_matches,
        quina_matches,
        quadra_matches,
        terno_matches,
        hit_rate_4plus,
        hit_rate_5plus,
        last_validated_at
    ) VALUES (
        p_lottery_type_id,
        p_strategy_id,
        v_total_predictions,
        v_total_hits,
        v_avg_hits,
        v_max_hits,
        v_min_hits,
        v_perfect,
        v_quina,
        v_quadra,
        v_terno,
        (v_quadra + v_quina + v_perfect) / v_total_predictions,
        (v_quina + v_perfect) / v_total_predictions,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_predictions = v_total_predictions,
        total_hits = v_total_hits,
        avg_hits = v_avg_hits,
        max_hits = v_max_hits,
        min_hits = v_min_hits,
        perfect_matches = v_perfect,
        quina_matches = v_quina,
        quadra_matches = v_quadra,
        terno_matches = v_terno,
        hit_rate_4plus = (v_quadra + v_quina + v_perfect) / v_total_predictions,
        hit_rate_5plus = (v_quina + v_perfect) / v_total_predictions,
        last_validated_at = NOW();
        
    -- Update rankings
    SET @rank := 0;
    UPDATE strategy_historical_performance shp
    JOIN (
        SELECT id, @rank := @rank + 1 as new_rank
        FROM strategy_historical_performance
        WHERE lottery_type_id = p_lottery_type_id
        ORDER BY avg_hits DESC, hit_rate_4plus DESC
    ) ranked ON shp.id = ranked.id
    SET shp.overall_rank = ranked.new_rank
    WHERE shp.lottery_type_id = p_lottery_type_id;
END //

DELIMITER ;

COMMIT;
