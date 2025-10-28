# Quick Start Guide

Get your IDS Research Platform running in 5 minutes!

## 1. Prerequisites Check

```bash
python --version  # Should be 3.8+
node --version    # Should be 16+
```

## 2. Supabase Setup (One-time)

1. Go to https://supabase.com and create an account
2. Create a new project
3. Copy your project URL and anon key
4. The database schema is already created in your Supabase project

## 3. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
REDIS_URL=redis://localhost:6379/0
UPLOAD_FOLDER=./data/uploads
EOF

# Seed datasets
python scripts/seed_datasets.py

# Start backend
python app.py
```

## 4. Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
REACT_APP_API_URL=http://localhost:5000/api
EOF

# Start frontend
npm start
```

## 5. Access the Platform

Open http://localhost:3000 in your browser

## 6. Create Your First Experiment

1. Sign up / Login
2. Go to "Experiments" → "New Experiment"
3. Fill in:
   - Name: "Test LCCDE"
   - Dataset: "CICIDS2017 Sample"
   - Algorithm: "LCCDE"
4. Click "Create Experiment"
5. Watch it run!

## Troubleshooting

**Backend won't start?**
- Check that .env file has correct Supabase credentials
- Make sure Python virtual environment is activated
- Try: `pip install -r requirements.txt --upgrade`

**Frontend shows errors?**
- Clear browser cache
- Check console for specific errors
- Verify .env file has correct values

**Experiments stuck in pending?**
- Check backend logs for errors
- Verify dataset files exist at specified paths
- Check Supabase connection

## Need Help?

See SETUP.md for detailed instructions.

