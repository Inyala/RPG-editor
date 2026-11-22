#!/usr/bin/env python3
"""Régénère (1) Media_Data/RPG/Script/data.js : données du jeu embarquées, pour jouer SANS serveur (double-clic / mobile)
         (2) Media_Data/manifest.json : liste des fichiers du jeu, lue par l'éditeur au démarrage.
À relancer après avoir ajouté / supprimé / renommé des fichiers dans Media_Data/RPG/.
Usage : python3 make_manifest.py"""
import os, json
here = os.path.dirname(os.path.abspath(__file__))
md = os.path.join(here, 'Media_Data'); sub = 'RPG'
root = os.path.join(md, sub)
# data.js : Data/*.json + cartes déclarées dans system.json
def rd(p): return json.load(open(os.path.join(root, p), encoding='utf-8'))
D = {'Data/system.json': rd('Data/system.json')}
for k in ['actors', 'items', 'skills', 'enemies', 'troops', 'quests', 'precepts']:
    if os.path.exists(os.path.join(root, 'Data/%s.json' % k)): D['Data/%s.json' % k] = rd('Data/%s.json' % k)
for i in D['Data/system.json']['maps']: D['Map/%s.json' % i] = rd('Map/%s.json' % i)
open(os.path.join(root, 'Script', 'data.js'), 'w', encoding='utf-8').write("/* Généré automatiquement (éditeur / make_manifest.py) : données du jeu pour l'ouverture sans serveur. Ne pas modifier. */\nwindow.RPG_DATA=" + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ";\n")
files = sorted(os.path.relpath(os.path.join(d, f), root).replace(os.sep, '/')
               for d, ds, fs in os.walk(root) for f in fs if f != '.DS_Store')
json.dump({'base': sub + '/', 'files': files}, open(os.path.join(md, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(files), 'fichiers -> Media_Data/manifest.json')
