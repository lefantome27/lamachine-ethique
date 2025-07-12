#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import threading
import time
import socket
import urllib.request
from datetime import datetime
import tkinter as tk
from tkinter import messagebox, scrolledtext
import logging
import os
import requests
import psutil
import collections

# Configuration
MAX_REQUESTS = 1000  # Seuil plus réaliste pour les requêtes
MONITOR_INTERVAL = 10  # Monitoring interval in seconds
QUARANTINE_FILE = "quarantaine.txt"
LOG_FILE = "mode_journal.log"
VERSION = "1.0.0"

# Ensure log directory exists
os.makedirs("logs", exist_ok=True)
LOG_FILE = os.path.join("logs", LOG_FILE)

# Configure logging with rotation
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)

class NetworkMonitor:
    def __init__(self):
        self.previous_bytes = self._get_network_bytes()
        self.traffic_history = collections.deque(maxlen=60)  # 1 minute history

    def _get_network_bytes(self):
        """Get current network bytes counter."""
        network_stats = psutil.net_io_counters()
        return network_stats.bytes_sent + network_stats.bytes_recv

    def get_current_traffic(self):
        """Calculate current network traffic in bytes/sec."""
        current_bytes = self._get_network_bytes()
        bytes_diff = current_bytes - self.previous_bytes
        self.previous_bytes = current_bytes
        return bytes_diff

