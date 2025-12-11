"""
LCCDE Engine for IDS Experiments
Leader Class and Confidence Decision Ensemble
Adapted from LCCDE_IDS_GlobeCom22.ipynb
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
    precision_score, recall_score, f1_score, roc_curve, auc
)
from sklearn.preprocessing import label_binarize
import lightgbm as lgb
import catboost as cbt
import xgboost as xgb
from imblearn.over_sampling import SMOTE
from river import stream
from statistics import mode
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns


class LCCDEEngine:
    """LCCDE: Leader Class and Confidence Decision Ensemble"""

    def __init__(self, dataset_path, config):
        """
        Initialize the LCCDE engine

        Args:
            dataset_path: Path to the dataset CSV file
            config: Dictionary containing experiment configuration
        """
        self.dataset_path = dataset_path
        self.config = config
        self.models = {}
        self.results = {}
        self.leader_models = []
        self.visualizations = {}

    def load_data(self):
        """Load and prepare the dataset"""
        self.df = pd.read_csv(self.dataset_path)

    def split_data(self):
        """Split data into train and test sets"""
        X = self.df.drop(['Label'], axis=1)
        y = self.df['Label']

        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y,
            train_size=self.config.get('train_size', 0.8),
            test_size=self.config.get('test_size', 0.2),
            random_state=self.config.get('random_state', 0)
        )

    def apply_smote(self):
        """Apply SMOTE to handle class imbalance"""
        if not self.config.get('smote_enabled', True):
            return

        sampling_strategy = self.config.get('smote_sampling_strategy', {2: 1000, 4: 1000})
        # Convert string keys to int if needed
        sampling_strategy = {int(k): v for k, v in sampling_strategy.items()}

        smote = SMOTE(sampling_strategy=sampling_strategy)
        self.X_train, self.y_train = smote.fit_resample(self.X_train, self.y_train)

    def train_lightgbm(self):
        """Train LightGBM model"""
        print("Training LightGBM...")
        start_time = time.time()

        params = self.config.get('lightgbm_params', {})
        # Ensure params is a dict
        if not isinstance(params, dict):
            params = {}
        model = lgb.LGBMClassifier(**params)
        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        y_proba = model.predict_proba(self.X_test)
        training_time = time.time() - start_time

        self.models['lightgbm'] = model
        self.results['lightgbm'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'LightGBM'
        )

        # Generate ROC curve
        roc_plot = self._generate_roc_curve_plot(self.y_test.values, y_proba, 'LightGBM')
        self.results['lightgbm']['roc_curve_plot'] = roc_plot

        print(f"✓ LightGBM trained in {training_time:.2f}s (F1: {self.results['lightgbm']['f1_score']:.4f})")

        return model, self.results['lightgbm']['f1_scores_per_class']

    def train_xgboost(self):
        """Train XGBoost model"""
        print("Training XGBoost...")
        start_time = time.time()

        params = self.config.get('xgboost_params', {})
        # Ensure params is a dict
        if not isinstance(params, dict):
            params = {}
        model = xgb.XGBClassifier(**params)

        X_train_x = self.X_train.values
        X_test_x = self.X_test.values

        model.fit(X_train_x, self.y_train)
        y_pred = model.predict(X_test_x)
        y_proba = model.predict_proba(X_test_x)
        training_time = time.time() - start_time

        self.models['xgboost'] = model
        self.results['xgboost'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'XGBoost'
        )

        # Generate ROC curve
        roc_plot = self._generate_roc_curve_plot(self.y_test.values, y_proba, 'XGBoost')
        self.results['xgboost']['roc_curve_plot'] = roc_plot

        print(f"✓ XGBoost trained in {training_time:.2f}s (F1: {self.results['xgboost']['f1_score']:.4f})")

        return model, self.results['xgboost']['f1_scores_per_class']

    def train_catboost(self):
        """Train CatBoost model"""
        print("Training CatBoost...")
        start_time = time.time()

        params = self.config.get('catboost_params', {'verbose': 0, 'boosting_type': 'Plain'})
        # Ensure params is a dict and create a copy to avoid modifying original
        if not isinstance(params, dict):
            params = {}
        else:
            params = params.copy()
        # Set required CatBoost parameters
        if 'verbose' not in params:
            params['verbose'] = 0
        if 'boosting_type' not in params:
            params['boosting_type'] = 'Plain'
        # Disable file writing to prevent catboost_info directory creation
        params['allow_writing_files'] = False
        model = cbt.CatBoostClassifier(**params)

        model.fit(self.X_train, self.y_train)
        y_pred = model.predict(self.X_test)
        y_proba = model.predict_proba(self.X_test)
        training_time = time.time() - start_time

        self.models['catboost'] = model
        self.results['catboost'] = self._calculate_metrics(
            self.y_test, y_pred, training_time, 'CatBoost'
        )

        # Generate ROC curve
        roc_plot = self._generate_roc_curve_plot(self.y_test.values, y_proba, 'CatBoost')
        self.results['catboost']['roc_curve_plot'] = roc_plot

        print(f"✓ CatBoost trained in {training_time:.2f}s (F1: {self.results['catboost']['f1_score']:.4f})")

        return model, self.results['catboost']['f1_scores_per_class']

    def find_leader_models(self, lg_f1, xg_f1, cb_f1):
        """
        Find the best-performing (leading) model for each class

        Args:
            lg_f1: F1 scores for LightGBM
            xg_f1: F1 scores for XGBoost
            cb_f1: F1 scores for CatBoost
        """
        lg_model = self.models['lightgbm']
        xg_model = self.models['xgboost']
        cb_model = self.models['catboost']

        for i in range(len(lg_f1)):
            if max(lg_f1[i], xg_f1[i], cb_f1[i]) == lg_f1[i]:
                self.leader_models.append(lg_model)
            elif max(lg_f1[i], xg_f1[i], cb_f1[i]) == xg_f1[i]:
                self.leader_models.append(xg_model)
            else:
                self.leader_models.append(cb_model)

    def predict_lccde(self):
        """Run LCCDE prediction"""
        print("Running LCCDE ensemble predictions...")
        start_time = time.time()

        m1 = self.models['lightgbm']
        m2 = self.models['xgboost']
        m3 = self.models['catboost']
        model = self.leader_models

        yt = []
        yp = []

        for xi, yi in stream.iter_pandas(self.X_test, self.y_test):
            xi2 = np.array(list(xi.values()))

            # Get predictions from all models
            y_pred1 = int(m1.predict(xi2.reshape(1, -1))[0])
            y_pred2 = int(m2.predict(xi2.reshape(1, -1))[0])
            y_pred3 = int(m3.predict(xi2.reshape(1, -1))[0])

            # Get prediction probabilities
            p1 = m1.predict_proba(xi2.reshape(1, -1))
            p2 = m2.predict_proba(xi2.reshape(1, -1))
            p3 = m3.predict_proba(xi2.reshape(1, -1))

            # Find highest prediction probability for each model
            y_pred_p1 = np.max(p1)
            y_pred_p2 = np.max(p2)
            y_pred_p3 = np.max(p3)

            # LCCDE decision logic
            if y_pred1 == y_pred2 == y_pred3:
                y_pred = y_pred1
            elif y_pred1 != y_pred2 != y_pred3:
                l = []
                pred_l = []
                pro_l = []

                if model[y_pred1] == m1:
                    l.append(m1)
                    pred_l.append(y_pred1)
                    pro_l.append(y_pred_p1)

                if model[y_pred2] == m2:
                    l.append(m2)
                    pred_l.append(y_pred2)
                    pro_l.append(y_pred_p2)

                if model[y_pred3] == m3:
                    l.append(m3)
                    pred_l.append(y_pred3)
                    pro_l.append(y_pred_p3)

                if len(l) == 0:
                    pro_l = [y_pred_p1, y_pred_p2, y_pred_p3]
                elif len(l) == 1:
                    y_pred = pred_l[0]
                else:
                    max_p = max(pro_l)
                    if max_p == y_pred_p1:
                        y_pred = y_pred1
                    elif max_p == y_pred_p2:
                        y_pred = y_pred2
                    else:
                        y_pred = y_pred3
            else:
                n = mode([y_pred1, y_pred2, y_pred3])
                y_pred = int(model[n].predict(xi2.reshape(1, -1))[0])

            yt.append(yi)
            yp.append(y_pred)

        training_time = time.time() - start_time

        self.results['lccde'] = self._calculate_metrics(yt, yp, training_time, 'LCCDE')

        print(f"✓ LCCDE predictions completed in {training_time:.2f}s (F1: {self.results['lccde']['f1_score']:.4f})")

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

    def _generate_roc_curve_plot(self, y_true, y_proba, model_name):
        """Generate ROC curve plot as base64 image"""
        # Get unique classes
        classes = np.unique(y_true)
        n_classes = len(classes)

        # Binarize the labels for multi-class ROC
        y_true_bin = label_binarize(y_true, classes=classes)

        # Handle binary classification case
        if n_classes == 2:
            y_true_bin = np.hstack([1 - y_true_bin, y_true_bin])

        # Ensure y_proba has correct shape
        if len(y_proba.shape) == 1:
            y_proba = np.column_stack([1 - y_proba, y_proba])

        # Create figure
        fig, ax = plt.subplots(figsize=(10, 8))

        # Colors for different classes
        colors = plt.cm.Set1(np.linspace(0, 1, n_classes))

        # Compute ROC curve and AUC for each class
        fpr = dict()
        tpr = dict()
        roc_auc = dict()

        for i in range(n_classes):
            if i < y_proba.shape[1] and i < y_true_bin.shape[1]:
                fpr[i], tpr[i], _ = roc_curve(y_true_bin[:, i], y_proba[:, i])
                roc_auc[i] = auc(fpr[i], tpr[i])
                ax.plot(fpr[i], tpr[i], color=colors[i], lw=2,
                       label=f'Class {classes[i]} (AUC = {roc_auc[i]:.4f})')

        # Plot diagonal line
        ax.plot([0, 1], [0, 1], 'k--', lw=2, label='Random (AUC = 0.5)')

        ax.set_xlim([0.0, 1.0])
        ax.set_ylim([0.0, 1.05])
        ax.set_xlabel('False Positive Rate')
        ax.set_ylabel('True Positive Rate')
        ax.set_title(f'ROC Curves - {model_name}')
        ax.legend(loc='lower right', fontsize=8)
        ax.grid(alpha=0.3)

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

        # Debug: Print actual metric values
        print(f"  {model_name} metrics: Acc={accuracy:.6f}, Prec={precision:.6f}, Rec={recall:.6f}, F1={f1:.6f}")
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
        ax.set_title('Model Performance Comparison - LCCDE')
        ax.set_xticks(x)
        ax.set_xticklabels(models)
        ax.legend()

        # Dynamic Y-axis: zoom in to show differences
        all_scores = accuracies + precisions + recalls + f1_scores
        min_score = min(all_scores)
        max_score = max(all_scores)
        padding = max(0.01, (max_score - min_score) * 0.3)  # At least 1% padding
        y_min = max(0, min_score - padding)
        y_max = min(1, max_score + padding)
        ax.set_ylim([y_min, y_max])
        ax.grid(axis='y', alpha=0.3)
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
        buffer.seek(0)
        comparison_plot = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return comparison_plot

    def run_experiment(self):
        """Run the complete LCCDE experiment"""
        # Load and prepare data
        self.load_data()
        self.split_data()
        self.apply_smote()

        # Train base learners
        lg_model, lg_f1 = self.train_lightgbm()
        xg_model, xg_f1 = self.train_xgboost()
        cb_model, cb_f1 = self.train_catboost()

        # Find leader models
        self.find_leader_models(lg_f1, xg_f1, cb_f1)

        # Run LCCDE ensemble
        self.predict_lccde()

        # Generate comparison plots
        self.visualizations['comparison_plot'] = self._generate_comparison_plots()

        # Add visualizations to results
        results_with_viz = {
            'results': self.results,
            'visualizations': self.visualizations
        }

        return results_with_viz

