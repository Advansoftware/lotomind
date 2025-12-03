-- ============================================================================
-- AUTO-REFINEMENT SYSTEM TABLES
-- Sistema de auto-ajuste de estratégias para todas as modalidades
-- ============================================================================

-- ============================================================================
-- STRATEGY_WEIGHTS TABLE - Pesos dinâmicos por estratégia/loteria
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_weights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    
    -- Pesos dinâmicos (0.0 a 1.0, onde 1.0 = máxima confiança)
    weight DECIMAL(6,4) DEFAULT 0.5000,
    
    -- Pesos por tipo de acerto (priorizando prêmio máximo)
    weight_max_prize DECIMAL(6,4) DEFAULT 0.5000 COMMENT 'Peso para prêmio máximo (sena, 15 acertos, etc)',
    weight_second_prize DECIMAL(6,4) DEFAULT 0.5000 COMMENT 'Peso para segundo prêmio (quina, 14 acertos, etc)',
    weight_third_prize DECIMAL(6,4) DEFAULT 0.5000 COMMENT 'Peso para terceiro prêmio (quadra, 13 acertos, etc)',
    
    -- Parâmetros ajustáveis da estratégia
    parameters JSON COMMENT 'Parâmetros específicos da estratégia que podem ser ajustados',
    
    -- Métricas de performance
    confidence DECIMAL(5,4) DEFAULT 0 COMMENT 'Confiança baseada em volume de testes',
    hit_rate DECIMAL(5,4) DEFAULT 0 COMMENT 'Taxa de acertos premiados',
    avg_hits DECIMAL(5,2) DEFAULT 0 COMMENT 'Média de acertos',
    total_predictions INT DEFAULT 0 COMMENT 'Total de predições testadas',
    successful_predictions INT DEFAULT 0 COMMENT 'Predições premiadas',
    recent_performance DECIMAL(6,4) DEFAULT 0 COMMENT 'Performance nos últimos 50 concursos',
    trend VARCHAR(20) DEFAULT 'stable' COMMENT 'improving, stable, declining',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    generation INT DEFAULT 1 COMMENT 'Geração evolutiva',
    last_calculated TIMESTAMP NULL,
    last_refinement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_strategy (lottery_type_id, strategy_id),
    INDEX idx_weight (weight DESC),
    INDEX idx_lottery (lottery_type_id),
    INDEX idx_active (is_active),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REFINEMENT_JOBS TABLE - Jobs de refinamento
-- ============================================================================
CREATE TABLE IF NOT EXISTS refinement_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT,
    
    -- Tipo de refinamento
    refinement_type ENUM('weight_adjustment', 'genetic_evolution', 'parameter_tuning', 'ensemble_optimization', 'full_cycle') DEFAULT 'full_cycle',
    
    -- Status
    status ENUM('queued', 'running', 'completed', 'failed') DEFAULT 'queued',
    
    -- Progresso
    progress_current INT DEFAULT 0,
    progress_total INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Configuração
    config JSON COMMENT 'Configurações do refinamento',
    
    -- Resultados
    results JSON COMMENT 'Resultados do refinamento',
    strategies_improved INT DEFAULT 0,
    avg_improvement DECIMAL(6,4) DEFAULT 0,
    best_improvement DECIMAL(6,4) DEFAULT 0,
    best_strategy_id INT,
    
    -- Métricas antes/depois
    metrics_before JSON,
    metrics_after JSON,
    
    -- Timing
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    execution_time_seconds INT,
    
    -- Erro
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_lottery (lottery_type_id),
    INDEX idx_type (refinement_type),
    INDEX idx_started (started_at),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REFINEMENT_HISTORY TABLE - Histórico de ajustes
