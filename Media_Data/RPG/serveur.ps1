# Petit serveur local (utilisé par Lancer.bat si Python n'est pas installé)
$root=$PSScriptRoot;$l=New-Object Net.HttpListener;$l.Prefixes.Add("http://localhost:8080/");$l.Start()
Start-Process "http://localhost:8080/";Write-Host "Jeu lancé sur http://localhost:8080/  (fermez cette fenêtre pour arrêter)"
$mime=@{".html"="text/html";".js"="text/javascript";".css"="text/css";".json"="application/json";".png"="image/png";".ogg"="audio/ogg";".ttf"="font/ttf";".txt"="text/plain"}
while($l.IsListening){$c=$l.GetContext();$p=[Uri]::UnescapeDataString($c.Request.Url.AbsolutePath);if($p -eq "/"){$p="/index.html"}
 $f=Join-Path $root ($p.TrimStart("/").Replace("/","\"))
 if((Test-Path $f -PathType Leaf) -and $f.StartsWith($root)){$b=[IO.File]::ReadAllBytes($f);$e=[IO.Path]::GetExtension($f).ToLower()
  if($mime[$e]){$c.Response.ContentType=$mime[$e]};$c.Response.OutputStream.Write($b,0,$b.Length)}else{$c.Response.StatusCode=404}
 $c.Response.Close()}
