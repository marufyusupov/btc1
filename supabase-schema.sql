-- Create merkle_distributions table
CREATE TABLE IF NOT EXISTS merkle_distributions (
  id BIGINT PRIMARY KEY,
  merkle_root TEXT NOT NULL,
  total_rewards TEXT NOT NULL,
  claims JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_merkle_distributions_id ON merkle_distributions(id DESC);

-- Enable Row Level Security (optional, for production)
ALTER TABLE merkle_distributions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to everyone
CREATE POLICY "Allow public read access" ON merkle_distributions
  FOR SELECT
  USING (true);

-- Create policy to allow insert/update (you may want to restrict this)
CREATE POLICY "Allow authenticated insert/update" ON merkle_distributions
  FOR ALL
  USING (true);
