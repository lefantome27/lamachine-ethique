import tkinter as tk
from tkinter import messagebox
import csv
import os
import subprocess
from datetime import datetime
import ttkbootstrap as tb
from ttkbootstrap.constants import *

CARNET_PATH = 'carnet_ips.csv'

class CarnetIPApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Carnet d'IPs - Outil Réseau Moderne")
        self.root.geometry("700x450")
        self.root.minsize(600, 350)
        self.root.eval('tk::PlaceWindow . center')
        self.style = tb.Style("darkly")
        self.create_widgets()
        self.load_ips()

    def create_widgets(self):
        # Bandeau titre
        title = tb.Label(self.root, text="Carnet d'IPs", font=("Segoe UI", 22, "bold"), bootstyle=PRIMARY, anchor="center")
        title.pack(fill=X, pady=(10, 5))

        # Tableau
        self.tree = tb.Treeview(self.root, columns=("ip", "nom_pc", "lieu", "operateur", "etat"), show="headings", bootstyle=INFO)
        for col, width in zip(("ip", "nom_pc", "lieu", "operateur", "etat"), (130, 120, 120, 120, 90)):
            self.tree.heading(col, text=col.upper())
            self.tree.column(col, width=width, anchor="center")
        self.tree.pack(fill=BOTH, expand=True, padx=15, pady=10)

        # Boutons stylés
        btn_frame = tb.Frame(self.root)
        btn_frame.pack(pady=5)
        tb.Button(btn_frame, text="Vérifier Disponibilité", bootstyle=SUCCESS, command=self.ping_all, width=20).pack(side=LEFT, padx=6)
        tb.Button(btn_frame, text="Bloquer IP sélectionnée", bootstyle=DANGER, command=self.bloquer_ip, width=20).pack(side=LEFT, padx=6)
        tb.Button(btn_frame, text="Générer Rapport", bootstyle=INFO, command=self.generer_rapport, width=20).pack(side=LEFT, padx=6)
        tb.Button(btn_frame, text="Rafraîchir", bootstyle=SECONDARY, command=self.load_ips, width=15).pack(side=LEFT, padx=6)

    def load_ips(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        try:
            with open(CARNET_PATH, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    self.tree.insert('', tk.END, values=(row['ip'], row['nom_pc'], row['lieu'], row['operateur'], "?"))
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de lire {CARNET_PATH} : {e}")

    def ping_all(self):
        for item in self.tree.get_children():
            ip = self.tree.item(item)['values'][0]
            response = os.system(f"ping -n 1 -w 1000 {ip} >nul")
            etat = "EN LIGNE" if response == 0 else "HORS LIGNE"
            color = "#27ae60" if etat == "EN LIGNE" else "#e74c3c"
            vals = list(self.tree.item(item)['values'])
            vals[4] = etat
            self.tree.item(item, values=vals, tags=(etat,))
            self.tree.tag_configure("EN LIGNE", background="#232a2f", foreground="#27ae60", font=("Segoe UI", 10, "bold"))
            self.tree.tag_configure("HORS LIGNE", background="#232a2f", foreground="#e74c3c", font=("Segoe UI", 10, "bold"))

    def bloquer_ip(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("Info", "Sélectionne une IP à bloquer.")
            return
        ip, nom_pc, *_ = self.tree.item(selected[0])['values']
        rule_name = f"Blocage IP {nom_pc}"
        cmd = [
            'powershell',
            '-Command',
            f'New-NetFirewallRule -DisplayName "{rule_name}" -Direction Inbound -RemoteAddress {ip} -Action Block -Profile Any -Enabled True'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            messagebox.showinfo("Succès", f"Règle de blocage ajoutée pour {ip}.")
        else:
            messagebox.showerror("Erreur", f"Erreur lors de l'ajout de la règle : {result.stderr}")

    def generer_rapport(self):
        now = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        rapport_path = f"rapport_etat_{now}.txt"
        with open(rapport_path, 'w', encoding='utf-8') as report:
            report.write(f"Rapport d'état du réseau - {datetime.now()}\n\n")
            for item in self.tree.get_children():
                vals = self.tree.item(item)['values']
                report.write(f"{vals[0]} ({vals[1]}, {vals[2]}, {vals[3]}) : {vals[4]}\n")
        messagebox.showinfo("Rapport généré", f"Rapport enregistré sous {rapport_path}")

if __name__ == "__main__":
    root = tb.Window(themename="darkly")
    app = CarnetIPApp(root)
    root.mainloop() 