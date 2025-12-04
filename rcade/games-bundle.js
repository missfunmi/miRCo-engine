// Dynamically import all games using Vite's glob import
// This automatically discovers all games at build time

const gameModules = import.meta.glob('../games/*/index.js', { eager: true })
const gameManifests = import.meta.glob('../games/*/manifest.json', { eager: true })

// Build games array by matching modules with their manifests
export const games = Object.entries(gameModules)
  .map(([path, module]) => {
    // Extract folder name from path: ../games/arrows/index.js -> arrows
    const folderName = path.split('/')[2]
    const manifestPath = `../games/${folderName}/manifest.json`
    const manifestData = gameManifests[manifestPath]?.default || gameManifests[manifestPath]

    // Use folder name for asset paths (manifest.name may differ from folder name)
    const manifest = {
      ...manifestData,
      _folderName: folderName, // Store folder name for asset loading
    } || { name: folderName, _folderName: folderName, assets: [], instruction: 'Play!' }

    return {
      module: { default: module.default },
      manifest,
    }
  })
  .filter(game => game.manifest.rcade !== false)

console.log(`Loaded ${games.length} games via glob import`)
