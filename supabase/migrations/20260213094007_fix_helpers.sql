-- Fix has_role overload to match usage (user_id, role)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT has_role(_role, _user_id);
$$ LANGUAGE sql SECURITY DEFINER;

-- Define generic update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
