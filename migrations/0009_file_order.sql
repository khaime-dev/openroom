-- A file's place in its folder, set when an admin drags files into an order. NULL = never placed:
-- those keep the old order (by name) and come after any placed files, so a new upload lands last.
ALTER TABLE files ADD COLUMN position INTEGER;
