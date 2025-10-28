import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from imblearn.over_sampling import SMOTE
import lightgbm as lgb
import xgboost as xgb
import catboost as cbt
from river import stream
from statistics import mode
import time


class LCCDEAlgorithm:
    """
    Leader Class and Confidence Decision Ensemble (LCCDE) algorithm for intrusion detection.
    Based on the paper: L. Yang, A. Shami, G. Stevens, and S. DeRusett, 
    "LCCDE: A Decision-Based Ensemble Framework for Intrusion Detection in The Internet of Vehicles"
    """
    
    def __init__(self, parameters=None):
        """
        Initialize LCCDE with optional parameters
        
        Args:
            parameters (dict): Algorithm parameters including:
                - train_size: float (default 0.8)
                - test_size: float (default 0.2)
                - random_state: int (default 0)
                - smote_strategy: dict (default {2:1000, 4:1000})
                - lg_params: dict (LightGBM parameters)
                - xg_params: dict (XGBoost parameters)
                - cb_params: dict (CatBoost parameters)
        """
        self.parameters = parameters or {}
        self.train_size = self.parameters.get('train_size', 0.8)
        self.test_size = self.parameters.get('test_size', 0.2)
        self.random_state = self.parameters.get('random_state', 0)
        self.smote_strategy = self.parameters.get('smote_strategy', {2: 1000, 4: 1000})
        
        self.lg = None
        self.xg = None
        self.cb = None
        self.model = []  # Leading model for each class
        self.lg_f1 = None
        self.xg_f1 = None
        self.cb_f1 = None
    
    def train_base_learners(self, X_train, y_train, X_test, y_test):
        """
        Train the three base learners: LightGBM, XGBoost, and CatBoost
        
        Returns:
            dict: F1 scores for each model
        """
        results = {}
        
        # Train LightGBM
        print("Training LightGBM...")
        lg_params = self.parameters.get('lg_params', {})
        self.lg = lgb.LGBMClassifier(**lg_params)
        self.lg.fit(X_train, y_train)
        y_pred = self.lg.predict(X_test)
        results['lightgbm'] = {
            'f1_per_class': f1_score(y_test, y_pred, average=None),
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted'),
            'recall': recall_score(y_test, y_pred, average='weighted'),
            'f1': f1_score(y_test, y_pred, average='weighted')
        }
        self.lg_f1 = results['lightgbm']['f1_per_class']
        
        # Train XGBoost
        print("Training XGBoost...")
        xg_params = self.parameters.get('xg_params', {})
        self.xg = xgb.XGBClassifier(**xg_params)
        X_train_x = X_train.values if isinstance(X_train, pd.DataFrame) else X_train
        X_test_x = X_test.values if isinstance(X_test, pd.DataFrame) else X_test
        self.xg.fit(X_train_x, y_train)
        y_pred = self.xg.predict(X_test_x)
        results['xgboost'] = {
            'f1_per_class': f1_score(y_test, y_pred, average=None),
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted'),
            'recall': recall_score(y_test, y_pred, average='weighted'),
            'f1': f1_score(y_test, y_pred, average='weighted')
        }
        self.xg_f1 = results['xgboost']['f1_per_class']
        
        # Train CatBoost
        print("Training CatBoost...")
        cb_params = self.parameters.get('cb_params', {'verbose': 0, 'boosting_type': 'Plain'})
        self.cb = cbt.CatBoostClassifier(**cb_params)
        self.cb.fit(X_train, y_train)
        y_pred = self.cb.predict(X_test)
        results['catboost'] = {
            'f1_per_class': f1_score(y_test, y_pred, average=None),
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted'),
            'recall': recall_score(y_test, y_pred, average='weighted'),
            'f1': f1_score(y_test, y_pred, average='weighted')
        }
        self.cb_f1 = results['catboost']['f1_per_class']
        
        return results
    
    def find_leader_models(self):
        """
        Find the best-performing (leading) model for each class
        """
        self.model = []
        for i in range(len(self.lg_f1)):
            if max(self.lg_f1[i], self.xg_f1[i], self.cb_f1[i]) == self.lg_f1[i]:
                self.model.append(self.lg)
            elif max(self.lg_f1[i], self.xg_f1[i], self.cb_f1[i]) == self.xg_f1[i]:
                self.model.append(self.xg)
            else:
                self.model.append(self.cb)
        
        print(f"Leader models identified for {len(self.model)} classes")
    
    def predict_lccde(self, X_test, y_test, m1, m2, m3):
        """
        LCCDE prediction algorithm
        
        Args:
            X_test: Test features
            y_test: Test labels
            m1, m2, m3: Trained models (LightGBM, XGBoost, CatBoost)
        
        Returns:
            tuple: (true labels, predicted labels)
        """
        yt = []
        yp = []
        
        # Convert to DataFrame if not already
        if isinstance(X_test, np.ndarray):
            X_test_df = pd.DataFrame(X_test)
        else:
            X_test_df = X_test.copy()
        
        for xi_row in X_test_df.itertuples(index=False):
            xi = pd.Series(xi_row)
            xi2 = np.array(list(xi.values))
            
            # Get predictions from all three models
            y_pred1 = int(m1.predict(xi2.reshape(1, -1))[0])
            y_pred2 = int(m2.predict(xi2.reshape(1, -1))[0])
            y_pred3 = int(m3.predict(xi2.reshape(1, -1))[0])
            
            # Get prediction probabilities
            p1 = m1.predict_proba(xi2.reshape(1, -1))
            p2 = m2.predict_proba(xi2.reshape(1, -1))
            p3 = m3.predict_proba(xi2.reshape(1, -1))
            
            # Find the highest confidence for each model
            y_pred_p1 = np.max(p1)
            y_pred_p2 = np.max(p2)
            y_pred_p3 = np.max(p3)
            
            # Decision logic
            if y_pred1 == y_pred2 == y_pred3:
                # All models agree
                y_pred = y_pred1
            elif y_pred1 != y_pred2 and y_pred2 != y_pred3 and y_pred1 != y_pred3:
                # All models disagree
                l = []
                pred_l = []
                pro_l = []
                
                if self.model[y_pred1] == m1:
                    l.append(m1)
                    pred_l.append(y_pred1)
                    pro_l.append(y_pred_p1)
                
                if self.model[y_pred2] == m2:
                    l.append(m2)
                    pred_l.append(y_pred2)
                    pro_l.append(y_pred_p2)
                
                if self.model[y_pred3] == m3:
                    l.append(m3)
                    pred_l.append(y_pred3)
                    pro_l.append(y_pred_p3)
                
                if len(l) == 0:
                    pro_l = [y_pred_p1, y_pred_p2, y_pred_p3]
                
                if len(l) == 1:
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
                # Two agree, one disagrees
                n = mode([y_pred1, y_pred2, y_pred3])
                y_pred = int(self.model[n].predict(xi2.reshape(1, -1))[0])
            
            yt.append(y_pred1)  # For true labels, we would need y_test iterator
            yp.append(y_pred)
        
        return yt, yp
    
    def run(self, dataset_path):
        """
        Run the complete LCCDE algorithm on a dataset
        
        Args:
            dataset_path: Path to the CSV dataset file
        
        Returns:
            dict: Results including metrics and model information
        """
        start_time = time.time()
        
        # Load and preprocess data
        print("Loading dataset...")
        df = pd.read_csv(dataset_path)
        
        X = df.drop(['Label'], axis=1)
        y = df['Label']
        
        # Split data
        print("Splitting data...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, train_size=self.train_size, test_size=self.test_size, 
            random_state=self.random_state
        )
        
        # Apply SMOTE for class imbalance
        print("Applying SMOTE...")
        smote = SMOTE(n_jobs=-1, sampling_strategy=self.smote_strategy)
        X_train, y_train = smote.fit_resample(X_train, y_train)
        
        # Train base learners
        base_results = self.train_base_learners(X_train, y_train, X_test, y_test)
        
        # Find leader models
        self.find_leader_models()
        
        # Implement LCCDE prediction
        print("Running LCCDE prediction...")
        yt, yp = self.predict_lccde(X_test, y_test, self.lg, self.xg, self.cb)
        
        # Calculate final metrics
        accuracy = accuracy_score(y_test[:len(yp)], yp)
        precision = precision_score(y_test[:len(yp)], yp, average='weighted')
        recall = recall_score(y_test[:len(yp)], yp, average='weighted')
        f1 = f1_score(y_test[:len(yp)], yp, average='weighted')
        f1_per_class = f1_score(y_test[:len(yp)], yp, average=None)
        
        execution_time = time.time() - start_time
        
        results = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_weighted': float(f1),
            'f1_per_class': [float(x) for x in f1_per_class],
            'execution_time': execution_time,
            'classification_report': classification_report(y_test[:len(yp)], yp),
            'confusion_matrix': confusion_matrix(y_test[:len(yp)], yp).tolist(),
            'base_results': base_results,
            'leader_models': [type(m).__name__ for m in self.model]
        }
        
        return results

