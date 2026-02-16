-- Migration: Add items, layout, and template columns to tasks table
-- For Classification, Collage, and Fill in Blanks task types

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS layout JSONB,
ADD COLUMN IF NOT EXISTS template TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tasks.items IS 'JSON array of items for classification tasks. Format: [{"id": "item1", "label": "Brand A", "image": "url1"}]';
COMMENT ON COLUMN tasks.layout IS 'Layout configuration for collage tasks. Format: {"type": "grid", "rows": 3, "cols": 3, "minImages": 3, "maxImages": 9}';
COMMENT ON COLUMN tasks.template IS 'Text template with placeholders for fill_blanks tasks. Use ____ for blanks.';
