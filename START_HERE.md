# 🚀 IDS Research Platform - Start Here

## Welcome!

You now have a complete research platform for Intrusion Detection Systems (IDS) with Machine Learning. This system replaces the Jupyter notebook workflow with a professional web-based interface.

## 📋 What You Have

### Complete Platform with:
- ✅ **Web-based Interface**: React frontend for easy interaction
- ✅ **Flask Backend**: RESTful API for processing
- ✅ **Supabase Database**: Cloud-hosted PostgreSQL with auth
- ✅ **LCCDE Algorithm**: Fully implemented from the research paper
- ✅ **Background Processing**: Non-blocking experiment execution
- ✅ **Results Tracking**: Comprehensive metrics storage
- ✅ **Comparison Tools**: Compare multiple experiments

### Key Capabilities:
1. **Create Experiments**: Run LCCDE on different datasets with custom parameters
2. **Track Progress**: Real-time status updates (pending → running → completed)
3. **Analyze Results**: View accuracy, F1 scores, confusion matrices
4. **Compare Experiments**: Side-by-side performance comparison
5. **Optimize Parameters**: Test different configurations and compare

## 🎯 Quick Start (5 minutes)

### 1. Set Up Supabase (One-time)
```bash
# Get your credentials from https://supabase.com
# - Go to your project → Settings → API
# - Copy: Project URL and anon key
```

### 2. Configure Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env  # or use any editor
```

Add to `.env`:
```bash
SUPABASE_URL=your_url_here
SUPABASE_KEY=your_key_here
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
REDIS_URL=redis://localhost:6379/0
UPLOAD_FOLDER=./data/uploads
```

### 3. Seed Datasets
```bash
python scripts/seed_datasets.py
```

### 4. Start Backend
```bash
python app.py
# Backend runs on http://localhost:5000
```

### 5. Configure Frontend (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
nano .env
```

Add to `.env`:
```bash
REACT_APP_SUPABASE_URL=your_url_here
REACT_APP_SUPABASE_ANON_KEY=your_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

### 6. Start Frontend
```bash
npm start
# Opens http://localhost:3000
```

## 🎉 You're Ready!

1. **Open** http://localhost:3000
2. **Sign Up** for an account
3. **Create** your first experiment:
   - Click "New Experiment"
   - Select "CICIDS2017 Sample" dataset
   - Choose "LCCDE" algorithm
   - Click "Create Experiment"
4. **Watch** it run (2-5 minutes)
5. **View** the results!

## 📚 Documentation

- **README.md**: Complete project documentation
- **SETUP.md**: Detailed setup instructions
- **QUICK_START.md**: Quick reference guide
- **PROJECT_STRUCTURE.md**: Architecture overview
- **IMPLEMENTATION_SUMMARY.md**: What's been built

## 🧪 Validating the LCCDE Paper

The platform is designed to validate results from:
> L. Yang, A. Shami, G. Stevens, and S. DeRusett, "LCCDE: A Decision-Based Ensemble Framework for Intrusion Detection in The Internet of Vehicles," 2022 IEEE Global Communications Conference (GLOBECOM)

**Expected Results:**
- Accuracy: ~99.74%
- F1 Score (weighted): ~99.74%
- Outperforms individual base learners

## 🔧 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │────▶│  Flask API   │────▶│  Supabase   │
│  Frontend   │     │   Backend    │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ ML Detection │
                    │    Engine    │
                    │  (LCCDE, etc)│
                    └──────────────┘
```

## 💡 Key Features

### For Researchers:
- **No more notebook mess**: Clean web interface
- **Automated execution**: Set it and forget it
- **Easy comparison**: Compare experiments side-by-side
- **Parameter optimization**: Test configurations systematically
- **Historical tracking**: See your progress over time

### For Teams:
- **Multi-user**: Each researcher has their own experiments
- **Shared datasets**: Common datasets for all users
- **Collaboration**: Compare your experiments with others

## 🐛 Troubleshooting

**Backend won't start?**
- Check `.env` file has correct Supabase credentials
- Ensure virtual environment is activated
- Try: `pip install -r requirements.txt --upgrade`

**Frontend shows errors?**
- Verify `.env` file exists and has correct values
- Clear browser cache
- Check console for specific errors

**Experiments stuck in pending?**
- Check backend terminal for error messages
- Verify datasets exist at specified paths
- Check Supabase connection

## 📊 What You Can Do

1. **Run LCCDE**: Validate the paper results
2. **Optimize parameters**: Find best configuration
3. **Compare algorithms**: Test XGBoost vs LightGBM vs CatBoost
4. **Track improvements**: See how parameter changes affect results
5. **Build on it**: Add your own algorithms

## 🚀 Next Steps

1. Run your first experiment
2. Explore the comparison features
3. Try different parameter settings
4. Review the results and metrics
5. Add more algorithms (extend the platform!)

## 📞 Need Help?

- Check the README.md for comprehensive docs
- Review SETUP.md for detailed instructions
- See IMPLEMENTATION_SUMMARY.md for technical details

---

**Built with ❤️ for IDS researchers**

