#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from pathlib import Path

# ============================================================================
#  Projet : Contre Attaque Pro - Anti-DDoS
#  Fichier : config.py
#  Description : Fichier de configuration centralisée pour l'application.
#                Toutes les options (analyse, seuils, alertes, sécurité, etc.)
#                sont regroupées ici pour faciliter l'adaptation et la maintenance.
#  --------------------------------------------------------------------------
#  Ce fichier est massivement commenté pour la pédagogie et la présentation.
#  Il explique la structure de la configuration, les usages, et les bonnes pratiques.
#  Compatible Notepad++ (UTF-8, commentaires #).
# ============================================================================

# -------------
# Explications :
# -------------
# - Le dictionnaire CONFIG regroupe toutes les options de l'application.
# - Chaque section (analysis, thresholds, notifications, firewall, etc.)
#   correspond à un aspect du fonctionnement du système.
# - Pour adapter le comportement du logiciel, il suffit de modifier les valeurs ici.
# - Les chemins, seuils, et options de sécurité sont centralisés pour éviter les erreurs.
# - Les fonctions utilitaires en bas du fichier permettent de charger, valider,
#   et sauvegarder la configuration depuis/vers un fichier externe.
#
# Bonnes pratiques :
# - Sauvegarder ce fichier avant toute modification importante.
# - Documenter toute modification de structure ou de valeur critique.
# - Utiliser les fonctions de validation pour éviter les erreurs de configuration.

# Configuration principale
CONFIG = {
    # Configuration générale
    'general': {
        'debug': True,
        'log_level': 'INFO',
        'max_log_size': 10485760,  # 10 MB
        'backup_count': 5,
        'timezone': 'Europe/Paris'
    },
    
    # Configuration de l'analyse
    'analysis': {
        'enabled': True,
        'ml_enabled': True,
        'sensitivity': 0.1,
        'time_window': 300,  # 5 minutes en secondes
        'min_data_points': 10,
        'max_data_points': 10000,
        'update_interval': 60,  # secondes
        'batch_size': 100,
        'confidence_threshold': 0.8
    },
    
    # Seuils d'alerte
    'thresholds': {
        'normal': 50,
        'warning': 100,
        'critical': 200,
        'emergency': 500,
        'baseline': 30,
        'spike_threshold': 2.0,  # Multiplicateur pour détecter les pics
        'trend_threshold': 0.1   # Seuil pour détecter les tendances
    },
    
    # Configuration du modèle ML
    'ml_model': {
        'type': 'isolation_forest',
        'contamination': 0.1,
        'n_estimators': 100,
        'max_samples': 'auto',
        'random_state': 42,
        'n_jobs': -1,
        'max_features': 1.0,
        'bootstrap': False,
        'warm_start': False,
        'verbose': 0
    },
    
    # Configuration des patterns
    'patterns': {
        'detect_spikes': True,
        'detect_trends': True,
        'detect_cycles': True,
        'spike_window': 10,
        'trend_window': 30,
        'cycle_window': 1440,  # 24 heures en minutes
        'min_spike_height': 1.5,
        'min_trend_slope': 0.05
    },
    
    # Configuration des alertes
    'alerts': {
        'enabled': True,
        'email_enabled': False,
        'sms_enabled': False,
        'webhook_enabled': False,
        'notification_interval': 300,  # 5 minutes
        'escalation_time': 1800,  # 30 minutes
        'max_alerts_per_hour': 10,
        'alert_cooldown': 600  # 10 minutes
    },
    
    # Configuration des notifications
    'notifications': {
        'email': {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'use_tls': True,
            'username': '',
            'password': '',
            'from_address': '',
            'to_addresses': [],
            'subject_prefix': '[TRAFFIC ALERT]'
        },
        'webhook': {
            'url': '',
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': ''
            },
            'timeout': 30
        },
        'slack': {
            'webhook_url': '',
            'channel': '#alerts',
            'username': 'Traffic Monitor',
            'icon_emoji': ':warning:'
        }
    },
    
    # Configuration de la base de données
    'database': {
        'type': 'sqlite',  # sqlite, postgresql, mysql
        'path': 'traffic_data.db',
        'host': 'localhost',
        'port': 5432,
        'name': 'traffic_analysis',
        'username': '',
        'password': '',
        'pool_size': 10,
        'max_overflow': 20,
        'echo': False
    },
    
    # Configuration du stockage
    'storage': {
        'data_retention_days': 30,
        'backup_enabled': True,
        'backup_interval': 86400,  # 24 heures
        'compression_enabled': True,
        'archive_enabled': True,
        'archive_after_days': 7
    },
    
    # Configuration de la sécurité
    'security': {
        'encryption_enabled': True,
        'encryption_key': '',
        'hash_algorithm': 'sha256',
        'session_timeout': 3600,  # 1 heure
        'max_login_attempts': 3,
        'lockout_duration': 1800,  # 30 minutes
        'require_ssl': True,
        'allowed_ips': [],
        'blocked_ips': []
    },
    
    # Configuration des performances
    'performance': {
        'max_threads': 4,
        'queue_size': 1000,
        'timeout': 30,
        'retry_attempts': 3,
        'retry_delay': 5,
        'cache_enabled': True,
        'cache_size': 1000,
        'cache_ttl': 300  # 5 minutes
    },
    
    # Configuration des rapports
    'reports': {
        'enabled': True,
        'auto_generate': True,
        'schedule': '0 0 * * *',  # Tous les jours à minuit
        'format': 'pdf',  # pdf, html, csv, json
        'include_charts': True,
        'include_anomalies': True,
        'include_statistics': True,
        'email_reports': False
    },
    
    # Configuration des plugins
    'plugins': {
        'enabled': True,
        'plugin_dir': 'plugins',
        'auto_load': True,
        'reload_on_change': True,
        'plugin_timeout': 30
    },
    
    # Configuration du monitoring
    'monitoring': {
        'health_check_interval': 60,  # secondes
        'metrics_enabled': True,
        'metrics_port': 8080,
        'prometheus_enabled': False,
        'grafana_enabled': False,
        'dashboard_url': ''
    }
}

