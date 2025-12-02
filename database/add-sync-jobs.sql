-- ============================================================================
-- SYNC JOBS TABLE - For async synchronization with progress tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_type ENUM('sync_latest', 'sync_full', 'sync_all') NOT NULL,
    lottery_type VARCHAR(50),
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    
    -- Progress tracking
    total_items INT DEFAULT 0,
    processed_items INT DEFAULT 0,
    success_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Details
    current_item VARCHAR(100) COMMENT 'Current item being processed',
    message TEXT COMMENT 'Status message or error details',
    result JSON COMMENT 'Final result data',
    
    -- Timing
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_job_type (job_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
