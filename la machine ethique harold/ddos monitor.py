#!/usr/bin/env python3
"""
CONTRE ATTAQUE - Anti-DDoS Monitor
Système de surveillance et protection contre les attaques DDoS
Version: 2.0 Windows
"""

import json
import logging
import os
import socket
import sys
import threading
import time
import tkinter as tk
from datetime import datetime
from tkinter import messagebox, scrolledtext
from typing import Dict, List
import urllib.error
import urllib.request

# =============================================================================
# CONFIGURATION
# =============================================================================

class Config:
    """Configuration centralisée de l'application."""

    # Fichiers
    QUARANTINE_FILE = "quarantine.txt"
    LOG_FILE = "ddos_monitor.log"
    CONFIG_FILE = "config.json"

    # Limites de surveillance
    MAX_REQUESTS_PER_INTERVAL = 100
    MONITOR_INTERVAL_SECONDS = 10
    TRAFFIC_CAPTURE_INTERVAL = 0.05

    # Interface utilisateur
    WINDOW_TITLE = "CONTRE ATTAQUE - Anti-DDoS Monitor v2.0"
    WINDOW_SIZE = "800x600"
    BUTTON_WIDTH = 35
    LOG_DISPLAY_WIDTH = 90
    LOG_DISPLAY_HEIGHT = 25

    @classmethod
    def load_from_file(cls) -> Dict:
        """Charge la configuration depuis un fichier JSON."""
        try:
            if os.path.exists(cls.CONFIG_FILE):
                with open(cls.CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logging.warning(f"Impossible de charger la configuration: {e}")
        return {}

    @classmethod
    def save_to_file(cls, config: Dict) -> None:
        """Sauvegarde la configuration dans un fichier JSON."""
        try:
            with open(cls.CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except IOError as e:
            logging.error(f"Impossible de sauvegarder la configuration: {e}")

# =============================================================================
# CONFIGURATION DU LOGGING
# =============================================================================

def setup_logging() -> logging.Logger:
    """Configure le système de logging."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(Config.LOG_FILE, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

# =============================================================================
# UTILITAIRES RÉSEAU
# =============================================================================

class NetworkUtils:
    """Utilitaires pour les opérations réseau."""

    @staticmethod
    def get_local_ip() -> str:
        """
        Récupère l'adresse IP locale de la machine.

        Returns:
            str: L'adresse IP locale ou '127.0.0.1' en cas d'erreur
        """
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except OSError as e:
            logging.warning(f"Impossible de récupérer l'IP locale: {e}")
            return "127.0.0.1"

    @staticmethod
    def get_public_ip() -> str:
        """
        Récupère l'adresse IP publique via un service externe.

        Returns:
            str: L'adresse IP publique ou '0.0.0.0' en cas d'erreur
        """
        try:
            with urllib.request.urlopen("https://api.ipify.org", timeout=5) as response:
                return response.read().decode('utf-8').strip()
        except (urllib.error.URLError, OSError) as e:
            logging.warning(f"Impossible de récupérer l'IP publique: {e}")
            return "0.0.0.0"

# =============================================================================
# SYSTÈME DE QUARANTAINE
# =============================================================================

class QuarantineManager:
    """Gestionnaire de quarantaine pour les IP suspectes."""

    def __init__(self, quarantine_file: str = Config.QUARANTINE_FILE):
        self.quarantine_file = quarantine_file
        self.logger = logging.getLogger(f"{__name__}.QuarantineManager")

    def add_to_quarantine(self, ip_type: str, reason: str = "DDoS détecté") -> None:
        """
        Ajoute une entrée à la quarantaine.

        Args:
            ip_type: Type d'IP ('local' ou 'public')
            reason: Raison de la quarantaine
        """
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            entry = f"[{timestamp}] {ip_type.upper()} - {reason}\n"

            with open(self.quarantine_file, 'a', encoding='utf-8') as f:
                f.write(entry)

            self.logger.warning(f"IP {ip_type} ajoutée à la quarantaine: {reason}")
        except IOError as e:
            self.logger.error(f"Erreur lors de l'ajout en quarantaine: {e}")

    def clear_quarantine(self) -> None:
        """Vide le fichier de quarantaine."""
        try:
            with open(self.quarantine_file, 'w', encoding='utf-8'):
                pass
            self.logger.info("Quarantaine vidée avec succès")
        except IOError as e:
            self.logger.error(f"Erreur lors du vidage de la quarantaine: {e}")

    def get_quarantine_entries(self) -> List[str]:
        """
        Récupère les entrées de quarantaine.

        Returns:
            List[str]: Liste des entrées de quarantaine
        """
        try:
            if os.path.exists(self.quarantine_file):
                with open(self.quarantine_file, 'r', encoding='utf-8') as f:
                    return f.readlines()
        except IOError as e:
            self.logger.error(f"Erreur lors de la lecture de la quarantaine: {e}")
        return []

# =============================================================================
# MONITEUR DE TRAFIC
# =============================================================================

class TrafficMonitor:
    """Moniteur de trafic réseau pour détecter les attaques DDoS."""

    def __init__(self, quarantine_manager: QuarantineManager):
        self.quarantine_manager = quarantine_manager
        self.logger = logging.getLogger(f"{__name__}.TrafficMonitor")

        # Configuration
        self.max_requests = Config.MAX_REQUESTS_PER_INTERVAL
        self.monitor_interval = Config.MONITOR_INTERVAL_SECONDS
        self.capture_interval = Config.TRAFFIC_CAPTURE_INTERVAL

        # État du monitoring
        self.traffic_log: Dict[str, List[float]] = {"local": [], "public": []}
        self.stop_event = threading.Event()
        self.monitor_thread = None
        self.capture_thread = None

        # Callbacks pour l'interface utilisateur
        self.on_alert_callback = None
        self.on_log_callback = None

    def set_alert_callback(self, callback) -> None:
        """Définit le callback pour les alertes."""
        self.on_alert_callback = callback

    def set_log_callback(self, callback) -> None:
        """Définit le callback pour les logs."""
        self.on_log_callback = callback

    def start_monitoring(self) -> None:
        """Démarre le monitoring du trafic."""
        if self.is_monitoring():
            self.logger.warning("Le monitoring est déjà en cours")
            return

        self.stop_event.clear()

        # Récupération des IPs
        local_ip = NetworkUtils.get_local_ip()
        public_ip = NetworkUtils.get_public_ip()

        start_message = f"Démarrage du monitoring - Local: {local_ip}, Public: {public_ip}"
        self.logger.info(start_message)
        self._log_to_ui(start_message)

        # Démarrage des threads
        self.monitor_thread = threading.Thread(
            target=self._monitor_loop,
            name="MonitorThread",
            daemon=True
        )
        self.capture_thread = threading.Thread(
            target=self._capture_loop,
            name="CaptureThread",
            daemon=True
        )

        self.monitor_thread.start()
        self.capture_thread.start()

        self.logger.info("Threads de monitoring démarrés")

    def stop_monitoring(self) -> None:
        """Arrête le monitoring du trafic."""
        if not self.is_monitoring():
            return

        self.stop_event.set()

        # Attendre que les threads se terminent
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2.0)
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=2.0)

        stop_message = "Monitoring arrêté"
        self.logger.info(stop_message)
        self._log_to_ui(stop_message)

    def is_monitoring(self) -> bool:
        """Vérifie si le monitoring est en cours."""
        return (self.monitor_thread and self.monitor_thread.is_alive() and
                self.capture_thread and self.capture_thread.is_alive())

    def _monitor_loop(self) -> None:
        """Boucle principale de monitoring."""
        while not self.stop_event.is_set():
            try:
                current_time = time.time()

                for ip_type in self.traffic_log:
                    # Nettoyer les anciennes entrées
                    self.traffic_log[ip_type] = [
                        timestamp for timestamp in self.traffic_log[ip_type]
                        if current_time - timestamp < self.monitor_interval
                    ]

                    # Vérifier le seuil
                    request_count = len(self.traffic_log[ip_type])
                    if request_count > self.max_requests:
                        self._handle_ddos_alert(ip_type, request_count)

                time.sleep(self.monitor_interval)

            except Exception as e:
                self.logger.error(f"Erreur dans la boucle de monitoring: {e}")
                time.sleep(1)

    def _capture_loop(self) -> None:
        """Boucle de capture du trafic (simulation)."""
        while not self.stop_event.is_set():
            try:
                current_time = time.time()

                # Simulation de capture de trafic
                # Dans un vrai système, ceci analyserait le trafic réseau réel
                self.traffic_log["local"].append(current_time)
                self.traffic_log["public"].append(current_time)

                time.sleep(self.capture_interval)

            except Exception as e:
                self.logger.error(f"Erreur dans la boucle de capture: {e}")
                time.sleep(1)

    def _handle_ddos_alert(self, ip_type: str, request_count: int) -> None:
        """
        Gère une alerte DDoS.

        Args:
            ip_type: Type d'IP concernée
            request_count: Nombre de requêtes détectées
        """
        alert_message = f"ALERTE DDoS sur IP {ip_type.upper()} ! ({request_count} requêtes)"

        self.logger.critical(alert_message)
        self._log_to_ui(alert_message)

        # Ajouter à la quarantaine
        self.quarantine_manager.add_to_quarantine(
            ip_type,
            f"DDoS détecté - {request_count} requêtes en {self.monitor_interval}s"
        )

        # Callback pour l'interface utilisateur
        if self.on_alert_callback:
            try:
                self.on_alert_callback(ip_type, request_count)
            except Exception as e:
                self.logger.error(f"Erreur dans le callback d'alerte: {e}")

    def _log_to_ui(self, message: str) -> None:
        """Envoie un message de log à l'interface utilisateur."""
        if self.on_log_callback:
            try:
                self.on_log_callback(message)
            except Exception as e:
                self.logger.error(f"Erreur dans le callback de log: {e}")

# =============================================================================
# INTERFACE GRAPHIQUE
# =============================================================================

class AntiDDoSGUI:
    """Interface graphique pour le monitoring anti-DDoS."""

    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.AntiDDoSGUI")

        # Composants métier
        self.quarantine_manager = QuarantineManager()
        # ... (compléter l'implémentation de l'interface graphique ici) 