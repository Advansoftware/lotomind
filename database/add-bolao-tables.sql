-- Bolão (Mega da Virada) Tables
-- Run this SQL to add the bolão feature tables

-- ============================================================================
-- BOLAOS TABLE - Main bolão entity
-- ============================================================================
CREATE TABLE IF NOT EXISTS bolaos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    year INT NOT NULL DEFAULT 2025,
    price_per_game DECIMAL(10,2) NOT NULL DEFAULT 6.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_year (year),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BOLAO_PARTICIPANTS TABLE - Participants in a bolão
-- ============================================================================
CREATE TABLE IF NOT EXISTS bolao_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bolao_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bolao_id (bolao_id),
    INDEX idx_paid (paid),
    FOREIGN KEY (bolao_id) REFERENCES bolaos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BOLAO_GAMES TABLE - Games (6 numbers each) for each participant
-- ============================================================================
CREATE TABLE IF NOT EXISTS bolao_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    numbers JSON NOT NULL COMMENT 'Array of 6 numbers',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_participant_id (participant_id),
    FOREIGN KEY (participant_id) REFERENCES bolao_participants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
