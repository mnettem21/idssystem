# Setup Guide for IDS Research Platform

## Overview

This guide will help you set up the complete IDS Research Platform from scratch.

## Prerequisites

Before starting, ensure you have:

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Python 3.8+**: Check with `python --version`
3. **Node.js 16+**: Check with `node --version`
4. **Git**: For cloning the repository

## Step 1: Supabase Setup

### 1.1 Create a New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: IDS Research Platform
   - Database Password: (choose a strong password)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait for the project to be fully provisioned (~2 minutes)

### 1.2 Get Project Credentials

1. In your Supabase project, go to Settings → API
2. Copy the following:
   - `Project URL` (you'll need this for SUPABASE_URL)
   - `anon public` key (you'll need this for SUPABASE_KEY)

### 1.3 Run Database Migrations

The database schema has already been created via the Supabase MCP tools. To verify tables exist:

```bash
# In Supabase Dashboard → Table Editor, you should see:
# - datasets
# - experiments
# - experiment_results
# - comparisons
```

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Create Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python3 -m venv venv
venv\Scripts\activate
```

### 2.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.4 Configure Environment

Create a `.env` file in the `backend/` directory:

```bash
# Backend .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
JWT_SECRET_KEY=your_random_secret_key_here_use_env_to_generate_a_random_string
REDIS_URL=redis://localhost:6379/0
UPLOAD_FOLDER=./data/uploads
```

**Generate JWT Secret:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 2.5 Seed Initial Datasets

```bash
python scripts/seed_datasets.py
```

This adds the default datasets to your Supabase database.

### 2.6 Start the Backend Server

```bash
python app.py
```

The backend should now be running at `http://localhost:5000`

**Note:** You may need to start Redis if background task processing is required:
```bash
redis-server
```

## Step 3: Frontend Setup

### 3.1 Navigate to Frontend Directory

Open a new terminal and:
```bash
cd frontend
```

### 3.2 Install Dependencies

```bash
npm install
```

This will install all React dependencies.

### 3.3 Configure Environment

Create a `.env` file in the `frontend/` directory:

```bash
# Frontend .env file
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

### 3.4 Start the Frontend Development Server

```bash
npm start
```

The frontend should now be running at `http://localhost:3000`

## Step 4: Verify Setup

1. Open your browser and go to `http://localhost:3000`
2. You should see the login page
3. Create an account or sign in
4. You should be redirected to the dashboard

## Step 5: Create Your First Experiment

1. Click "Create New Experiment"
2. Fill in the form:
   - Name: "Test LCCDE on CICIDS2017"
   - Description: "Testing the LCCDE algorithm"
   - Dataset: Select "CICIDS2017 Sample"
   - Algorithm: Select "LCCDE"
3. Click "Create Experiment"
4. The experiment will start processing in the background

## Common Issues and Solutions

### Issue: "Module not found" error in backend

**Solution:**
```bash
# Make sure you're in the virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Cannot connect to Supabase"

**Solution:**
- Check that your `.env` file has correct credentials
- Verify the Supabase project is active
- Check network connection

### Issue: "npm start fails"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: Datasets not showing

**Solution:**
- Run the seed script: `python backend/scripts/seed_datasets.py`
- Verify the datasets folder structure matches the paths in the database

## Next Steps

1. **Explore the Interface**: Navigate through different pages
2. **Create Experiments**: Try different algorithm configurations
3. **Compare Results**: Use the comparison feature to analyze performance
4. **Customize**: Modify algorithms or add new features

## Production Deployment

For production deployment:

1. **Backend**: Use a production WSGI server like Gunicorn
2. **Frontend**: Build with `npm run build` and serve with Nginx
3. **Database**: Use Supabase production instance
4. **Environment**: Ensure all secrets are properly secured

## Support

For issues or questions:
- Check the main README.md
- Review the API documentation
- Open an issue on GitHub

