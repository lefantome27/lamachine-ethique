#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import logging
import os
from datetime import datetime, timedelta
from collections import defaultdict
import json
from config import CONFIG, RULES_DIR

class TrafficAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.traffic_patterns = defaultdict(list)
        self.load_model()
        self.sensitivity = CONFIG['analysis']['sensitivity']

    def load_model(self):
        """Charge le modèle ML s'il existe, sinon en crée un nouveau."""
        model_path = os.path.join(RULES_DIR, "traffic_model.joblib")
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                logging.info("Modèle ML chargé avec succès")
            except Exception as e:
                logging.error(f"Erreur lors du chargement du modèle ML: {e}")
                self.create_new_model()
        else:
            self.create_new_model()

    def create_new_model(self):
        """Crée un nouveau modèle d'isolation forest."""
        self.model = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        logging.info("Nouveau modèle ML créé")

    def save_model(self):
        """Sauvegarde le modèle ML."""
        try:
            model_path = os.path.join(RULES_DIR, "traffic_model.joblib")
            joblib.dump(self.model, model_path)
            logging.info("Modèle ML sauvegardé avec succès")
        except Exception as e:
            logging.error(f"Erreur lors de la sauvegarde du modèle ML: {e}")

    def extract_features(self, traffic_data):
        """Extrait les caractéristiques du trafic pour l'analyse."""
        if not traffic_data:
            return None

        data = np.array(traffic_data)
        features = {
            'mean': np.mean(data),
            'std': np.std(data),
            'max': np.max(data),
            'min': np.min(data),
            'median': np.median(data),
            'q25': np.percentile(data, 25),
            'q75': np.percentile(data, 75),
            'rate_of_change': np.mean(np.diff(data)) if len(data) > 1 else 0
        }
        return features

    def analyze_traffic(self, current_traffic, time_window=300):
        """Analyse le trafic pour détecter les anomalies."""
        # Ajouter le trafic actuel à l'historique
        timestamp = datetime.now()
        self.traffic_patterns['traffic'].append({
            'timestamp': timestamp,
            'value': current_traffic
        })

        # Nettoyer les anciennes données
        cutoff_time = timestamp - timedelta(seconds=time_window)
        self.traffic_patterns['traffic'] = [
            x for x in self.traffic_patterns['traffic']
            if x['timestamp'] > cutoff_time
        ]

        # Extraire les caractéristiques
        traffic_values = [x['value'] for x in self.traffic_patterns['traffic']]
        features = self.extract_features(traffic_values)

        if features is None:
            return False, 0.0

        # Préparer les données pour le ML
        X = np.array([[
            features['mean'],
            features['std'],
            features['max'],
            features['min'],
            features['median'],
            features['rate_of_change']
        ]])

        # Normaliser les données
        X_scaled = self.scaler.fit_transform(X)

        # Prédire
        if CONFIG['analysis']['ml_enabled']:
            score = self.model.score_samples(X_scaled)[0]
            is_anomaly = score < -self.sensitivity
        else:
            # Analyse basique si ML est désactivé
            is_anomaly = (
                features['mean'] > CONFIG['thresholds']['warning'] or
                features['max'] > CONFIG['thresholds']['critical']
            )
            score = features['mean'] / CONFIG['thresholds']['warning']

        return is_anomaly, abs(score)

    def detect_patterns(self, traffic_history):
        """Détecte les motifs d'attaque dans l'historique du trafic."""
        patterns = []

        if len(traffic_history) < 10:
            return patterns

        # Convertir en DataFrame pour l'analyse
        df = pd.DataFrame(traffic_history)

        # Détecter les pics soudains
        rolling_mean = df['value'].rolling(window=5).mean()
        rolling_std = df['value'].rolling(window=5).std()

        # Identifier les anomalies
        anomalies = df[abs(df['value'] - rolling_mean) > 2 * rolling_std]

        if not anomalies.empty:
            patterns.append({
                'type': 'spike',
                'count': len(anomalies),
                'max_value': float(anomalies['value'].max()),
                'timestamps': anomalies['timestamp'].tolist()
            })

        # Détecter les tendances croissantes
        if len(df) >= 30:
            trend = np.polyfit(range(len(df['value'])), df['value'], 1)[0]
            if trend > 0:
                patterns.append({
                    'type': 'increasing_trend',
                    'slope': float(trend)
                })

        return patterns

    def save_analysis(self, analysis_data):
        """Sauvegarde les résultats d'analyse."""
        try:
            filename = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = os.path.join(RULES_DIR, filename)

            with open(filepath, 'w') as f:
                json.dump(analysis_data, f, indent=4, default=str)

            logging.info(f"Analyse sauvegardée dans {filepath}")
            return filepath
        except Exception as e:
            logging.error(f"Erreur lors de la sauvegarde de l'analyse: {e}")
            return None

    def get_threat_level(self, anomaly_score):
        """Détermine le niveau de menace basé sur le score d'anomalie."""
        if anomaly_score > 0.8:
            return "critical"
        elif anomaly_score > 0.6:
            return "warning"
        elif anomaly_score > 0.4:
            return "notice"
        return "normal"

    def update_model(self, new_data):
        """Met à jour le modèle avec de nouvelles données."""
        if len(new_data) < 100:  # Minimum de données pour l'entraînement
            return False

        try:
            features = []
            for data_point in new_data:
                extracted = self.extract_features([data_point['value']])
                if extracted:
                    features.append([
                        extracted['mean'],
                        extracted['std'],
                        extracted['max'],
                        extracted['min'],
                        extracted['median'],
                        extracted['rate_of_change']
                    ])

            if features:
                X = np.array(features)
                X_scaled = self.scaler.fit_transform(X)
                self.model.fit(X_scaled)
                self.save_model()
                logging.info("Modèle ML mis à jour avec succès")
                return True

        except Exception as e:
            logging.error(f"Erreur lors de la mise à jour du modèle: {e}")
            return False 