-- ============================================================================
CREATE TABLE IF NOT EXISTS refinement_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    refinement_job_id INT,
    lottery_type_id INT NOT NULL,
    strategy_id INT NOT NULL,
    
    -- Valores antes/depois
    previous_weight DECIMAL(6,4),
    new_weight DECIMAL(6,4),
    weight_before DECIMAL(6,4),
    weight_after DECIMAL(6,4),
    parameters_before JSON,
    parameters_after JSON,
    
    -- Razão do ajuste
    change_reason VARCHAR(255) COMMENT 'Por que o ajuste foi feito',
    reason VARCHAR(255) COMMENT 'Alias para change_reason',
    
    -- Dados de performance
    performance_data JSON COMMENT 'Métricas que justificam o ajuste',
    
    -- Métricas que justificam
    max_hits_achieved INT,
    avg_hits_before DECIMAL(5,2),
    avg_hits_after DECIMAL(5,2),
    
    -- Impacto calculado
    expected_improvement DECIMAL(6,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job (refinement_job_id),
    INDEX idx_strategy (strategy_id),
    INDEX idx_lottery (lottery_type_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (refinement_job_id) REFERENCES refinement_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STRATEGY_EVOLUTION TABLE - Evolução genética das estratégias
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_evolution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    
    -- Geração
    generation INT NOT NULL,
    
    -- DNA da estratégia
    strategy_dna JSON NOT NULL COMMENT 'DNA representando parâmetros da estratégia',
    
    -- Cromossomo (representação da combinação de estratégias)
    chromosome JSON COMMENT 'Array de {strategyId, weight, parameters}',
    
    -- Fitness (quanto maior, melhor)
    fitness_score DECIMAL(10,4) NOT NULL,
    fitness_max_hits INT DEFAULT 0 COMMENT 'Maior acerto alcançado',
    fitness_avg_hits DECIMAL(5,2) DEFAULT 0,
    fitness_prize_rate DECIMAL(6,4) DEFAULT 0 COMMENT 'Taxa de acertos premiados',
    
    -- Status
    is_elite BOOLEAN DEFAULT FALSE COMMENT 'Top 10% da geração',
    is_best_ever BOOLEAN DEFAULT FALSE COMMENT 'Melhor de todas as gerações',
    
    -- Origem
    parent_ids VARCHAR(255) COMMENT 'IDs dos pais separados por vírgula',
    parent1_id INT COMMENT 'ID do primeiro pai (crossover)',
    parent2_id INT COMMENT 'ID do segundo pai (crossover)',
    mutations JSON COMMENT 'Mutações aplicadas',
    mutation_rate DECIMAL(4,2) DEFAULT 0,
    
    -- Validação
    tested_on_concursos INT DEFAULT 0,
    last_tested_concurso INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_lottery_generation (lottery_type_id, generation),
    INDEX idx_fitness (fitness_score DESC),
    INDEX idx_elite (is_elite),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STRATEGY_COMBINATIONS TABLE - Combinações híbridas de estratégias
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_combinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    lottery_type_id INT NOT NULL,
    strategy_weights JSON NOT NULL COMMENT 'Mapa de {strategyName: weight}',
    combined_hit_rate DECIMAL(6,4) DEFAULT 0,
    combined_avg_hits DECIMAL(5,2) DEFAULT 0,
    total_tests INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lottery (lottery_type_id),
    INDEX idx_active (is_active),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ENSEMBLE_CONFIGS TABLE - Configurações de ensemble otimizadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS ensemble_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    
    -- Nome da configuração
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Estratégias incluídas e seus pesos
    strategies JSON NOT NULL COMMENT 'Array de {strategyId, weight}',
    
    -- Método de votação
    voting_method ENUM('weighted', 'majority', 'ranked', 'threshold') DEFAULT 'weighted',
    threshold DECIMAL(4,2) DEFAULT 0.5 COMMENT 'Threshold para votação threshold',
    
    -- Performance
    total_tests INT DEFAULT 0,
    avg_hits DECIMAL(5,2) DEFAULT 0,
    max_hits INT DEFAULT 0,
    prize_count INT DEFAULT 0 COMMENT 'Quantas vezes acertou prêmio',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_best BOOLEAN DEFAULT FALSE COMMENT 'Melhor ensemble para esta loteria',
    
    -- Metadata
    created_by ENUM('manual', 'auto_refinement', 'genetic_evolution') DEFAULT 'auto_refinement',
    generation INT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_lottery_name (lottery_type_id, name),
    INDEX idx_active (is_active),
    INDEX idx_best (is_best),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PRIZE_TIERS TABLE - Níveis de prêmio por modalidade
-- ============================================================================
CREATE TABLE IF NOT EXISTS prize_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_type_id INT NOT NULL,
    
    -- Configuração do nível de prêmio
    tier_name VARCHAR(50) NOT NULL COMMENT 'sena, quina, quadra, 15 acertos, etc',
    hits_required INT NOT NULL COMMENT 'Quantidade de acertos necessários',
    tier_priority INT NOT NULL COMMENT '1 = prêmio máximo, 2 = segundo prêmio, etc',
    
    -- Peso para cálculo de fitness
    fitness_multiplier DECIMAL(6,2) DEFAULT 1.0 COMMENT 'Multiplicador para cálculo de fitness',
    
    -- Descrição
    description VARCHAR(255),
    
    UNIQUE KEY unique_lottery_tier (lottery_type_id, tier_name),
    INDEX idx_priority (tier_priority),
    FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir níveis de prêmio para cada modalidade
INSERT INTO prize_tiers (lottery_type_id, tier_name, hits_required, tier_priority, fitness_multiplier, description) VALUES
-- Mega-Sena (lottery_type_id = 1)
(1, 'sena', 6, 1, 1000.0, 'Prêmio máximo - 6 acertos'),
(1, 'quina', 5, 2, 50.0, 'Segundo prêmio - 5 acertos'),
(1, 'quadra', 4, 3, 5.0, 'Terceiro prêmio - 4 acertos'),

-- Quina (lottery_type_id = 2)
(2, 'quina', 5, 1, 1000.0, 'Prêmio máximo - 5 acertos'),
(2, 'quadra', 4, 2, 50.0, 'Segundo prêmio - 4 acertos'),
(2, 'terno', 3, 3, 5.0, 'Terceiro prêmio - 3 acertos'),

-- Lotofácil (lottery_type_id = 3)
(3, '15_acertos', 15, 1, 1000.0, 'Prêmio máximo - 15 acertos'),
(3, '14_acertos', 14, 2, 100.0, 'Segundo prêmio - 14 acertos'),
(3, '13_acertos', 13, 3, 20.0, 'Terceiro prêmio - 13 acertos'),
(3, '12_acertos', 12, 4, 5.0, 'Quarto prêmio - 12 acertos'),
(3, '11_acertos', 11, 5, 1.0, 'Quinto prêmio - 11 acertos'),

-- Lotomania (lottery_type_id = 4)
(4, '20_acertos', 20, 1, 1000.0, 'Prêmio máximo - 20 acertos'),
(4, '19_acertos', 19, 2, 200.0, 'Segundo prêmio - 19 acertos'),
(4, '18_acertos', 18, 3, 50.0, 'Terceiro prêmio - 18 acertos'),
(4, '17_acertos', 17, 4, 10.0, 'Quarto prêmio - 17 acertos'),
(4, '16_acertos', 16, 5, 2.0, 'Quinto prêmio - 16 acertos'),
(4, '0_acertos', 0, 6, 500.0, 'Prêmio especial - 0 acertos'),

-- Dupla Sena (lottery_type_id = 5)
(5, 'sena', 6, 1, 1000.0, 'Prêmio máximo - 6 acertos'),
(5, 'quina', 5, 2, 50.0, 'Segundo prêmio - 5 acertos'),
(5, 'quadra', 4, 3, 5.0, 'Terceiro prêmio - 4 acertos'),
(5, 'terno', 3, 4, 1.0, 'Quarto prêmio - 3 acertos'),

-- Timemania (lottery_type_id = 6)
(6, '7_acertos', 7, 1, 1000.0, 'Prêmio máximo - 7 acertos'),
(6, '6_acertos', 6, 2, 100.0, 'Segundo prêmio - 6 acertos'),
(6, '5_acertos', 5, 3, 20.0, 'Terceiro prêmio - 5 acertos'),
(6, '4_acertos', 4, 4, 5.0, 'Quarto prêmio - 4 acertos'),
(6, '3_acertos', 3, 5, 1.0, 'Quinto prêmio - 3 acertos'),

-- Dia de Sorte (lottery_type_id = 7)
(7, '7_acertos', 7, 1, 1000.0, 'Prêmio máximo - 7 acertos'),
(7, '6_acertos', 6, 2, 100.0, 'Segundo prêmio - 6 acertos'),
(7, '5_acertos', 5, 3, 20.0, 'Terceiro prêmio - 5 acertos'),
(7, '4_acertos', 4, 4, 5.0, 'Quarto prêmio - 4 acertos');

-- ============================================================================
-- INICIALIZAR PESOS DAS ESTRATÉGIAS PARA TODAS AS LOTERIAS
-- ============================================================================
INSERT INTO strategy_weights (lottery_type_id, strategy_id, weight, weight_max_prize, weight_second_prize, weight_third_prize)
SELECT lt.id, s.id, 0.5000, 0.5000, 0.5000, 0.5000
FROM lottery_types lt
CROSS JOIN strategies s
WHERE s.active = TRUE
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- STORED PROCEDURE: Calcular Fitness Score
-- ============================================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS calculate_fitness_score(
    IN p_lottery_type_id INT,
    IN p_strategy_id INT,
    OUT p_fitness_score DECIMAL(10,4)
)
BEGIN
    DECLARE v_total_predictions INT DEFAULT 0;
    DECLARE v_weighted_hits DECIMAL(15,4) DEFAULT 0;
    
    -- Calcular fitness baseado nos níveis de prêmio
    SELECT 
        COUNT(*),
        SUM(
            CASE 
                WHEN vr.hits >= pt.hits_required THEN pt.fitness_multiplier
                ELSE vr.hits * 0.1
            END
        )
    INTO v_total_predictions, v_weighted_hits
    FROM validation_results vr
    LEFT JOIN prize_tiers pt ON pt.lottery_type_id = vr.lottery_type_id 
        AND vr.hits >= pt.hits_required
    WHERE vr.lottery_type_id = p_lottery_type_id 
        AND vr.strategy_id = p_strategy_id;
    
    -- Calcular score (média ponderada)
    IF v_total_predictions > 0 THEN
        SET p_fitness_score = v_weighted_hits / v_total_predictions;
    ELSE
        SET p_fitness_score = 0;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- STORED PROCEDURE: Ajustar Pesos Automaticamente
-- ============================================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auto_adjust_weights(
    IN p_lottery_type_id INT
)
BEGIN
    DECLARE v_max_fitness DECIMAL(10,4);
    DECLARE v_min_fitness DECIMAL(10,4);
    
    -- Criar tabela temporária com fitness scores
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_fitness (
        strategy_id INT,
        fitness DECIMAL(10,4)
    );
    
    TRUNCATE TABLE temp_fitness;
    
    -- Calcular fitness para cada estratégia
    INSERT INTO temp_fitness (strategy_id, fitness)
    SELECT 
        s.id,
        COALESCE(
            (
                SELECT SUM(
                    CASE 
                        WHEN vr.hits >= COALESCE(pt.hits_required, 0) THEN COALESCE(pt.fitness_multiplier, 1)
                        ELSE vr.hits * 0.1
                    END
                ) / NULLIF(COUNT(*), 0)
                FROM validation_results vr
                LEFT JOIN prize_tiers pt ON pt.lottery_type_id = vr.lottery_type_id 
                    AND vr.hits >= pt.hits_required
                    AND pt.tier_priority = 1
                WHERE vr.lottery_type_id = p_lottery_type_id 
                    AND vr.strategy_id = s.id
            ),
            0
        ) as fitness
    FROM strategies s
    WHERE s.active = TRUE;
    
    -- Obter min/max para normalização
    SELECT MAX(fitness), MIN(fitness) INTO v_max_fitness, v_min_fitness FROM temp_fitness;
    
    -- Atualizar pesos normalizados (0.1 a 1.0)
    UPDATE strategy_weights sw
    JOIN temp_fitness tf ON sw.strategy_id = tf.strategy_id
    SET 
        sw.weight = CASE 
            WHEN v_max_fitness = v_min_fitness THEN 0.5
            ELSE 0.1 + 0.9 * (tf.fitness - v_min_fitness) / (v_max_fitness - v_min_fitness)
        END,
        sw.recent_performance = tf.fitness,
        sw.last_refinement = CURRENT_TIMESTAMP
    WHERE sw.lottery_type_id = p_lottery_type_id;
    
    DROP TEMPORARY TABLE IF EXISTS temp_fitness;
END //
DELIMITER ;
