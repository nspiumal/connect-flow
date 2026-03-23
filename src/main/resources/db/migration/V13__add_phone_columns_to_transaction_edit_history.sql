ALTER TABLE transaction_edit_history
    ADD COLUMN previous_phone VARCHAR(50) NULL,
    ADD COLUMN new_phone VARCHAR(50) NULL;

