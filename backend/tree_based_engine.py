"""
Tree-Based Engine for IDS Experiments
Tree-Based Intelligent Intrusion Detection System
Adapted from Tree-based_IDS_GlobeCom19.ipynb
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
from sklearn.preprocessing import label_binarize, LabelEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
import xgboost as xgb
from imblearn.over_sampling import SMOTE
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns


class TreeBasedEngine:
    """Tree-Based IDS using feature importance averaging and stacking"""

    def __init__(self, dataset_path, config):
        """
        Initialize the Tree-Based engine

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
        self.label_encoder = None

    def load_data(self):
        """Load and prepare the dataset"""
        self.df = pd.read_csv(self.dataset_path)

        # Min-max normalization
        numeric_features = self.df.dtypes[self.df.dtypes != 'object'].index
        if 'Label' in numeric_features:
            numeric_features = numeric_features.drop('Label')

        self.df[numeric_features] = self.df[numeric_features].apply(
            lambda x: (x - x.min()) / (x.max() - x.min())
        )
        self.df = self.df.fillna(0)

        # Label encoding for text labels (CICIDS2017_sample.csv has text labels)
        if self.df['Label'].dtype == 'object':
            self.label_encoder = LabelEncoder()
            self.df['Label'] = self.label_encoder.fit_transform(self.df['Label'])
            print(f"✓ Label encoding applied. Classes: {dict(zip(self.label_encoder.classes_, range(len(self.label_encoder.classes_))))}")
        else:
            self.label_encoder = None

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

    def apply_smote(self):
        """Apply SMOTE to handle class imbalance"""
        if not self.config.get('smote_enabled', True):
            return

        sampling_strategy = self.config.get('smote_sampling_strategy', {4: 1500})
        sampling_strategy = {int(k): v for k, v in sampling_strategy.items()}

        smote = SMOTE(sampling_strategy=sampling_strategy)
        self.X_train, self.y_train = smote.fit_resample(self.X_train, self.y_train)

    def train_base_learners_with_feature_importance(self):
        """Train base learners and collect feature importances"""
        print("Training base learners and collecting feature importances...")

        # Decision Tree
        print("Training Decision Tree...")
        start_time = time.time()
        dt = DecisionTreeClassifier(random_state=0)
        dt.fit(self.X_train, self.y_train)
        y_pred_dt = dt.predict(self.X_test)
        y_proba_dt = dt.predict_proba(self.X_test)
        dt_time = time.time() - start_time
        self.models['decision_tree'] = dt
        self.results['decision_tree'] = self._calculate_metrics(
            self.y_test, y_pred_dt, dt_time, 'DecisionTree'
        )
        # Generate ROC curve
        roc_plot_dt = self._generate_roc_curve_plot(self.y_test.values, y_proba_dt, 'DecisionTree')
        self.results['decision_tree']['roc_curve_plot'] = roc_plot_dt
        print(f"✓ Decision Tree trained in {dt_time:.2f}s (F1: {self.results['decision_tree']['f1_score']:.4f})")
        dt_feature_importance = dt.feature_importances_

        # Random Forest
        print("Training Random Forest...")
        start_time = time.time()
        rf = RandomForestClassifier(random_state=0)
        rf.fit(self.X_train, self.y_train)
        y_pred_rf = rf.predict(self.X_test)
        y_proba_rf = rf.predict_proba(self.X_test)
        rf_time = time.time() - start_time
        self.models['random_forest'] = rf
        self.results['random_forest'] = self._calculate_metrics(
            self.y_test, y_pred_rf, rf_time, 'RandomForest'
        )
        # Generate ROC curve
        roc_plot_rf = self._generate_roc_curve_plot(self.y_test.values, y_proba_rf, 'RandomForest')
        self.results['random_forest']['roc_curve_plot'] = roc_plot_rf
        print(f"✓ Random Forest trained in {rf_time:.2f}s (F1: {self.results['random_forest']['f1_score']:.4f})")
        rf_feature_importance = rf.feature_importances_

        # Extra Trees
        print("Training Extra Trees...")
        start_time = time.time()
        et = ExtraTreesClassifier(random_state=0)
        et.fit(self.X_train, self.y_train)
        y_pred_et = et.predict(self.X_test)
        y_proba_et = et.predict_proba(self.X_test)
        et_time = time.time() - start_time
        self.models['extra_trees'] = et
        self.results['extra_trees'] = self._calculate_metrics(
            self.y_test, y_pred_et, et_time, 'ExtraTrees'
        )
        # Generate ROC curve
        roc_plot_et = self._generate_roc_curve_plot(self.y_test.values, y_proba_et, 'ExtraTrees')
        self.results['extra_trees']['roc_curve_plot'] = roc_plot_et
        print(f"✓ Extra Trees trained in {et_time:.2f}s (F1: {self.results['extra_trees']['f1_score']:.4f})")
        et_feature_importance = et.feature_importances_

        # XGBoost
        print("Training XGBoost...")
        start_time = time.time()
        xgb_model = xgb.XGBClassifier(n_estimators=10)
        xgb_model.fit(self.X_train, self.y_train)
        y_pred_xgb = xgb_model.predict(self.X_test)
        y_proba_xgb = xgb_model.predict_proba(self.X_test)
        xgb_time = time.time() - start_time
        self.models['xgboost'] = xgb_model
        self.results['xgboost'] = self._calculate_metrics(
            self.y_test, y_pred_xgb, xgb_time, 'XGBoost'
        )
        # Generate ROC curve
        roc_plot_xgb = self._generate_roc_curve_plot(self.y_test.values, y_proba_xgb, 'XGBoost')
        self.results['xgboost']['roc_curve_plot'] = roc_plot_xgb
        print(f"✓ XGBoost trained in {xgb_time:.2f}s (F1: {self.results['xgboost']['f1_score']:.4f})")
        xgb_feature_importance = xgb_model.feature_importances_

        # Calculate average feature importance
        avg_feature_importance = (dt_feature_importance + rf_feature_importance +
                                 et_feature_importance + xgb_feature_importance) / 4

        return (dt, rf, et, xgb_model, avg_feature_importance,
                dt.predict(self.X_train), dt.predict(self.X_test),
                rf.predict(self.X_train), rf.predict(self.X_test),
                et.predict(self.X_train), et.predict(self.X_test),
                xgb_model.predict(self.X_train), xgb_model.predict(self.X_test))

    def feature_selection_avg_importance(self, avg_importance):
        """Select features based on average importance"""
        if not self.config.get('feature_selection_enabled', True):
            return False

        print("Performing feature selection using average importance...")
        
        features = self.X_train.columns
        f_list = sorted(zip(map(lambda x: round(x, 4), avg_importance), features), reverse=True)
        
        # Select features until accumulated importance reaches threshold
        Sum = 0
        fs = []
        for i in range(len(f_list)):
            Sum = Sum + f_list[i][0]
            fs.append(f_list[i][1])
            if Sum >= self.config.get('feature_importance_threshold', 0.9):
                break
        
        self.selected_features = fs
        
        # Generate feature importance visualization
        self._generate_feature_importance_plot(f_list[:20])  # Top 20 features
        
        print(f"✓ Selected {len(fs)} features (from {len(features)})")
        
        return True

    def _generate_feature_importance_plot(self, top_features):
        """Generate feature importance bar plot"""
        if len(top_features) == 0:
            return
        
        importances, features = zip(*top_features)
        
        fig, ax = plt.subplots(figsize=(10, 8))
        y_pos = np.arange(len(features))
        ax.barh(y_pos, importances, align='center')
        ax.set_yticks(y_pos)
        ax.set_yticklabels(features)
        ax.invert_yaxis()
        ax.set_xlabel('Average Feature Importance')
        ax.set_title('Top 20 Most Important Features')
        ax.grid(axis='x', alpha=0.3)
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
        buffer.seek(0)
        importance_plot = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        self.visualizations['feature_importance'] = importance_plot

    def retrain_with_selected_features(self):
        """Retrain models with selected features"""
        print("Retraining models with selected features...")
        
        # Update train and test sets
        self.X_train = self.X_train[self.selected_features]
        self.X_test = self.X_test[self.selected_features]
        
        # Apply SMOTE again
        self.apply_smote()
        
        # Retrain all models
        dt = DecisionTreeClassifier(random_state=0)
        dt.fit(self.X_train, self.y_train)
        
        rf = RandomForestClassifier(random_state=0)
        rf.fit(self.X_train, self.y_train)
        
        et = ExtraTreesClassifier(random_state=0)
        et.fit(self.X_train, self.y_train)
        
        xgb_model = xgb.XGBClassifier(n_estimators=10)
        xgb_model.fit(self.X_train, self.y_train)
        
        # Update models
        self.models['decision_tree_fs'] = dt
        self.models['random_forest_fs'] = rf
        self.models['extra_trees_fs'] = et
        self.models['xgboost_fs'] = xgb_model
        
        return (dt.predict(self.X_train), dt.predict(self.X_test),
                rf.predict(self.X_train), rf.predict(self.X_test),
                et.predict(self.X_train), et.predict(self.X_test),
                xgb_model.predict(self.X_train), xgb_model.predict(self.X_test))

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
        model = xgb.XGBClassifier()
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
            models.append(model_name.upper().replace('_', ' '))
            accuracies.append(result['accuracy'])
            precisions.append(result['precision'])
            recalls.append(result['recall'])
            f1_scores.append(result['f1_score'])
        
        # Create performance comparison plot
        fig, ax = plt.subplots(figsize=(14, 6))
        x = np.arange(len(models))
        width = 0.2
        
        ax.bar(x - 1.5*width, accuracies, width, label='Accuracy')
        ax.bar(x - 0.5*width, precisions, width, label='Precision')
        ax.bar(x + 0.5*width, recalls, width, label='Recall')
        ax.bar(x + 1.5*width, f1_scores, width, label='F1-Score')

        ax.set_xlabel('Models')
        ax.set_ylabel('Score')
        ax.set_title('Model Performance Comparison - Tree-Based IDS')
        ax.set_xticks(x)
        ax.set_xticklabels(models, rotation=45, ha='right')
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
        """Run the complete Tree-Based IDS experiment"""
        # Load and prepare data
        self.load_data()
        self.split_data()
        self.apply_smote()

        # Train base learners and get feature importances
        (dt, rf, et, xgb_model, avg_importance,
         dt_train, dt_test, rf_train, rf_test,
         et_train, et_test, xg_train, xg_test) = self.train_base_learners_with_feature_importance()

        # Train initial stacking
        self.train_stacking(dt_train, dt_test, rf_train, rf_test,
                          et_train, et_test, xg_train, xg_test)

        # Feature selection
        if self.feature_selection_avg_importance(avg_importance):
            # Retrain with selected features
            (dt_train_fs, dt_test_fs, rf_train_fs, rf_test_fs,
             et_train_fs, et_test_fs, xg_train_fs, xg_test_fs) = self.retrain_with_selected_features()
            
            # Train stacking with feature selection
            self.train_stacking(dt_train_fs, dt_test_fs, rf_train_fs, rf_test_fs,
                              et_train_fs, et_test_fs, xg_train_fs, xg_test_fs)

        # Generate comparison plots
        self.visualizations['comparison_plot'] = self._generate_comparison_plots()

        # Add visualizations to results
        results_with_viz = {
            'results': self.results,
            'visualizations': self.visualizations
        }

        return results_with_viz

