GASMOBIL OFFICIAL BRAND ASSET PACK
===================================

These assets are derived from the supplied GasMobil Uganda green-glow logo.
The blue/cyan outer flame, yellow/orange inner flame, white "Gas" and "Uganda",
blue/cyan "Mobil", and orange underline are preserved.

Included in BOTH Expo applications:
  apps/mobile/assets/
  apps/driver-app/assets/

Files:
  gasmobil-icon.png  - square app icon with the full GasMobil Uganda lockup
  adaptive-icon.png - transparent flame foreground for Android adaptive icon
  splash.png         - portrait splash artwork

Apply from the repository root:
  unzip -o GasMobil-Official-Brand-Pack.zip -d .

Then check:
  git status
  git add apps/mobile/assets apps/driver-app/assets
  git commit -m "chore: apply official GasMobil green-glow brand assets"
  git push

The Expo configs already reference these filenames. Rebuild both Android apps
after applying these files; changing image files alone does not replace the
icon/splash inside an already-installed native binary.
