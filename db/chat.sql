-- db/chat.sql 
-- This file contains SQL commands to create and modify the 'mensajes' table
ALTER TABLE mensajes
ADD COLUMN role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL DEFAULT 'user';
ALTER TABLE mensajes
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();