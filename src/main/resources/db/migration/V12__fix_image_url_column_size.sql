-- V12__fix_image_url_column_size.sql
-- Modify image_url column to LONGTEXT to support large base64-encoded images

ALTER TABLE pawn_transaction_item_images
MODIFY COLUMN image_url LONGTEXT NOT NULL;

-- Verify the change
-- SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'pawn_transaction_item_images' AND COLUMN_NAME = 'image_url';

