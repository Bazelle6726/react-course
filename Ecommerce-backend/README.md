## Intro to the Project
This is the backend for the [ecommerce-project](https://github.com/SuperSimpleDev/ecommerce-project).
- 95% of the code was generated with AI.

## Video Tutorials
**Part 1 - Create the Backend:** https://youtu.be/vBprybSmJs8

## Set up this backend
1. Make sure you have NodeJS installed (version 22+). If not, [click here to install](https://nodejs.org/).
2. Download this code by clicking the green `Code` button (in the top-right) > Click `Download Zip`.
3. Unzip the code. On Windows, right-click the zip file > `Extract All`. On Mac, double-click the zip file.
4. Open this code in VSCode.
5. At the top menu of VSCode, click `Terminal` > `New Terminal`.
6. In the Terminal, run `npm install`, and run `npm run dev`.

The backend runs on port 3000. To use another port, set `PORT` first: in
PowerShell, `$env:PORT = 3100; npm start`; in Git Bash or macOS/Linux,
`PORT=3100 npm start`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the backend, restarting it when the code changes |
| `npm start` | Starts the backend |
| `npm run reset-db` | Puts the products, cart and orders back to the default data |
| `npm run zip` | Makes a zip of the backend (without `node_modules` or the database) |

## Where the data is kept
Everything is saved in `database.sqlite`, in the folder the backend is started
from. If that file doesn't exist, the backend creates it with the default
products, cart and orders (from `defaultData/`).

`npm run reset-db` resets the data. If the backend is running, it asks it to
reset (the same as sending `POST /api/reset`). If it isn't running, it deletes
`database.sqlite`, so the next start begins with the default data.

The e-commerce app's browser tests start their own copy of this backend in a
different folder and port, so they never change this `database.sqlite`.

## API
See [documentation.md](documentation.md) for every endpoint.

## Troubleshooting
If you run into issues, see the [troubleshooting steps](troubleshooting.md).
