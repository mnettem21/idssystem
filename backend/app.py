from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

jwt = JWTManager(app)
CORS(app)

from routes.auth import auth_bp
from routes.experiments import experiments_bp
from routes.results import results_bp
from routes.comparisons import comparisons_bp
from routes.datasets import datasets_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(datasets_bp, url_prefix='/api/datasets')
app.register_blueprint(experiments_bp, url_prefix='/api/experiments')
app.register_blueprint(results_bp, url_prefix='/api/results')
app.register_blueprint(comparisons_bp, url_prefix='/api/comparisons')

@app.route('/')
def health_check():
    return {'status': 'healthy', 'message': 'IDS Research Platform API'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