# Configuration des chemins
BASE_DIR = Path(__file__).parent.absolute()
RULES_DIR = BASE_DIR / 'rules'
DATA_DIR = BASE_DIR / 'data'
LOGS_DIR = BASE_DIR / 'logs'
PLUGINS_DIR = BASE_DIR / 'plugins'
REPORTS_DIR = BASE_DIR / 'reports'
BACKUP_DIR = BASE_DIR / 'backups'
TEMP_DIR = BASE_DIR / 'temp'

# Créer les répertoires s'ils n'existent pas
for directory in [RULES_DIR, DATA_DIR, LOGS_DIR, PLUGINS_DIR, REPORTS_DIR, BACKUP_DIR, TEMP_DIR]:
    directory.mkdir(exist_ok=True)

# Configuration des chemins de fichiers
PATHS = {
    'model_file': RULES_DIR / 'traffic_model.joblib',
    'scaler_file': RULES_DIR / 'scaler.joblib',
    'config_file': BASE_DIR / 'config.py',
    'log_file': LOGS_DIR / 'traffic_analyzer.log',
    'database_file': DATA_DIR / 'traffic_data.db',
    'rules_file': RULES_DIR / 'rules.json',
    'patterns_file': RULES_DIR / 'patterns.json',
    'alerts_file': RULES_DIR / 'alerts.json',
    'backup_file': BACKUP_DIR / 'backup_{timestamp}.zip',
    'report_file': REPORTS_DIR / 'report_{date}.pdf',
    'temp_file': TEMP_DIR / 'temp_{pid}.tmp'
}

# Configuration des formats de date
DATE_FORMATS = {
    'display': '%Y-%m-%d %H:%M:%S',
    'file': '%Y%m%d_%H%M%S',
    'log': '%Y-%m-%d %H:%M:%S',
    'database': '%Y-%m-%d %H:%M:%S',
    'api': '%Y-%m-%dT%H:%M:%SZ'
}

# Configuration des types de données
DATA_TYPES = {
    'traffic': 'float64',
    'timestamp': 'datetime64[ns]',
    'anomaly_score': 'float64',
    'threat_level': 'category',
    'source_ip': 'string',
    'destination_ip': 'string',
    'protocol': 'category',
    'port': 'int32'
}

# Configuration des colonnes
COLUMNS = {
    'traffic_data': [
        'timestamp',
        'value',
        'source_ip',
        'destination_ip',
        'protocol',
        'port',
        'bytes_sent',
        'bytes_received',
        'packets_sent',
        'packets_received'
    ],
    'anomaly_data': [
        'timestamp',
        'anomaly_score',
        'threat_level',
        'features',
        'prediction',
        'confidence'
    ],
    'alert_data': [
        'timestamp',
        'alert_type',
        'severity',
        'message',
        'source',
        'acknowledged',
        'resolved'
    ]
}

# Configuration des niveaux de log
LOG_LEVELS = {
    'DEBUG': 10,
    'INFO': 20,
    'WARNING': 30,
    'ERROR': 40,
    'CRITICAL': 50
}

