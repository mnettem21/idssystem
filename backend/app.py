"""
Flask Backend for IDS ML Experiment System
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
import os

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

# Import routes after app initialization
try:
    from routes import experiments_bp, auth_bp

    # Register blueprints
    app.register_blueprint(experiments_bp, url_prefix='/api/experiments')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    print("✓ Routes registered successfully")
    print(f"✓ Registered routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
except Exception as e:
    print(f"✗ Error importing routes: {e}")
    import traceback
    traceback.print_exc()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'IDS ML Backend is running'
    })

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """List available datasets"""
    datasets = []
    for name, path in Config.AVAILABLE_DATASETS.items():
        if os.path.exists(path):
            size = os.path.getsize(path)
            datasets.append({
                'name': name,
                'size': size,
                'available': True
            })
        else:
            datasets.append({
                'name': name,
                'available': False
            })

    return jsonify({'datasets': datasets})

@app.errorhandler(404)
def not_found(_error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(_error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=Config.DEBUG
    )
