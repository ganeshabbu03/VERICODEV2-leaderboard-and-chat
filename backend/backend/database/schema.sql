USE vericode_ai;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255),

    provider ENUM('local', 'google', 'github') DEFAULT 'local',

    provider_id VARCHAR(255),

    email_verified BOOLEAN DEFAULT FALSE,

    verification_token VARCHAR(255),

    verification_expiry DATETIME,

    reset_token VARCHAR(255),

    reset_expiry DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);