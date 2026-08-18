# HR Edge

Daily MLB home-run projections (xHR + park factors + weather).

Mobile-first Progressive Web App — add it to your home screen.

## Live on GitHub Pages

After you push this folder (or the whole `hr_model` repo) and enable Pages:

```
https://YOUR_USERNAME.github.io/REPO_NAME/
```

or if this `app/` folder is the root of the repo:

```
https://YOUR_USERNAME.github.io/hr-edge/
```

### Add to Home Screen
1. Open the GitHub Pages URL in **Safari** (iPhone) or **Chrome** (Android)
2. Share / Menu → **Add to Home Screen** / **Install app**
3. It opens fullscreen like a native app and works offline

## Deploy in 2 minutes

### Option A — New repo from the `app` folder (simplest)

```bash
cd hr_model/app
git init
git add .
git commit -m "HR Edge PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hr-edge.git
git push -u origin main
```

Then on GitHub:
1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / root
4. Save → wait ~30–60 seconds
5. Open the URL it gives you

### Option B — Keep it inside your existing `hr_model` or sports repo

Put the contents of `app/` in a `/docs` folder or `/hr-edge` folder and set Pages to that folder, or use a GitHub Action.

## Updating the board each day

1. Run the model pipeline on your machine:
   ```bash
   python3 fetch_data.py YYYY-MM-DD
   python3 fetch_extra.py
   python3 fetch_statcast.py
   python3 fetch_weather.py YYYY-MM-DD
   python3 hr_model.py YYYY-MM-DD
   ```
2. Refresh `app/data.json`:
   ```bash
   python3 -c "
   import pandas as pd, json
   from pathlib import Path
   date = 'YYYY-MM-DD'
   s = pd.read_csv(f'data/hr_slate_{date}.csv')
   top = s.head(40).fillna('').to_dict(orient='records')
   wx = pd.read_csv(f'data/weather_{date}.csv').fillna('').to_dict(orient='records')
   Path('app/data.json').write_text(json.dumps({'date': date, 'slate': top, 'weather': wx}, indent=2))
   print('data.json updated')
   "
   ```
3. Commit & push — GitHub Pages updates automatically.

## Stack
- Static HTML / CSS / JS (no build step)
- PWA: manifest + service worker
- Data: MLB Stats API · Baseball Savant · Open-Meteo
