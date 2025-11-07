"""
MTH Engine for IDS Experiments
Multi-Tiered Hybrid Intrusion Detection System
Adapted from MTH_IDS_IoTJ.ipynb
"""
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import time
import io
import base64
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_score, recall_score, f1_score
)
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
import xgboost as xgb
from imblearn.over_sampling import SMOTE
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns


class MTHEngine:
    """MTH-IDS: Multi-Tiered Hybrid Intrusion Detection System"""

    def __init__(self, dataset_path, config):
        """
        Initialize the MTH engine

        Args:
            dataset_path: Path to the dataset CSV file
            config: Dictionary containing experiment configuration
        """
        self.dataset_path = dataset_path
        self.config = config
        self.models = {}
        self.results = {}
        self.selected_features = []
        self.visualizations = {}

    def load_data(self):
        """Load and prepare the dataset"""
        self.df = pd.read_csv(self.dataset_path)
        
        # Normalize features (Z-score normalization)
        features = self.df.dtypes[self.df.dtypes != 'object'].index
        if 'Label' in features:
            features = features.drop('Label')
        
        self.df[features] = self.df[features].apply(
            lambda x: (x - x.mean()) / (x.std())
        )
        self.df = self.df.fillna(0)

    def split_data(self):
        """Split data into train and test sets"""
        X = self.df.drop(['Label'], axis=1)
        y = self.df['Label']

        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y,
            train_size=self.config.get('train_size', 0.8),
            test_size=self.config.get('test_size', 0.2),
            random_state=self.config.get('random_state', 0),
            stratify=y
        )

    def feature_selection_ig(self):
        """Feature selection using Information Gain"""
        if not self.config.get('feature_selection_enabled', True):
            return

        from sklearn.feature_selection import mutual_info_classif
        
        print("Performing feature selection using Information Gain...")
        importances = mutual_info_classif(self.X_train, self.y_train)
        
        features = self.X_train.columns
        f_list = sorted(zip(map(lambda x: round(x, 4), importances), features), reverse=True)
        
        # Calculate sum and select features until 90% importance
        Sum = sum([x[0] for x in f_list])
        Sum2 = 0
        fs = []
        
        for i in range(len(f_list)):
            Sum2 = Sum2 + f_list[i][0] / Sum
            fs.append(f_list[i][1])
            if Sum2 >= self.config.get('feature_selection_threshold', 0.9):
                break
        
        self.selected_features = fs
        self.X_train = self.X_train[fs]
        self.X_test = self.X_test[fs]
        
        print(f"✓ Selected {len(fs)} features (from {len(features)})")

    def apply_smote(self):
        """Apply SMOTE to handle class imbalance"""
        if not self.config.get('smote_enabled', True):
            return

        sampling_strategy = self.config.get('smote_sampling_strategy', {2: 1000, 4: 1000})
        sampling_strategy = {int(k): v for k, v in sampling_strategy.items()}

        smote = SMOTE(n_jobs=-1, sampling_strategy=sampling_strategy)
        self.X_train, self.y_train = smote.fit_resample(self.X_train, self.y_train)

    def train_decision_tree(self):
        """Train Decision Tree model"""
        print("Training Decision Tree...")
        start_time = time.time()

        params = self.config.get('dt_params', {'random_state': 0})
        model = DecisionTreeClassifier(**params)
        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        training_time = time.time() - start_time

        self.models['decision_tree'] = model
        self.results['decision_tree'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'DecisionTree'
        )

        print(f"✓ Decision Tree trained in {training_time:.2f}s (F1: {self.results['decision_tree']['f1_score']:.4f})")
        return model.predict(self.X_train), y_pred

    def train_random_forest(self):
        """Train Random Forest model"""
        print("Training Random Forest...")
        start_time = time.time()

        params = self.config.get('rf_params', {'random_state': 0})
        model = RandomForestClassifier(**params)
        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        training_time = time.time() - start_time

        self.models['random_forest'] = model
        self.results['random_forest'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'RandomForest'
        )

        print(f"✓ Random Forest trained in {training_time:.2f}s (F1: {self.results['random_forest']['f1_score']:.4f})")
        return model.predict(self.X_train), y_pred

    def train_extra_trees(self):
        """Train Extra Trees model"""
        print("Training Extra Trees...")
        start_time = time.time()

        params = self.config.get('et_params', {'random_state': 0})
        model = ExtraTreesClassifier(**params)
        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        training_time = time.time() - start_time

        self.models['extra_trees'] = model
        self.results['extra_trees'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'ExtraTrees'
        )

        print(f"✓ Extra Trees trained in {training_time:.2f}s (F1: {self.results['extra_trees']['f1_score']:.4f})")
        return model.predict(self.X_train), y_pred

    def train_xgboost(self):
        """Train XGBoost model"""
        print("Training XGBoost...")
        start_time = time.time()

        params = self.config.get('xgboost_params', {'n_estimators': 10})
        model = xgb.XGBClassifier(**params)
        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        training_time = time.time() - start_time

        self.models['xgboost'] = model
        self.results['xgboost'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'XGBoost'
        )

        print(f"✓ XGBoost trained in {training_time:.2f}s (F1: {self.results['xgboost']['f1_score']:.4f})")
        return model.predict(self.X_train), y_pred

    def train_stacking(self, dt_train, dt_test, rf_train, rf_test, et_train, et_test, xg_train, xg_test):
        """Train Stacking ensemble model"""
        print("Training Stacking Ensemble...")
        start_time = time.time()

        # Reshape predictions
        dt_train = dt_train.reshape(-1, 1)
        rf_train = rf_train.reshape(-1, 1)
        et_train = et_train.reshape(-1, 1)
        xg_train = xg_train.reshape(-1, 1)
        
        dt_test = dt_test.reshape(-1, 1)
        rf_test = rf_test.reshape(-1, 1)
        et_test = et_test.reshape(-1, 1)
        xg_test = xg_test.reshape(-1, 1)

        # Concatenate predictions
        x_train = np.concatenate((dt_train, rf_train, et_train, xg_train), axis=1)
        x_test = np.concatenate((dt_test, rf_test, et_test, xg_test), axis=1)

        # Train stacking model
        params = self.config.get('stacking_params', {})
        model = xgb.XGBClassifier(**params)
        model.fit(x_train, self.y_train)

        y_pred = model.predict(x_test)
        training_time = time.time() - start_time

        self.models['stacking'] = model
        self.results['stacking'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'Stacking'
        )

        print(f"✓ Stacking trained in {training_time:.2f}s (F1: {self.results['stacking']['f1_score']:.4f})")

    def _generate_confusion_matrix_plot(self, cm, model_name):
        """Generate confusion matrix heatmap as base64 image"""
        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', linewidth=0.5, linecolor='red', ax=ax, cmap='Blues')
        ax.set_xlabel('Predicted')
        ax.set_ylabel('Actual')
        ax.set_title(f'Confusion Matrix - {model_name}')
        
        # Convert plot to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return image_base64

    def _calculate_metrics(self, y_true, y_pred, training_time, model_name):
        """Calculate performance metrics"""
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        f1_per_class = f1_score(y_true, y_pred, average=None, zero_division=0)
        cm = confusion_matrix(y_true, y_pred)
        report = classification_report(y_true, y_pred, zero_division=0)

        # Generate confusion matrix visualization
        cm_plot = self._generate_confusion_matrix_plot(cm, model_name)

        return {
            'model_name': model_name.lower().replace(' ', ''),
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'f1_scores_per_class': [float(score) for score in f1_per_class],
            'confusion_matrix': cm.tolist(),
            'confusion_matrix_plot': cm_plot,
            'training_time': float(training_time),
            'classification_report': report
        }

    def _generate_comparison_plots(self):
        """Generate comparison plots for all models"""
        # Performance comparison bar chart
        models = []
        accuracies = []
        precisions = []
        recalls = []
        f1_scores = []
        
        for model_name, result in self.results.items():
            models.append(model_name.upper())
            accuracies.append(result['accuracy'])
            precisions.append(result['precision'])
            recalls.append(result['recall'])
            f1_scores.append(result['f1_score'])
        
        # Create performance comparison plot
        fig, ax = plt.subplots(figsize=(12, 6))
        x = np.arange(len(models))
        width = 0.2
        
        ax.bar(x - 1.5*width, accuracies, width, label='Accuracy')
        ax.bar(x - 0.5*width, precisions, width, label='Precision')
        ax.bar(x + 0.5*width, recalls, width, label='Recall')
        ax.bar(x + 1.5*width, f1_scores, width, label='F1-Score')
        
        ax.set_xlabel('Models')
        ax.set_ylabel('Score')
        ax.set_title('Model Performance Comparison - MTH-IDS')
        ax.set_xticks(x)
        ax.set_xticklabels(models, rotation=45, ha='right')
        ax.legend()
        ax.set_ylim([0, 1])
        ax.grid(axis='y', alpha=0.3)
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
        buffer.seek(0)
        comparison_plot = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return comparison_plot

    def run_experiment(self):
        """Run the complete MTH-IDS experiment"""
        # Load and prepare data
        self.load_data()
        self.split_data()
        self.feature_selection_ig()
        self.apply_smote()

        # Train base learners
        dt_train, dt_test = self.train_decision_tree()
        rf_train, rf_test = self.train_random_forest()
        et_train, et_test = self.train_extra_trees()
        xg_train, xg_test = self.train_xgboost()

        # Train stacking ensemble
        self.train_stacking(dt_train, dt_test, rf_train, rf_test, 
                          et_train, et_test, xg_train, xg_test)

        # Generate comparison plots
        self.visualizations['comparison_plot'] = self._generate_comparison_plots()

        # Add visualizations to results
        results_with_viz = {
            'results': self.results,
            'visualizations': self.visualizations
        }

        return results_with_viz

