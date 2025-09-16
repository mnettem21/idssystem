-- IDS-ML Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth, but we can reference it)
-- Supabase automatically creates auth.users table

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  size_mb FLOAT,
  features INTEGER,
  samples INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  model_type VARCHAR(100) NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training runs table
CREATE TABLE training_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  metrics JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiments table
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  input_data JSONB,
  prediction JSONB,
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_datasets_project_id ON datasets(project_id);
CREATE INDEX idx_models_project_id ON models(project_id);
CREATE INDEX idx_training_runs_model_id ON training_runs(model_id);
CREATE INDEX idx_experiments_project_id ON experiments(project_id);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);

-- Row Level Security (RLS) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Datasets policies
CREATE POLICY "Users can view datasets in their projects" ON datasets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = datasets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create datasets in their projects" ON datasets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = datasets.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Models policies
CREATE POLICY "Users can view models in their projects" ON models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = models.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create models in their projects" ON models
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = models.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Training runs policies
CREATE POLICY "Users can view training runs for their models" ON training_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM models
      JOIN projects ON projects.id = models.project_id
      WHERE models.id = training_runs.model_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create training runs for their models" ON training_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM models
      JOIN projects ON projects.id = models.project_id
      WHERE models.id = training_runs.model_id
      AND projects.user_id = auth.uid()
    )
  );

-- Similar policies for experiments and predictions
CREATE POLICY "Users can view experiments in their projects" ON experiments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = experiments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view predictions for their models" ON predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM models
      JOIN projects ON projects.id = models.project_id
      WHERE models.id = predictions.model_id
      AND projects.user_id = auth.uid()
    )
  );