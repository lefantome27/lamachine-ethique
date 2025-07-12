#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import threading
import time
import socket
import logging
import os
import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import seaborn as sns
from datetime import datetime
import json

from config import CONFIG, VERSION
from firewall import FirewallManager
from notifications import NotificationManager
from analysis import TrafficAnalyzer
from network_monitor import NetworkMonitor

class AdvancedAntiDDoSGUI:
    def __init__(self):
        self.setup_managers()
        self.setup_window()
        self.setup_styles()
        self.create_widgets()
        self.setup_graphs()
        self.start_updates()

    def setup_managers(self):
        """Initialise les différents gestionnaires."""
        self.network_monitor = NetworkMonitor()
        self.firewall = FirewallManager()
        self.notifications = NotificationManager()
        self.analyzer = TrafficAnalyzer()

        self.is_monitoring = False
        self.traffic_history = []
        self.alert_history = []

    def setup_window(self):
        """Configure la fenêtre principale."""
        self.window = tk.Tk()
        self.window.title(f"Contre Attaque Pro - Anti-DDoS v{VERSION}")
        self.window.geometry("1200x800")
        self.window.minsize(1000, 600)

        # Configuration du thème
        if CONFIG['interface']['theme'] == 'dark':
            self.setup_dark_theme()
        else:
            self.setup_light_theme()

    def setup_styles(self):
        """Configure les styles de l'interface."""
        style = ttk.Style()

        # Configuration des styles pour les widgets
        style.configure(
            "Critical.TLabel",
            foreground="red",
            font=("Ubuntu", 10, "bold")
        )
        style.configure(
            "Warning.TLabel",
            foreground="orange",
            font=("Ubuntu", 10, "bold")
        )
        style.configure(
            "Normal.TLabel",
            foreground="green",
            font=("Ubuntu", 10)
        )

    def setup_dark_theme(self):
        """Configure le thème sombre."""
        self.window.configure(bg="#2d2d2d")
        self.colors = {
            'bg': "#2d2d2d",
            'fg': "#ffffff",
            'button_bg': "#404040",
            'button_fg': "#ffffff",
            'frame_bg': "#363636",
            'graph_bg': "#2d2d2d",
            'graph_fg': "#ffffff"
        }

    def setup_light_theme(self):
        """Configure le thème clair."""
        self.window.configure(bg="#f0f0f0")
        self.colors = {
            'bg': "#f0f0f0",
            'fg': "#000000",
            'button_bg': "#e0e0e0",
            'button_fg': "#000000",
            'frame_bg': "#ffffff",
            'graph_bg': "#ffffff",
            'graph_fg': "#000000"
        }

    def create_widgets(self):
        """Crée tous les widgets de l'interface."""
        # Création du conteneur principal
        self.main_container = ttk.PanedWindow(self.window, orient=tk.HORIZONTAL)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Panneau de gauche (contrôles et informations)
        self.left_panel = ttk.Frame(self.main_container)
        self.main_container.add(self.left_panel, weight=1)

        # Panneau de droite (graphiques et analyses)
        self.right_panel = ttk.Frame(self.main_container)
        self.main_container.add(self.right_panel, weight=2)

        self.create_info_panel()
        self.create_control_panel()
        self.create_status_panel()
        self.create_blocked_ips_panel()
        self.create_analysis_panel()

    def create_info_panel(self):
        """Crée le panneau d'informations."""
        info_frame = ttk.LabelFrame(self.left_panel, text="Informations système")
        info_frame.pack(fill=tk.X, padx=5, pady=5)

        # Informations réseau
        self.network_info = {}
        for iface, addr in self.network_monitor.get_interfaces():
            label = ttk.Label(
                info_frame,
                text=f"{iface}: {addr}",
                style="Normal.TLabel"
            )
            label.pack(anchor=tk.W, padx=5, pady=2)
            self.network_info[iface] = label

        # IP publique
        self.public_ip_label = ttk.Label(
            info_frame,
            text=f"IP Publique: {self.network_monitor.get_public_ip()}",
            style="Normal.TLabel"
        )
        self.public_ip_label.pack(anchor=tk.W, padx=5, pady=2)

    def create_control_panel(self):
        """Crée le panneau de contrôle."""
        control_frame = ttk.LabelFrame(self.left_panel, text="Contrôles")
        control_frame.pack(fill=tk.X, padx=5, pady=5)

        # Bouton de démarrage
        self.start_button = ttk.Button(
            control_frame,
            text="Démarrer la surveillance",
            command=self.start_monitoring
        )
        self.start_button.pack(fill=tk.X, padx=5, pady=2)

        # Bouton d'arrêt
        self.stop_button = ttk.Button(
            control_frame,
            text="Arrêter la surveillance",
            command=self.stop_monitoring,
            state=tk.DISABLED
        )
        self.stop_button.pack(fill=tk.X, padx=5, pady=2)

        # Boutons de configuration
        ttk.Button(
            control_frame,
            text="Configuration",
            command=self.show_config_dialog
        ).pack(fill=tk.X, padx=5, pady=2)

        ttk.Button(
            control_frame,
            text="Tester les notifications",
            command=self.test_notifications
        ).pack(fill=tk.X, padx=5, pady=2)

    def create_status_panel(self):
        """Crée le panneau de statut."""
        status_frame = ttk.LabelFrame(self.left_panel, text="État du système")
        status_frame.pack(fill=tk.X, padx=5, pady=5)

        # Statut de la surveillance
        self.status_var = tk.StringVar(value="État: Arrêté")
        self.status_label = ttk.Label(
            status_frame,
            textvariable=self.status_var,
            style="Normal.TLabel"
        )
        self.status_label.pack(anchor=tk.W, padx=5, pady=2)

        # Trafic actuel
        self.traffic_var = tk.StringVar(value="Trafic: 0 MB/s")
        self.traffic_label = ttk.Label(
            status_frame,
            textvariable=self.traffic_var,
            style="Normal.TLabel"
        )
        self.traffic_label.pack(anchor=tk.W, padx=5, pady=2)

        # Niveau de menace
        self.threat_var = tk.StringVar(value="Menace: Normal")
        self.threat_label = ttk.Label(
            status_frame,
            textvariable=self.threat_var,
            style="Normal.TLabel"
        )
        self.threat_label.pack(anchor=tk.W, padx=5, pady=2)

    def create_blocked_ips_panel(self):
        """Crée le panneau des IPs bloquées."""
        blocked_frame = ttk.LabelFrame(self.left_panel, text="IPs bloquées")
        blocked_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Liste des IPs bloquées
        self.blocked_ips_list = ttk.Treeview(
            blocked_frame,
            columns=("IP", "Date", "Raison"),
            show="headings"
        )

        self.blocked_ips_list.heading("IP", text="IP")
        self.blocked_ips_list.heading("Date", text="Bloquée le")
        self.blocked_ips_list.heading("Raison", text="Raison")

        scrollbar = ttk.Scrollbar(
            blocked_frame,
            orient=tk.VERTICAL,
            command=self.blocked_ips_list.yview
        )
        self.blocked_ips_list.configure(yscrollcommand=scrollbar.set)

        self.blocked_ips_list.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Boutons d'action
        button_frame = ttk.Frame(blocked_frame)
        button_frame.pack(fill=tk.X, padx=5, pady=5)

        ttk.Button(
            button_frame,
            text="Débloquer sélection",
            command=self.unblock_selected_ip
        ).pack(side=tk.LEFT, padx=2)

        ttk.Button(
            button_frame,
            text="Tout débloquer",
            command=self.unblock_all_ips
        ).pack(side=tk.LEFT, padx=2)

    def create_analysis_panel(self):
        """Crée le panneau d'analyse."""
        analysis_frame = ttk.LabelFrame(self.right_panel, text="Analyse du trafic")
        analysis_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Onglets pour les différents graphiques
        self.notebook = ttk.Notebook(analysis_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        # Onglet du trafic en temps réel
        self.realtime_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.realtime_frame, text="Temps réel")

        # Onglet des statistiques
        self.stats_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.stats_frame, text="Statistiques")

        # Onglet des patterns
        self.patterns_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.patterns_frame, text="Patterns")

    def setup_graphs(self):
        """Configure les graphiques."""
        # Graphique en temps réel
        self.realtime_fig, self.realtime_ax = plt.subplots(figsize=(8, 4))
        self.realtime_canvas = FigureCanvasTkAgg(self.realtime_fig, self.realtime_frame)
        self.realtime_canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        # Configuration du style
        plt.style.use('seaborn')
        self.realtime_ax.set_facecolor(self.colors['graph_bg'])
        self.realtime_fig.patch.set_facecolor(self.colors['graph_bg'])
        self.realtime_ax.tick_params(colors=self.colors['graph_fg'])
        self.realtime_ax.set_title('Trafic réseau en temps réel', color=self.colors['graph_fg'])
        self.realtime_ax.set_xlabel('Temps', color=self.colors['graph_fg'])
        self.realtime_ax.set_ylabel('Trafic (MB/s)', color=self.colors['graph_fg'])

        # Graphique des statistiques
        self.stats_fig, (self.stats_ax1, self.stats_ax2) = plt.subplots(2, 1, figsize=(8, 8))
        self.stats_canvas = FigureCanvasTkAgg(self.stats_fig, self.stats_frame)
        self.stats_canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        # Configuration des graphiques de statistiques
        for ax in [self.stats_ax1, self.stats_ax2]:
            ax.set_facecolor(self.colors['graph_bg'])
            ax.tick_params(colors=self.colors['graph_fg'])

        self.stats_fig.patch.set_facecolor(self.colors['graph_bg'])
        self.stats_ax1.set_title('Distribution du trafic', color=self.colors['graph_fg'])
        self.stats_ax2.set_title('Tendances du trafic', color=self.colors['graph_fg'])

        # Graphique des patterns
        self.patterns_fig, self.patterns_ax = plt.subplots(figsize=(8, 4))
        self.patterns_canvas = FigureCanvasTkAgg(self.patterns_fig, self.patterns_frame)
        self.patterns_canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        self.patterns_ax.set_facecolor(self.colors['graph_bg'])
        self.patterns_fig.patch.set_facecolor(self.colors['graph_bg'])
        self.patterns_ax.tick_params(colors=self.colors['graph_fg'])
        self.patterns_ax.set_title('Détection de patterns', color=self.colors['graph_fg'])

    def start_updates(self):
        """Démarre les mises à jour périodiques."""
        self.update_gui()
        self.update_graphs()
        self.window.after(CONFIG['interface']['update_interval'], self.start_updates)

    def update_gui(self):
        """Met à jour l'interface graphique."""
        if self.is_monitoring:
            # Mise à jour du trafic
            current_traffic = self.network_monitor.get_current_traffic()
            self.traffic_var.set(f"Trafic: {current_traffic:.2f} MB/s")

            # Analyse du trafic
            is_anomaly, score = self.analyzer.analyze_traffic(current_traffic)
            threat_level = self.analyzer.get_threat_level(score)

            # Mise à jour du niveau de menace
            self.threat_var.set(f"Menace: {threat_level.capitalize()}")
            self.threat_label.configure(style=f"{threat_level.capitalize()}.TLabel")

            # Enregistrement pour l'historique
            self.traffic_history.append({
                'timestamp': datetime.now(),
                'value': current_traffic,
                'threat_level': threat_level
            })

            # Vérification des alertes
            if is_anomaly:
                self.handle_anomaly(current_traffic, score, threat_level)

            # Mise à jour de la liste des IPs bloquées
            self.update_blocked_ips_list()

    def update_graphs(self):
        """Met à jour les graphiques."""
        if not self.traffic_history:
            return

        # Mise à jour du graphique en temps réel
        self.update_realtime_graph()

        # Mise à jour des statistiques
        self.update_stats_graphs()

        # Mise à jour des patterns
        self.update_patterns_graph()

    def update_realtime_graph(self):
        """Met à jour le graphique en temps réel."""
        self.realtime_ax.clear()

        # Préparation des données
        times = [x['timestamp'] for x in self.traffic_history[-100:]]
        values = [x['value'] for x in self.traffic_history[-100:]]
        colors = [self.get_color_for_threat(x['threat_level']) for x in self.traffic_history[-100:]]

        # Tracé du graphique
        self.realtime_ax.plot(times, values, '-', color='white', alpha=0.5)
        self.realtime_ax.scatter(times, values, c=colors, alpha=0.6)

        # Configuration
        self.realtime_ax.set_facecolor(self.colors['graph_bg'])
        self.realtime_ax.tick_params(colors=self.colors['graph_fg'])
        self.realtime_ax.set_title('Trafic réseau en temps réel', color=self.colors['graph_fg'])
        self.realtime_ax.set_xlabel('Temps', color=self.colors['graph_fg'])
        self.realtime_ax.set_ylabel('Trafic (MB/s)', color=self.colors['graph_fg'])

        # Rotation des labels pour meilleure lisibilité
        plt.setp(self.realtime_ax.get_xticklabels(), rotation=45)

        self.realtime_fig.tight_layout()
        self.realtime_canvas.draw()

    def update_stats_graphs(self):
        """Met à jour les graphiques de statistiques."""
        # Nettoyage des axes
        self.stats_ax1.clear()
        self.stats_ax2.clear()

        # Données pour la distribution
        values = [x['value'] for x in self.traffic_history]

        # Distribution du trafic
        sns.histplot(values, ax=self.stats_ax1, color='blue', alpha=0.6)
        self.stats_ax1.set_facecolor(self.colors['graph_bg'])
        self.stats_ax1.set_title('Distribution du trafic', color=self.colors['graph_fg'])
        self.stats_ax1.set_xlabel('Trafic (MB/s)', color=self.colors['graph_fg'])
        self.stats_ax1.set_ylabel('Fréquence', color=self.colors['graph_fg'])

        # Tendances
        times = range(len(values))
        self.stats_ax2.plot(times, values, '-', color='green', alpha=0.6)
        self.stats_ax2.set_facecolor(self.colors['graph_bg'])
        self.stats_ax2.set_title('Tendances du trafic', color=self.colors['graph_fg'])
        self.stats_ax2.set_xlabel('Échantillons', color=self.colors['graph_fg'])
        self.stats_ax2.set_ylabel('Trafic (MB/s)', color=self.colors['graph_fg'])

        self.stats_fig.tight_layout()
        self.stats_canvas.draw()

    def update_patterns_graph(self):
        """Met à jour le graphique des patterns."""
        self.patterns_ax.clear()

        # Détection des patterns
        patterns = self.analyzer.detect_patterns(self.traffic_history)

        if patterns:
            # Affichage des patterns détectés
            for pattern in patterns:
                if pattern['type'] == 'spike':
                    times = [x['timestamp'] for x in self.traffic_history]
                    values = [x['value'] for x in self.traffic_history]
                    self.patterns_ax.plot(times, values, '-', color='red', alpha=0.6, label='Pics détectés')
                elif pattern['type'] == 'increasing_trend':
                    self.patterns_ax.axhline(y=pattern['slope'], color='yellow', linestyle='--', label='Tendance croissante')

        self.patterns_ax.set_facecolor(self.colors['graph_bg'])
        self.patterns_ax.set_title('Détection de patterns', color=self.colors['graph_fg'])
        self.patterns_ax.set_xlabel('Temps', color=self.colors['graph_fg'])
        self.patterns_ax.set_ylabel('Trafic (MB/s)', color=self.colors['graph_fg'])
        self.patterns_ax.legend()

        self.patterns_fig.tight_layout()
        self.patterns_canvas.draw()

    def get_color_for_threat(self, threat_level):
        """Retourne la couleur correspondant au niveau de menace."""
        colors = {
            'critical': 'red',
            'warning': 'orange',
            'notice': 'yellow',
            'normal': 'green'
        }
        return colors.get(threat_level, 'green')

    def start_monitoring(self):
        """Démarre la surveillance du trafic."""
        self.is_monitoring = True
        self.status_var.set("État: En cours")
        self.start_button.configure(state=tk.DISABLED)
        self.stop_button.configure(state=tk.NORMAL)

        # Notification de démarrage
        self.notifications.send_alert(
            "Surveillance démarrée",
            "La surveillance du trafic a été activée.",
            "normal"
        )

        logging.info("Surveillance démarrée")

    def stop_monitoring(self):
        """Arrête la surveillance du trafic."""
        self.is_monitoring = False
        self.status_var.set("État: Arrêté")
        self.start_button.configure(state=tk.NORMAL)
        self.stop_button.configure(state=tk.DISABLED)

        # Sauvegarde des données
        self.save_monitoring_data()

        # Notification d'arrêt
        self.notifications.send_alert(
            "Surveillance arrêtée",
            "La surveillance du trafic a été désactivée.",
            "normal"
        )

        logging.info("Surveillance arrêtée")

    def handle_anomaly(self, traffic, score, threat_level):
        """Gère la détection d'une anomalie."""
        # Création du message d'alerte
        message = f"""
        Anomalie détectée !
        ------------------
        Trafic actuel: {traffic:.2f} MB/s
        Score d'anomalie: {score:.2f}
        Niveau de menace: {threat_level}
        """

        # Ajout à l'historique des alertes
        self.alert_history.append({
            'timestamp': datetime.now(),
            'traffic': traffic,
            'score': score,
            'threat_level': threat_level
        })

        # Envoi des notifications
        self.notifications.send_alert(
            "Anomalie détectée",
            message,
            threat_level
        )

        # Blocage automatique si activé
        if CONFIG['firewall']['auto_block'] and threat_level == 'critical':
            suspicious_ips = self.network_monitor.get_top_talkers()
            for ip, traffic in suspicious_ips:
                if traffic > CONFIG['thresholds']['critical']:
                    self.firewall.block_ip(ip, f"Trafic suspect: {traffic:.2f} MB/s")

        logging.warning(f"Anomalie détectée - Niveau: {threat_level}")

    def update_blocked_ips_list(self):
        """Met à jour la liste des IPs bloquées."""
        # Effacement de la liste
        for item in self.blocked_ips_list.get_children():
            self.blocked_ips_list.delete(item)

        # Récupération et affichage des IPs bloquées
        blocked_ips = self.firewall.get_blocked_ips()
        for ip, blocked_at, expires_at, reason in blocked_ips:
            self.blocked_ips_list.insert(
                '',
                'end',
                values=(
                    ip,
                    blocked_at.strftime('%Y-%m-%d %H:%M:%S'),
                    reason
                )
            )

    def unblock_selected_ip(self):
        """Débloque l'IP sélectionnée."""
        selection = self.blocked_ips_list.selection()
        if not selection:
            messagebox.showwarning(
                "Sélection requise",
                "Veuillez sélectionner une IP à débloquer."
            )
            return

        item = self.blocked_ips_list.item(selection[0])
        ip = item['values'][0]

        if self.firewall.unblock_ip(ip):
            messagebox.showinfo(
                "Succès",
                f"L'IP {ip} a été débloquée avec succès."
            )
            self.update_blocked_ips_list()
        else:
            messagebox.showerror(
                "Erreur",
                f"Impossible de débloquer l'IP {ip}."
            )

    def unblock_all_ips(self):
        """Débloque toutes les IPs."""
        if messagebox.askyesno(
            "Confirmation",
            "Voulez-vous vraiment débloquer toutes les IPs ?"
        ):
            blocked_ips = self.firewall.get_blocked_ips()
            for ip, _, _, _ in blocked_ips:
                self.firewall.unblock_ip(ip)

            self.update_blocked_ips_list()
            messagebox.showinfo(
                "Succès",
                "Toutes les IPs ont été débloquées."
            )

    def save_monitoring_data(self):
        """Sauvegarde les données de surveillance."""
        if not self.traffic_history:
            return

        data = {
            'traffic_history': self.traffic_history,
            'alert_history': self.alert_history,
            'timestamp': datetime.now().isoformat()
        }

        filename = f"monitoring_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(CONFIG['reports_dir'], filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=4, default=str)
            logging.info(f"Données de surveillance sauvegardées dans {filepath}")
        except Exception as e:
            logging.error(f"Erreur lors de la sauvegarde des données: {e}")

    def show_config_dialog(self):
        """Affiche la fenêtre de configuration."""
        config_window = tk.Toplevel(self.window)
        config_window.title("Configuration")
        config_window.geometry("600x400")

        notebook = ttk.Notebook(config_window)
        notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Onglet des seuils
        thresholds_frame = ttk.Frame(notebook)
        notebook.add(thresholds_frame, text="Seuils")

        ttk.Label(thresholds_frame, text="Seuil critique (MB/s):").pack(pady=2)
        critical_entry = ttk.Entry(thresholds_frame)
        critical_entry.insert(0, str(CONFIG['thresholds']['critical'] / 1000000))
        critical_entry.pack(pady=2)

        ttk.Label(thresholds_frame, text="Seuil d'avertissement (MB/s):").pack(pady=2)
        warning_entry = ttk.Entry(thresholds_frame)
        warning_entry.insert(0, str(CONFIG['thresholds']['warning'] / 1000000))
        warning_entry.pack(pady=2)

        # Onglet des notifications
        notif_frame = ttk.Frame(notebook)
        notebook.add(notif_frame, text="Notifications")

        email_var = tk.BooleanVar(value=CONFIG['notifications']['email']['enabled'])
        ttk.Checkbutton(
            notif_frame,
            text="Activer les notifications par email",
            variable=email_var
        ).pack(pady=2)

        telegram_var = tk.BooleanVar(value=CONFIG['notifications']['telegram']['enabled'])
        ttk.Checkbutton(
            notif_frame,
            text="Activer les notifications Telegram",
            variable=telegram_var
        ).pack(pady=2)

        # Onglet du pare-feu
        firewall_frame = ttk.Frame(notebook)
        notebook.add(firewall_frame, text="Pare-feu")

        auto_block_var = tk.BooleanVar(value=CONFIG['firewall']['auto_block'])
        ttk.Checkbutton(
            firewall_frame,
            text="Blocage automatique",
            variable=auto_block_var
        ).pack(pady=2)

        ttk.Label(firewall_frame, text="Durée du blocage (heures):").pack(pady=2)
        block_duration_entry = ttk.Entry(firewall_frame)
        block_duration_entry.insert(0, str(CONFIG['firewall']['block_duration'] / 3600))
        block_duration_entry.pack(pady=2)

        # Fonction de sauvegarde
        def save_config():
            try:
                # Mise à jour des seuils
                CONFIG['thresholds']['critical'] = float(critical_entry.get()) * 1000000
                CONFIG['thresholds']['warning'] = float(warning_entry.get()) * 1000000

                # Mise à jour des notifications
                CONFIG['notifications']['email']['enabled'] = email_var.get()
                CONFIG['notifications']['telegram']['enabled'] = telegram_var.get()

                # Mise à jour du pare-feu
                CONFIG['firewall']['auto_block'] = auto_block_var.get()
                CONFIG['firewall']['block_duration'] = float(block_duration_entry.get()) * 3600

                # Sauvegarde
                from config import save_config
                save_config(CONFIG)

                messagebox.showinfo(
                    "Succès",
                    "Configuration sauvegardée avec succès."
                )
                config_window.destroy()

            except ValueError as e:
                messagebox.showerror(
                    "Erreur",
                    "Veuillez entrer des valeurs numériques valides."
                )

        # Boutons
        button_frame = ttk.Frame(config_window)
        button_frame.pack(fill=tk.X, padx=5, pady=5)

        ttk.Button(
            button_frame,
            text="Sauvegarder",
            command=save_config
        ).pack(side=tk.RIGHT, padx=5)

        ttk.Button(
            button_frame,
            text="Annuler",
            command=config_window.destroy
        ).pack(side=tk.RIGHT, padx=5)

    def test_notifications(self):
        """Teste les notifications configurées."""
        results = self.notifications.test_notifications()

        message = "Résultats des tests:\n\n"
        for channel, success in results.items():
            status = "✅  Succès" if success else "❌  Échec"
            message += f"{channel}: {status}\n"

        messagebox.showinfo("Test des notifications", message)

    def run(self):
        """Lance l'application."""
        self.window.mainloop()

if __name__ == "__main__":
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("contre_attaque.log"),
            logging.StreamHandler()
        ]
    )

    # Démarrage de l'application
    app = AdvancedAntiDDoSGUI()
    app.run() 