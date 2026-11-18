@echo off
rem Met le site en ligne : tests, puis envoi sur GitHub (Netlify recompile tout seul).
cd /d "%~dp0"
echo.
echo === 1/3 Tests ===
call npm test
if errorlevel 1 (
  echo.
  echo Les tests ont echoue : rien n'a ete envoye.
  pause
  exit /b 1
)
echo.
echo === 2/3 Enregistrement des changements ===
git add .
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Mise a jour du site"
) else (
  echo Aucun changement a enregistrer.
)
echo.
echo === 3/3 Envoi sur GitHub ===
git push
if errorlevel 1 (
  echo.
  echo L'envoi a echoue : copie le message ci-dessus a Claude.
  pause
  exit /b 1
)
echo.
echo C'est envoye. Netlify va recompiler le site : attends "Published" dans Deploys.
pause
