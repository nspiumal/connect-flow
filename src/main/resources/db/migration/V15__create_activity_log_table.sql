-- Activity log table: records every annotated controller action
CREATE TABLE IF NOT EXISTS activity_log (
    id           CHAR(36)      NOT NULL PRIMARY KEY,
    user_name    VARCHAR(255),
    user_email   VARCHAR(255),
    action       VARCHAR(100)  NOT NULL,
    description  VARCHAR(500),
    http_method  VARCHAR(10),
    endpoint     VARCHAR(500),
    ip_address   VARCHAR(50),
    status       VARCHAR(20),
    error_message VARCHAR(1000),
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_log_created_at  (created_at),
    INDEX idx_activity_log_user_email  (user_email),
    INDEX idx_activity_log_action      (action)
);

