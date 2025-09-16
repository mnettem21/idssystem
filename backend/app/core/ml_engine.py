import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import os
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

class MLEngine:
    """
    Machine Learning engine for IDS model training and evaluation
    Based on the IDS-ML framework
    """

    def __init__(self):
        self.models = {
            'decision_tree': DecisionTreeClassifier,
            'random_forest': RandomForestClassifier,
            'extra_trees': ExtraTreesClassifier,
            'xgboost': XGBClassifier,
            'lightgbm': LGBMClassifier,
            'catboost': CatBoostClassifier
        }

        self.trained_models = {}
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()

    def load_dataset(self, file_path: str) -> pd.DataFrame:
        """Load dataset from CSV file"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                raise ValueError("Unsupported file format. Only CSV files are supported.")
            return df
        except Exception as e:
            raise Exception(f"Error loading dataset: {str(e)}")

    def preprocess_data(self, data: pd.DataFrame, target_column: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess the data for training
        Based on the preprocessing steps from IDS-ML framework
        """
        try:
            # Separate features and target
            X = data.drop(columns=[target_column])
            y = data[target_column]

            # Handle categorical features
            for column in X.select_dtypes(include=['object']).columns:
                X[column] = LabelEncoder().fit_transform(X[column].astype(str))

            # Handle infinite values
            X = X.replace([np.inf, -np.inf], np.nan)
            X = X.fillna(0)

            # Encode target labels
            y_encoded = self.label_encoder.fit_transform(y)

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            return X_scaled, y_encoded

        except Exception as e:
            raise Exception(f"Error preprocessing data: {str(e)}")

    def train_model(self, model_type: str, X_train: np.ndarray, y_train: np.ndarray,
                   parameters: Optional[Dict[str, Any]] = None) -> str:
        """
        Train a model using the specified algorithm
        """
        try:
            if model_type not in self.models:
                raise ValueError(f"Unsupported model type: {model_type}")

            # Default parameters based on IDS-ML framework
            default_params = self._get_default_parameters(model_type)
            if parameters:
                default_params.update(parameters)

            # Initialize and train model
            model_class = self.models[model_type]

            if model_type == 'catboost':
                # CatBoost has different parameter names
                model = model_class(**default_params, verbose=False)
            else:
                model = model_class(**default_params)

            model.fit(X_train, y_train)

            # Store the trained model
            model_id = f"{model_type}_{len(self.trained_models)}"
            self.trained_models[model_id] = model

            return model_id

        except Exception as e:
            raise Exception(f"Error training model: {str(e)}")

    def evaluate_model(self, model_id: str, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """
        Evaluate the trained model and return metrics
        """
        try:
            if model_id not in self.trained_models:
                raise ValueError(f"Model {model_id} not found")

            model = self.trained_models[model_id]
            y_pred = model.predict(X_test)

            # Calculate metrics
            metrics = {
                'accuracy': float(accuracy_score(y_test, y_pred)),
                'precision': float(precision_score(y_test, y_pred, average='weighted')),
                'recall': float(recall_score(y_test, y_pred, average='weighted')),
                'f1_score': float(f1_score(y_test, y_pred, average='weighted')),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
            }

            return metrics

        except Exception as e:
            raise Exception(f"Error evaluating model: {str(e)}")

    def save_model(self, model_id: str, save_path: str) -> str:
        """Save the trained model to disk"""
        try:
            if model_id not in self.trained_models:
                raise ValueError(f"Model {model_id} not found")

            os.makedirs(os.path.dirname(save_path), exist_ok=True)

            model_data = {
                'model': self.trained_models[model_id],
                'scaler': self.scaler,
                'label_encoder': self.label_encoder
            }

            joblib.dump(model_data, save_path)
            return save_path

        except Exception as e:
            raise Exception(f"Error saving model: {str(e)}")

    def load_model(self, load_path: str) -> str:
        """Load a trained model from disk"""
        try:
            model_data = joblib.load(load_path)

            model_id = f"loaded_{len(self.trained_models)}"
            self.trained_models[model_id] = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoder = model_data['label_encoder']

            return model_id

        except Exception as e:
            raise Exception(f"Error loading model: {str(e)}")

    def predict(self, model_id: str, X: np.ndarray) -> np.ndarray:
        """Make predictions using the trained model"""
        try:
            if model_id not in self.trained_models:
                raise ValueError(f"Model {model_id} not found")

            model = self.trained_models[model_id]
            predictions = model.predict(X)

            # Decode predictions back to original labels
            decoded_predictions = self.label_encoder.inverse_transform(predictions)

            return decoded_predictions

        except Exception as e:
            raise Exception(f"Error making predictions: {str(e)}")

    def _get_default_parameters(self, model_type: str) -> Dict[str, Any]:
        """
        Get default parameters for each model type
        Based on the IDS-ML framework recommendations
        """
        defaults = {
            'decision_tree': {
                'random_state': 42,
                'max_depth': 10
            },
            'random_forest': {
                'n_estimators': 100,
                'random_state': 42,
                'max_depth': 10,
                'n_jobs': -1
            },
            'extra_trees': {
                'n_estimators': 100,
                'random_state': 42,
                'max_depth': 10,
                'n_jobs': -1
            },
            'xgboost': {
                'n_estimators': 100,
                'random_state': 42,
                'max_depth': 6,
                'learning_rate': 0.1
            },
            'lightgbm': {
                'n_estimators': 100,
                'random_state': 42,
                'max_depth': 6,
                'learning_rate': 0.1,
                'verbosity': -1
            },
            'catboost': {
                'iterations': 100,
                'random_state': 42,
                'depth': 6,
                'learning_rate': 0.1
            }
        }

        return defaults.get(model_type, {})