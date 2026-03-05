-- V1: Create initial schema with profiles table and related tables

-- Create profiles table (users table)
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    pin VARCHAR(10),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL,
    branch_id CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_branch_role (user_id, role, branch_id)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id CHAR(36) NOT NULL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nic VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    customer_type VARCHAR(50) DEFAULT 'Regular',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nic (nic),
    INDEX idx_active (is_active)
);

-- Create interest_rates table
CREATE TABLE IF NOT EXISTS interest_rates (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rate_percent DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
);

-- Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
    id CHAR(36) NOT NULL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_nic VARCHAR(50) NOT NULL,
    reason TEXT,
    police_report_number VARCHAR(100),
    police_report_date DATE,
    branch_id CHAR(36),
    added_by CHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (added_by) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_nic (customer_nic),
    INDEX idx_active (is_active)
);

-- Create pawn_transactions table
CREATE TABLE IF NOT EXISTS pawn_transactions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    customer_id CHAR(36) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_nic VARCHAR(50) NOT NULL,
    customer_type VARCHAR(50),
    pattern_mode VARCHAR(1) NOT NULL DEFAULT 'A',
    item_description TEXT,
    item_content VARCHAR(255),
    item_condition VARCHAR(50),
    weight_grams DECIMAL(10, 2),
    karat INTEGER,
    appraised_value DECIMAL(18, 2) NOT NULL,
    loan_amount DECIMAL(18, 2) NOT NULL,
    interest_rate_id CHAR(36),
    interest_rate_percent DECIMAL(5, 2),
    period_months INT DEFAULT 12,
    pawn_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    remarks TEXT,
    branch_id CHAR(36),
    created_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (interest_rate_id) REFERENCES interest_rates(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (created_by) REFERENCES profiles(id),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_pawn_date (pawn_date),
    INDEX idx_maturity_date (maturity_date),
    INDEX idx_pattern_mode (pattern_mode)
);

-- Create pawn_transaction_items table
CREATE TABLE IF NOT EXISTS pawn_transaction_items (
    id CHAR(36) NOT NULL PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    item_description TEXT,
    item_content VARCHAR(255),
    item_condition VARCHAR(50),
    weight_grams DECIMAL(10, 2),
    karat INTEGER,
    appraised_value DECIMAL(18, 2),
    item_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES pawn_transactions(id) ON DELETE CASCADE,
    INDEX idx_transaction (transaction_id)
);

-- Create pawn_transaction_item_images table
CREATE TABLE IF NOT EXISTS pawn_transaction_item_images (
    id CHAR(36) NOT NULL PRIMARY KEY,
    item_id CHAR(36) NOT NULL,
    transaction_id CHAR(36) NOT NULL,
    image_url LONGTEXT,
    image_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES pawn_transaction_items(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES pawn_transactions(id) ON DELETE CASCADE,
    INDEX idx_item (item_id),
    INDEX idx_transaction (transaction_id)
);

-- Create pawn_redemptions table
CREATE TABLE IF NOT EXISTS pawn_redemptions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    redemption_date DATE NOT NULL,
    amount_paid DECIMAL(18, 2) NOT NULL,
    remarks TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES pawn_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_transaction (transaction_id),
    INDEX idx_date (redemption_date)
);

-- Create transaction_edit_history table
CREATE TABLE IF NOT EXISTS transaction_edit_history (
    id CHAR(36) NOT NULL PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    edited_by CHAR(36),
    edit_type VARCHAR(50),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    previous_remarks TEXT,
    new_remarks TEXT,
    edit_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES pawn_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_transaction (transaction_id),
    INDEX idx_date (created_at)
);

