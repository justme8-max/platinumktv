-- Add new room statuses: cleaning and maintenance
ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'cleaning';
ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'maintenance';