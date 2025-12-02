-- LotoMind Analytics Database Schema
-- Enhanced schema with maximum contextual information for predictions

-- ============================================================================
-- LOTTERY TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lottery_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    numbers_to_draw INT NOT NULL,
    min_number INT NOT NULL,
    max_number INT NOT NULL,
    draw_days VARCHAR(100) COMMENT 'JSON array of draw days',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default lottery types
INSERT INTO lottery_types (name, display_name, numbers_to_draw, min_number, max_number, draw_days) VALUES
('megasena', 'Mega-Sena', 6, 1, 60, '["Wednesday", "Saturday"]'),
('quina', 'Quina', 5, 1, 80, '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'),
('lotofacil', 'Lotofácil', 15, 1, 25, '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'),
('lotomania', 'Lotomania', 20, 1, 100, '["Tuesday", "Thursday", "Saturday"]'),
('duplasena', 'Dupla Sena', 6, 1, 50, '["Tuesday", "Thursday", "Saturday"]'),
('timemania', 'Timemania', 7, 1, 80, '["Tuesday", "Thursday", "Saturday"]'),
('diadesorte', 'Dia de Sorte', 7, 1, 31, '["Tuesday", "Thursday", "Saturday"]');

-- ============================================================================
-- DRAWS TABLE - Enhanced with maximum contextual information
-- ============================================================================
CREATE TABLE IF NOT EXISTS draws (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    concurso INT NOT NULL,
    draw_date DATE NOT NULL,
    draw_datetime DATETIME,
    
    -- Drawn Numbers (stored as JSON for flexibility)
    numbers JSON NOT NULL COMMENT 'Array of drawn numbers',
    
    -- Temporal Context
    day_of_week TINYINT COMMENT '1=Monday, 7=Sunday',
    day_of_month TINYINT,
    month TINYINT,
    quarter TINYINT COMMENT '1-4',
    year SMALLINT,
    week_of_year TINYINT,
    is_weekend BOOLEAN,
    is_month_start BOOLEAN COMMENT 'First 7 days of month',
    is_month_end BOOLEAN COMMENT 'Last 7 days of month',
    
    -- Special Events Context
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(100),
    is_special_date BOOLEAN DEFAULT FALSE COMMENT 'Christmas, New Year, etc',
    days_since_last_draw INT,
    days_until_next_draw INT,
    
    -- Numerical Statistics
    sum_of_numbers INT COMMENT 'Sum of all drawn numbers',
    average_number DECIMAL(5,2),
    median_number DECIMAL(5,2),
    std_deviation DECIMAL(5,2),
    min_drawn INT,
    max_drawn INT,
    range_span INT COMMENT 'max - min',
    
    -- Pattern Analysis
    odd_count TINYINT,
    even_count TINYINT,
    prime_count TINYINT,
    consecutive_count TINYINT COMMENT 'Count of consecutive numbers',
    has_sequence BOOLEAN COMMENT 'Has 3+ consecutive numbers',
    low_numbers_count TINYINT COMMENT 'Numbers in lower third',
    mid_numbers_count TINYINT COMMENT 'Numbers in middle third',
    high_numbers_count TINYINT COMMENT 'Numbers in upper third',
    
    -- Decade Distribution (for Mega-Sena: 1-10, 11-20, etc)
    decade_distribution JSON COMMENT 'Count per decade',
    
    -- Repetition from Previous Draws
    repeated_from_last_1 TINYINT DEFAULT 0,
    repeated_from_last_2 TINYINT DEFAULT 0,
    repeated_from_last_3 TINYINT DEFAULT 0,
    repeated_from_last_5 TINYINT DEFAULT 0,
    repeated_from_last_10 TINYINT DEFAULT 0,
    
    -- Prize Information
    accumulated BOOLEAN DEFAULT FALSE,
    accumulated_value DECIMAL(15,2),
    estimated_prize DECIMAL(15,2),
    winners_sena INT DEFAULT 0,
    winners_quina INT DEFAULT 0,
    winners_quadra INT DEFAULT 0,
    prize_sena DECIMAL(15,2),
    prize_quina DECIMAL(15,2),
    prize_quadra DECIMAL(15,2),
    total_collected DECIMAL(15,2),
    
    -- Additional Context
    city VARCHAR(100) COMMENT 'City where draw occurred',
    state VARCHAR(50),
    special_draw BOOLEAN DEFAULT FALSE COMMENT 'Mega da Virada, etc',
    special_draw_name VARCHAR(100),
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'api',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_concurso (lottery_type_id, concurso),
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_concurso (concurso),
    INDEX idx_draw_date (draw_date),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_month (month),
    INDEX idx_year (year),
    INDEX idx_accumulated (accumulated),
    INDEX idx_special_draw (special_draw),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NUMBER FREQUENCY TABLE - Track individual number statistics
-- ============================================================================
CREATE TABLE IF NOT EXISTS number_frequency (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    number INT NOT NULL,
    
    -- Frequency Metrics
    total_appearances INT DEFAULT 0,
    last_appearance_concurso INT,
    last_appearance_date DATE,
    current_delay INT DEFAULT 0 COMMENT 'Draws since last appearance',
    max_delay INT DEFAULT 0,
    average_delay DECIMAL(6,2),
    
    -- Temporal Patterns
    appearances_monday INT DEFAULT 0,
    appearances_tuesday INT DEFAULT 0,
    appearances_wednesday INT DEFAULT 0,
    appearances_thursday INT DEFAULT 0,
    appearances_friday INT DEFAULT 0,
    appearances_saturday INT DEFAULT 0,
    appearances_sunday INT DEFAULT 0,
    
    -- Recent Performance
    appearances_last_10 INT DEFAULT 0,
    appearances_last_30 INT DEFAULT 0,
    appearances_last_50 INT DEFAULT 0,
    appearances_last_100 INT DEFAULT 0,
    
    -- Position Analysis
    avg_position DECIMAL(4,2) COMMENT 'Average position when drawn (1-6 for Mega)',
    
    -- Combination Patterns
    most_common_pairs JSON COMMENT 'Numbers that appear together most',
    
    -- Metadata
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_number (lottery_type_id, number),
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_number (number),
    INDEX idx_total_appearances (total_appearances),
    INDEX idx_current_delay (current_delay),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PREDICTION STRATEGIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    category ENUM('statistical', 'pattern', 'ml', 'mathematical', 'hybrid') NOT NULL,
    description TEXT,
    parameters JSON COMMENT 'Strategy-specific parameters',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert all prediction strategies
INSERT INTO strategies (name, display_name, category, description) VALUES
-- Statistical
('frequency', 'Frequency Analysis', 'statistical', 'Analyzes most frequent numbers in recent draws'),
('delay', 'Delay/Latency', 'statistical', 'Identifies numbers with critical delay'),
('hot_cold', 'Hot & Cold Numbers', 'statistical', 'Balances hot and cold numbers'),
('moving_average', 'Moving Average', 'statistical', 'Uses moving average for trend detection'),
('standard_deviation', 'Standard Deviation', 'statistical', 'Identifies unusual frequency patterns'),

-- Pattern Recognition
('pattern_repetition', 'Pattern Repetition', 'pattern', 'Detects recurring number combinations'),
('cycle_detection', 'Cycle Detection', 'pattern', 'Identifies cyclical patterns'),
('gap_analysis', 'Gap Analysis', 'pattern', 'Analyzes gaps between appearances'),
('sum_range', 'Sum Range', 'pattern', 'Targets optimal sum range'),
('odd_even_balance', 'Odd-Even Balance', 'pattern', 'Maintains optimal odd/even distribution'),

-- Machine Learning
('neural_network', 'Neural Network (LSTM)', 'ml', 'LSTM model for sequence prediction'),
('random_forest', 'Random Forest', 'ml', 'Ensemble of decision trees'),
('clustering', 'K-Means Clustering', 'ml', 'Groups similar draw patterns'),

-- Mathematical
('fibonacci', 'Fibonacci Sequence', 'mathematical', 'Applies Fibonacci patterns'),
('markov_chain', 'Markov Chain', 'mathematical', 'Transition probability matrix'),
('monte_carlo', 'Monte Carlo Simulation', 'mathematical', 'Runs thousands of simulations'),
('bayesian', 'Bayesian Inference', 'mathematical', 'Updates probabilities with new evidence'),

-- Hybrid
('ensemble_voting', 'Ensemble Voting', 'hybrid', 'Combines top performing strategies'),
('adaptive_hybrid', 'Adaptive Hybrid', 'hybrid', 'Dynamically switches strategies'),
('genetic_algorithm', 'Genetic Algorithm', 'hybrid', 'Evolves combinations over generations');

-- ============================================================================
-- PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    target_concurso INT NOT NULL,
    
    -- Prediction Data
    predicted_numbers JSON NOT NULL,
    confidence_score DECIMAL(5,4) COMMENT '0-1 confidence level',
    
    -- Backtest Context
    based_on_draws INT COMMENT 'Number of historical draws used',
    backtest_accuracy DECIMAL(5,4) COMMENT 'Strategy accuracy in backtest',
    
    -- Status
    status ENUM('pending', 'checked', 'expired') DEFAULT 'pending',
    
    -- Results (filled after draw)
    actual_numbers JSON,
    hits INT DEFAULT 0,
    matched_numbers JSON COMMENT 'Numbers that were correct',
    prize_won DECIMAL(15,2),
    prize_category VARCHAR(50) COMMENT 'Sena, Quina, Quadra, etc',
    
    -- Metadata
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_target_concurso (target_concurso),
    INDEX idx_status (status),
    INDEX idx_hits (hits),
    INDEX idx_generated_at (generated_at),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BACKTEST RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS backtest_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    
    -- Test Configuration
    test_date DATE NOT NULL,
    draws_analyzed INT NOT NULL,
    start_concurso INT,
    end_concurso INT,
    
    -- Performance Metrics
    total_predictions INT,
    total_hits INT,
    hit_rate DECIMAL(5,4) COMMENT 'Percentage of correct predictions',
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    
    -- Hit Distribution
    hits_6 INT DEFAULT 0 COMMENT 'Sena hits',
    hits_5 INT DEFAULT 0 COMMENT 'Quina hits',
    hits_4 INT DEFAULT 0 COMMENT 'Quadra hits',
    hits_3 INT DEFAULT 0,
    hits_2 INT DEFAULT 0,
    hits_1 INT DEFAULT 0,
    hits_0 INT DEFAULT 0,
    
    -- Statistical Metrics
    avg_hits DECIMAL(4,2),
    max_hits INT,
    min_hits INT,
    std_dev_hits DECIMAL(4,2),
    
    -- Ranking
    rank_position INT COMMENT 'Rank among all strategies',
    
    -- Metadata
    execution_time_ms INT COMMENT 'Time taken to run backtest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_test_date (test_date),
    INDEX idx_hit_rate (hit_rate),
    INDEX idx_rank (rank_position),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STRATEGY PERFORMANCE TABLE - Real-time tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    
    -- Rolling Window Metrics (last N predictions)
    window_size INT DEFAULT 10,
    predictions_count INT DEFAULT 0,
    successful_predictions INT DEFAULT 0,
    success_rate DECIMAL(5,4),
    
    -- Recent Performance
    last_10_success_rate DECIMAL(5,4),
    last_30_success_rate DECIMAL(5,4),
    last_50_success_rate DECIMAL(5,4),
    
    -- Trend Analysis
    trend ENUM('improving', 'stable', 'declining', 'unknown') DEFAULT 'unknown',
    trend_confidence DECIMAL(5,4),
    
    -- Best Results
    best_hit_count INT DEFAULT 0,
    best_hit_concurso INT,
    best_hit_date DATE,
    
    -- Current Status
    is_recommended BOOLEAN DEFAULT FALSE,
    recommendation_score DECIMAL(5,4) COMMENT 'Overall recommendation score',
    
    -- Metadata
    last_prediction_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_strategy (lottery_type_id, strategy_id),
    INDEX idx_lottery_type (lottery_type_id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_success_rate (success_rate),
    INDEX idx_is_recommended (is_recommended),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTEM LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    log_level ENUM('info', 'warning', 'error', 'debug') DEFAULT 'info',
    message TEXT NOT NULL,
    context JSON COMMENT 'Additional context data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service (service_name),
    INDEX idx_level (log_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Latest Draw for Each Lottery
CREATE OR REPLACE VIEW v_latest_draws AS
SELECT 
    lt.name as lottery_name,
    lt.display_name,
    d.*
FROM draws d
INNER JOIN lottery_types lt ON d.lottery_type_id = lt.id
INNER JOIN (
    SELECT lottery_type_id, MAX(concurso) as max_concurso
    FROM draws
    GROUP BY lottery_type_id
) latest ON d.lottery_type_id = latest.lottery_type_id 
    AND d.concurso = latest.max_concurso;

-- View: Top Performing Strategies
CREATE OR REPLACE VIEW v_top_strategies AS
SELECT 
    lt.display_name as lottery_name,
    s.display_name as strategy_name,
    s.category,
    sp.success_rate,
    sp.last_10_success_rate,
    sp.predictions_count,
    sp.is_recommended,
    sp.recommendation_score
FROM strategy_performance sp
INNER JOIN lottery_types lt ON sp.lottery_type_id = lt.id
INNER JOIN strategies s ON sp.strategy_id = s.id
WHERE sp.predictions_count >= 5
ORDER BY sp.recommendation_score DESC;

-- View: Hot and Cold Numbers
CREATE OR REPLACE VIEW v_hot_cold_numbers AS
SELECT 
    lt.display_name as lottery_name,
    nf.number,
    nf.total_appearances,
    nf.current_delay,
    nf.appearances_last_10,
    nf.appearances_last_30,
    CASE 
        WHEN nf.appearances_last_10 >= 3 THEN 'hot'
        WHEN nf.current_delay >= 20 THEN 'cold'
        ELSE 'neutral'
    END as temperature
FROM number_frequency nf
INNER JOIN lottery_types lt ON nf.lottery_type_id = lt.id
ORDER BY lt.id, nf.total_appearances DESC;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Procedure: Update Number Frequency after new draw
CREATE PROCEDURE update_number_frequency(
    IN p_lottery_type_id INT,
    IN p_concurso INT,
    IN p_numbers JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE num INT;
    DECLARE numbers_count INT;
    
    SET numbers_count = JSON_LENGTH(p_numbers);
    
    WHILE i < numbers_count DO
        SET num = JSON_EXTRACT(p_numbers, CONCAT('$[', i, ']'));
        
        INSERT INTO number_frequency (
            lottery_type_id, 
            number, 
            total_appearances,
            last_appearance_concurso,
            last_appearance_date,
            current_delay
        )
        VALUES (
            p_lottery_type_id,
            num,
            1,
            p_concurso,
            (SELECT draw_date FROM draws WHERE lottery_type_id = p_lottery_type_id AND concurso = p_concurso),
            0
        )
        ON DUPLICATE KEY UPDATE
            total_appearances = total_appearances + 1,
            last_appearance_concurso = p_concurso,
            last_appearance_date = (SELECT draw_date FROM draws WHERE lottery_type_id = p_lottery_type_id AND concurso = p_concurso),
            current_delay = 0;
        
        SET i = i + 1;
    END WHILE;
    
    -- Update delay for numbers that didn't appear
    UPDATE number_frequency
    SET current_delay = current_delay + 1
    WHERE lottery_type_id = p_lottery_type_id
    AND number NOT IN (
        SELECT JSON_EXTRACT(p_numbers, CONCAT('$[', idx, ']'))
        FROM (SELECT 0 AS idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t
        WHERE idx < JSON_LENGTH(p_numbers)
    );
END //

DELIMITER ;

-- ============================================================================
-- INITIAL DATA POPULATION
-- ============================================================================

-- This will be populated by the lottery-service when it fetches historical data
-- The service will call the external API and populate draws table with all historical data since 2015

COMMIT;