# Configuration des niveaux de menace
THREAT_LEVELS = {
    'normal': 0,
    'notice': 1,
    'warning': 2,
    'critical': 3,
    'emergency': 4
}

# Configuration des couleurs pour les logs
LOG_COLORS = {
    'DEBUG': '\033[36m',    # Cyan
    'INFO': '\033[32m',     # Green
    'WARNING': '\033[33m',  # Yellow
    'ERROR': '\033[31m',    # Red
    'CRITICAL': '\033[35m', # Magenta
    'RESET': '\033[0m'      # Reset
}

# Configuration des patterns regex
REGEX_PATTERNS = {
    'ip_address': r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'url': r'^https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$',
    'timestamp': r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$',
    'port': r'^(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$'
}

# Configuration des timeouts
TIMEOUTS = {
    'connection': 30,
    'read': 60,
    'write': 60,
    'analysis': 300,
    'model_training': 3600,
    'backup': 1800,
    'report_generation': 600
}

# Configuration des limites
LIMITS = {
    'max_file_size': 104857600,  # 100 MB
    'max_memory_usage': 1073741824,  # 1 GB
    'max_cpu_usage': 80,  # Pourcentage
    'max_disk_usage': 90,  # Pourcentage
    'max_connections': 1000,
    'max_requests_per_minute': 1000,
    'max_errors_per_hour': 100
}

# Configuration des environnements
ENVIRONMENTS = {
    'development': {
        'debug': True,
        'log_level': 'DEBUG',
        'database': {'type': 'sqlite', 'path': 'dev_traffic_data.db'},
        'notifications': {'enabled': False}
    },
    'testing': {
        'debug': True,
        'log_level': 'INFO',
        'database': {'type': 'sqlite', 'path': 'test_traffic_data.db'},
        'notifications': {'enabled': False},
        'analysis': {'ml_enabled': False}
    },
    'production': {
        'debug': False,
        'log_level': 'WARNING',
        'database': {'type': 'postgresql', 'host': 'localhost'},
        'notifications': {'enabled': True},
        'security': {'encryption_enabled': True}
    }
}

# Fonction pour obtenir la configuration selon l'environnement
def get_config(environment='development'):
    """Retourne la configuration pour un environnement donné."""
    env_config = ENVIRONMENTS.get(environment, ENVIRONMENTS['development'])
    
    # Fusionner avec la configuration de base
    config = CONFIG.copy()
    for section, values in env_config.items():
        if section in config:
            config[section].update(values)
        else:
            config[section] = values
    
    return config

# Fonction pour valider la configuration
def validate_config(config):
    """Valide la configuration et retourne les erreurs."""
    errors = []
    
    # Vérifier les chemins requis
    required_paths = ['RULES_DIR', 'DATA_DIR', 'LOGS_DIR']
    for path_name in required_paths:
        path = globals().get(path_name)
        if not path or not path.exists():
            errors.append(f"Chemin requis manquant: {path_name}")
    
    # Vérifier les seuils
    thresholds = config.get('thresholds', {})
    if thresholds.get('warning', 0) <= thresholds.get('normal', 0):
        errors.append("Le seuil warning doit être supérieur au seuil normal")
    if thresholds.get('critical', 0) <= thresholds.get('warning', 0):
        errors.append("Le seuil critical doit être supérieur au seuil warning")
    
    # Vérifier la configuration ML
    ml_config = config.get('ml_model', {})
    if ml_config.get('contamination', 0) <= 0 or ml_config.get('contamination', 0) >= 1:
        errors.append("La contamination doit être entre 0 et 1")
    
    return errors

# Fonction pour charger la configuration depuis un fichier
def load_config_from_file(config_file):
    """Charge la configuration depuis un fichier JSON ou YAML."""
    import json
    import yaml
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            if config_file.endswith('.json'):
                return json.load(f)
            elif config_file.endswith('.yaml') or config_file.endswith('.yml'):
                return yaml.safe_load(f)
        else:
                raise ValueError("Format de fichier non supporté")
    except Exception as e:
        print(f"Erreur lors du chargement de la configuration: {e}")
        return CONFIG

# Fonction pour sauvegarder la configuration
def save_config_to_file(config, config_file):
    """Sauvegarde la configuration dans un fichier."""
    import json
    
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de la configuration: {e}")
        return False

# Configuration par défaut
if __name__ == "__main__":
    # Valider la configuration
    errors = validate_config(CONFIG)
    if errors:
        print("Erreurs de configuration détectées:")
        for error in errors:
            print(f"  - {error}")
    else:
        print("Configuration valide")
    
    # Afficher les chemins
    print("\nChemins de configuration:")
    for name, path in PATHS.items():
        print(f"  {name}: {path}") 