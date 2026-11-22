#!/bin/sh
cd "$(dirname "$0")"
echo "Jeu : http://localhost:8080/   |   Mobile (même Wi-Fi) : http://<IP-de-cet-ordinateur>:8080/"
(sleep 1; (command -v xdg-open >/dev/null && xdg-open http://localhost:8080/) || open http://localhost:8080/) >/dev/null 2>&1 &
python3 -m http.server 8080
