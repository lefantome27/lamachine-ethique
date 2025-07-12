#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import logging
import sqlite3
import time
from datetime import datetime, timedelta
from config import CONFIG, BLOCKED_IPS_DB

class FirewallManager:
    def __init__(self):
        self.setup_database()
        self.cleanup_expired_rules()

    def setup_database(self):
        """Initialise la base de données des IPs bloquées."""
        try:
            with sqlite3.connect(BLOCKED_IPS_DB) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS blocked_ips (
                        ip TEXT PRIMARY KEY,
                        blocked_at TIMESTAMP,
                        expires_at TIMESTAMP,
                        reason TEXT
                    )
                ''')
                conn.commit()
        except Exception as e:
            logging.error(f"Erreur lors de l'initialisation de la base de données: {e}")

    def is_ip_blocked(self, ip):
        """Vérifie si une IP est bloquée."""
        try:
            with sqlite3.connect(BLOCKED_IPS_DB) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT expires_at FROM blocked_ips WHERE ip = ? AND expires_at > ?",
                    (ip, datetime.now())
                )
                return cursor.fetchone() is not None
        except Exception as e:
            logging.error(f"Erreur lors de la vérification de l'IP {ip}: {e}")
            return False

    def block_ip(self, ip, reason="Trafic suspect"):
        """Bloque une IP via iptables."""
        if ip in CONFIG['firewall']['whitelist']:
            logging.warning(f"Tentative de blocage d'une IP en liste blanche: {ip}")
            return False

        if self.is_ip_blocked(ip):
            return True

        try:
            # Ajouter la règle iptables
            subprocess.run(
                ["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"],
                check=True
            )

            # Enregistrer dans la base de données
            blocked_at = datetime.now()
            expires_at = blocked_at + timedelta(seconds=CONFIG['firewall']['block_duration'])

            with sqlite3.connect(BLOCKED_IPS_DB) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT OR REPLACE INTO blocked_ips (ip, blocked_at, expires_at, reason) VALUES (?, ?, ?, ?)",
                    (ip, blocked_at, expires_at, reason)
                )
                conn.commit()

            logging.info(f"IP bloquée avec succès: {ip}")
            return True

        except Exception as e:
            logging.error(f"Erreur lors du blocage de l'IP {ip}: {e}")
            return False

    def unblock_ip(self, ip):
        """Débloque une IP."""
        try:
            # Supprimer la règle iptables
            subprocess.run(
                ["sudo", "iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"],
                check=True
            )

            # Supprimer de la base de données
            with sqlite3.connect(BLOCKED_IPS_DB) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM blocked_ips WHERE ip = ?", (ip,))
                conn.commit()

            logging.info(f"IP débloquée avec succès: {ip}")
            return True

        except Exception as e:
            logging.error(f"Erreur lors du déblocage de l'IP {ip}: {e}")
            return False

    def cleanup_expired_rules(self):
        """Nettoie les règles expirées."""
        try:
            with sqlite3.connect(BLOCKED_IPS_DB) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT ip FROM blocked_ips WHERE expires_at <= ?",
                    (datetime.now(),)
                )
                expired_ips = [row[0] for row in cursor.fetchall()]

            for ip in expired_ips:
                self.unblock_ip(ip)

        except Exception as e:
            logging.error(f"Erreur lors du nettoyage des règles expirées: {e}")

    def get_blocked_ips(self):
        """Retourne la liste des IPs bloquées avec leurs informations."""
        try:
            with sqlite3.connect(BLOCKED_IPS_DB) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT ip, blocked_at, expires_at, reason FROM blocked_ips WHERE expires_at > ?",
                    (datetime.now(),)
                )
                return cursor.fetchall()
        except Exception as e:
            logging.error(f"Erreur lors de la récupération des IPs bloquées: {e}")
            return []

    def save_rules(self):
        """Sauvegarde les règles iptables."""
        try:
            subprocess.run(
                ["sudo", "iptables-save", ">", "/etc/iptables/rules.v4"],
                shell=True,
                check=True
            )
            logging.info("Règles iptables sauvegardées avec succès")
            return True
        except Exception as e:
            logging.error(f"Erreur lors de la sauvegarde des règles iptables: {e}")
            return False

    def load_rules(self):
        """Charge les règles iptables sauvegardées."""
        try:
            subprocess.run(
                ["sudo", "iptables-restore", "<", "/etc/iptables/rules.v4"],
                shell=True,
                check=True
            )
            logging.info("Règles iptables restaurées avec succès")
            return True
        except Exception as e:
            logging.error(f"Erreur lors de la restauration des règles iptables: {e}")
            return False 