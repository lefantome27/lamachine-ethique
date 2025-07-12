# =========================
# La Machine - main_commente.py
# Version commentée pour présentation (pédagogique + technique)
# =========================

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# --- IMPORTS PRINCIPAUX ---
# On importe les modules standards Python et les modules du projet.
# Cela permet de gérer l'interface graphique, le réseau, la sécurité, l'analyse, etc.
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

# Import des modules internes (architecture modulaire)
from config import CONFIG, VERSION  # Configuration centralisée et version du logiciel
from firewall import FirewallManager  # Gestion du pare-feu
from notifications import NotificationManager  # Gestion des notifications (alertes, logs)
from analysis import TrafficAnalyzer  # Analyse du trafic réseau (détection d'anomalies)
from network_monitor import NetworkMonitor  # Surveillance réseau (interfaces, IP, trafic)

# =========================
# CLASSE PRINCIPALE DE L'INTERFACE ANTI-DDOS
# =========================
class AdvancedAntiDDoSGUI:
    def __init__(self):
        # Initialisation des gestionnaires et de l'interface
        self.setup_managers()  # Prépare les modules de sécurité, analyse, notifications...
        self.setup_window()    # Prépare la fenêtre principale (Tkinter)
        self.setup_styles()    # Applique les styles graphiques
        self.create_widgets()  # Crée tous les éléments de l'interface
        self.setup_graphs()    # Prépare les graphiques de suivi
        self.start_updates()   # Lance la mise à jour en temps réel

    def setup_managers(self):
        """Initialise les différents gestionnaires."""
        # Ces objets sont le cœur de la logique métier :
        self.network_monitor = NetworkMonitor()  # Surveillance réseau (trafic, IP, interfaces)
        self.firewall = FirewallManager()        # Gestion dynamique du pare-feu
        self.notifications = NotificationManager()  # Alertes, logs, notifications utilisateur
        self.analyzer = TrafficAnalyzer()        # Analyse du trafic pour détecter les attaques

        # États internes
        self.is_monitoring = False
        self.traffic_history = []  # Historique du trafic pour les graphes
        self.alert_history = []    # Historique des alertes

    def setup_window(self):
        """Configure la fenêtre principale."""
        self.window = tk.Tk()
        self.window.title(f"Contre Attaque Pro - Anti-DDoS v{VERSION}")
        self.window.geometry("1200x800")
        self.window.minsize(1000, 600)

        # Choix du thème (clair/sombre) selon la config utilisateur
        if CONFIG['interface']['theme'] == 'dark':
            self.setup_dark_theme()
        else:
            self.setup_light_theme()

    def setup_styles(self):
        """Configure les styles de l'interface."""
        style = ttk.Style()
        # Styles pour les différents niveaux d'alerte
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
        # L'interface est divisée en deux panneaux principaux (gauche : infos/contrôles, droite : graphes)
        self.main_container = ttk.PanedWindow(self.window, orient=tk.HORIZONTAL)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Panneau de gauche (contrôles et informations)
        self.left_panel = ttk.Frame(self.main_container)
        self.main_container.add(self.left_panel, weight=1)

        # Panneau de droite (graphiques et analyses)
        self.right_panel = ttk.Frame(self.main_container)
        self.main_container.add(self.right_panel, weight=2)

        self.create_info_panel()      # Affiche les infos réseau/IP
        self.create_control_panel()   # Boutons de contrôle (start/stop/config)
        self.create_status_panel()    # Statut système et trafic
        self.create_blocked_ips_panel() # Liste des IP bloquées
        self.create_analysis_panel()  # Zone d'analyse avancée

    # ...
    # (Le reste du code continue avec le même principe :
    # chaque fonction/fichier/module est commenté pour expliquer son rôle,
    # la logique métier, et pourquoi il est associé à d'autres modules.)
    # ...

    # ...
    # (Le reste du code continue avec le même principe :
    # chaque fonction/fichier/module est commenté pour expliquer son rôle,
    # la logique métier, et pourquoi il est associé à d'autres modules.)
    # ... 