class DDoSMonitor:
    def __init__(self):
        self.network_monitor = NetworkMonitor()
        self.stop_event = threading.Event()
        self.monitor_thread = None
        self.alert_count = 0
        self.last_alert_time = 0
        self.traffic_threshold = 1000000  # 1 MB/s seuil d'alerte
        self.consecutive_high_traffic = 0
        self.is_under_attack = False

    def get_local_ip(self):
        """Get the local IP address of the machine."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(5)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception as e:
            logging.error(f"Erreur lors de la récupération de l'IP locale: {e}")
            return "127.0.0.1"

    def get_public_ip(self):
        """Get the public IP address of the machine."""
        try:
            response = requests.get("https://api.ipify.org", timeout=5)
            return response.text
        except Exception as e:
            logging.error(f"Erreur lors de la récupération de l'IP publique: {e}")
            return "0.0.0.0"

    def alert_ddos(self, traffic_rate):
        """Log and display DDoS alert."""
        current_time = time.time()
        if current_time - self.last_alert_time < 30:  # Limite les alertes à une toutes les 30 secondes
            return

        self.last_alert_time = current_time
        self.alert_count += 1
        self.is_under_attack = True

        message = f"[ALERTE] Trafic suspect détecté!\nDébit actuel: {traffic_rate/1000000:.2f} MB/s"
        logging.warning(message)
        try:
            with open(QUARANTINE_FILE, "a", encoding="utf-8") as f:
                f.write(f"{datetime.now()} - {message}\n")
            messagebox.showwarning("ALERTE Trafic Suspect", message)
        except Exception as e:
            logging.error(f"Erreur lors de l'enregistrement de l'alerte: {e}")

    def reset_quarantine(self):
        """Clear the quarantine file."""
        try:
            with open(QUARANTINE_FILE, 'w', encoding="utf-8") as f:
                f.write(f"Fichier vidé le {datetime.now()}\n")
            logging.info("Quarantaine vidée")
            messagebox.showinfo("Info", "La quarantaine a été vidée avec succès")
        except Exception as e:
            logging.error(f"Erreur lors du vidage de la quarantaine: {e}")
            messagebox.showerror("Erreur", "Impossible de vider la quarantaine")

    def monitor(self):
        """Monitor network traffic for potential DDoS attacks."""
        while not self.stop_event.is_set():
            try:
                traffic_rate = self.network_monitor.get_current_traffic()
                self.network_monitor.traffic_history.append(traffic_rate)

                # Calcul de la moyenne mobile sur 5 secondes
                recent_average = sum(list(self.network_monitor.traffic_history)[-5:]) / 5

                if recent_average > self.traffic_threshold:
                    self.consecutive_high_traffic += 1
                    if self.consecutive_high_traffic >= 5:  # 5 secondes de trafic élevé
                        self.alert_ddos(recent_average)
                else:
                    self.consecutive_high_traffic = 0
                    if self.is_under_attack:
                        self.is_under_attack = False
                        logging.info("Trafic revenu à la normale")

                time.sleep(1)
            except Exception as e:
                logging.error(f"Erreur dans la surveillance: {e}")
                time.sleep(1)

    def start_monitoring(self):
        """Start the monitoring thread."""
        if not self.monitor_thread or not self.monitor_thread.is_alive():
            self.stop_event.clear()
            self.monitor_thread = threading.Thread(target=self.monitor, daemon=True)
            self.monitor_thread.start()
            logging.info("Surveillance activée")
            return True
        return False

    def stop_monitoring(self):
        """Stop the monitoring thread."""
        self.stop_event.set()
        if self.monitor_thread:
            self.monitor_thread.join(timeout=1)
        logging.info("Surveillance arrêtée")

class AntiDDoSGUI:
    def __init__(self):
        self.monitor = DDoSMonitor()
        self.window = tk.Tk()
        self.window.title(f"CONTRE ATTAQUE - Anti-DDoS v{VERSION}")
        self.window.geometry("500x400")
        self.window.resizable(False, False)
        self.create_widgets()
        self.update_traffic_display()

    def create_widgets(self):
        """Create and setup GUI widgets."""
        # Version and Title
        title_frame = tk.Frame(self.window)
        title_frame.pack(fill="x", padx=10, pady=5)

        title_label = tk.Label(
            title_frame,
            text="CONTRE ATTAQUE - Protection Anti-DDoS",
            font=("Helvetica", 12, "bold")
        )
        title_label.pack()

        version_label = tk.Label(
            title_frame,
            text=f"Version {VERSION}",
            font=("Helvetica", 8)
        )
        version_label.pack()

        # IP Information
        local_ip = self.monitor.get_local_ip()
        public_ip = self.monitor.get_public_ip()

        info_frame = tk.LabelFrame(self.window, text="Informations IP", padx=10, pady=5)
        info_frame.pack(fill="x", padx=10, pady=5)

        ip_info = tk.Label(
            info_frame,
            text=f"IP Locale : {local_ip}\nIP Publique : {public_ip}",
            justify="left"
        )
        ip_info.pack(pady=5)

        # Traffic Monitor
        traffic_frame = tk.LabelFrame(self.window, text="Moniteur de trafic", padx=10, pady=5)
        traffic_frame.pack(fill="x", padx=10, pady=5)

        self.traffic_var = tk.StringVar(value="Trafic actuel: 0 MB/s")
        self.traffic_label = tk.Label(
            traffic_frame,
            textvariable=self.traffic_var,
            font=("Helvetica", 10)
        )
        self.traffic_label.pack(pady=5)

        # Control buttons
        control_frame = tk.LabelFrame(self.window, text="Contrôles", padx=10, pady=5)
        control_frame.pack(fill="x", padx=10, pady=5)

        self.btn_start = tk.Button(
            control_frame,
            text="Démarrer la surveillance",
            command=self.start_monitoring,
            bg="green",
            fg="white",
            height=2
        )
        self.btn_start.pack(fill="x", pady=2)

        self.btn_stop = tk.Button(
            control_frame,
            text="Arrêter la surveillance",
            command=self.stop_monitoring,
            bg="red",
            fg="white",
            state="disabled",
            height=2
        )
        self.btn_stop.pack(fill="x", pady=2)

        self.btn_reset = tk.Button(
            control_frame,
            text="Vider la quarantaine",
            command=self.monitor.reset_quarantine,
            height=2
        )
        self.btn_reset.pack(fill="x", pady=2)

        # Status
        status_frame = tk.LabelFrame(self.window, text="État", padx=10, pady=5)
        status_frame.pack(fill="x", padx=10, pady=5)

        self.status_var = tk.StringVar(value="État: Arrêté")
        status_label = tk.Label(
            status_frame,
            textvariable=self.status_var,
            font=("Helvetica", 10, "bold")
        )
        status_label.pack(pady=5)

        self.window.protocol("WM_DELETE_WINDOW", self.on_closing)

    def update_traffic_display(self):
        """Update the traffic display every second."""
        if hasattr(self.monitor, 'network_monitor') and not self.monitor.stop_event.is_set():
            traffic = self.monitor.network_monitor.get_current_traffic()
            self.traffic_var.set(f"Trafic actuel: {traffic/1000000:.2f} MB/s")
        self.window.after(1000, self.update_traffic_display)

    def start_monitoring(self):
        """Start monitoring and update GUI."""
        if self.monitor.start_monitoring():
            self.btn_start.config(state="disabled")
            self.btn_stop.config(state="normal")
            self.status_var.set("État: En surveillance")
            self.window.configure(bg="light green")

    def stop_monitoring(self):
        """Stop monitoring and update GUI."""
        self.monitor.stop_monitoring()
        self.btn_start.config(state="normal")
        self.btn_stop.config(state="disabled")
        self.status_var.set("État: Arrêté")
        self.window.configure(bg="SystemButtonFace")

    def on_closing(self):
        """Handle window closing."""
        if messagebox.askokcancel("Quitter", "Voulez-vous vraiment quitter ?"):
            self.monitor.stop_monitoring()
            self.window.destroy()

    def run(self):
        """Start the GUI application."""
        # Center the window on the screen
        self.window.update_idletasks()
        width = self.window.winfo_width()
        height = self.window.winfo_height()
        x = (self.window.winfo_screenwidth() // 2) - (width // 2)
        y = (self.window.winfo_screenheight() // 2) - (height // 2)
        self.window.geometry(f"{width}x{height}+{x}+{y}")

        self.window.mainloop()

def check_single_instance():
    """Ensure only one instance of the program is running."""
    try:
        temp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        temp_socket.bind(('localhost', 12345))
        temp_socket.listen(1)
        return temp_socket
    except socket.error:
        messagebox.showerror("Erreur", "Une instance du programme est déjà en cours d'exécution.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        # Ensure single instance
        lock_socket = check_single_instance()

        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)

        # Start the application
        logging.info("Démarrage de l'application")
        app = AntiDDoSGUI()
        app.run()

    except Exception as e:
        logging.critical(f"Erreur critique de l'application: {e}")
        messagebox.showerror("Erreur critique", f"Une erreur critique est survenue: {e}")
        sys.exit(1)
    finally:
        logging.info("Arrêt de l'application") 