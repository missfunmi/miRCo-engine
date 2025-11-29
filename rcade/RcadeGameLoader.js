import { Howl } from 'howler'
import { games } from './games-bundle.js'

export class RcadeGameLoader {
  constructor(bufferSize = 3) {
    this.BUFFER_SIZE = bufferSize
    this.allGames = [...games]
    this.queue = this.shuffle([...games])
    this.buffer = []
  }

  async loadGameManifests() {
    await this.refillBuffer()
    return this.allGames.map((g) => g.manifest)
  }

  async refillBuffer() {
    while (this.buffer.length < this.BUFFER_SIZE && this.queue.length > 0) {
      const game = this.queue.shift()
      try {
        const assets = await this.preloadAssets(game.manifest)
        this.buffer.push({ ...game, assets })
      } catch (err) {
        console.error(`Failed to load ${game.manifest.name}:`, err)
      }
    }
    if (this.queue.length === 0) {
      this.queue = this.shuffle([...this.allGames])
    }
  }

  getNextGame() {
    const next = this.buffer.shift()
    this.refillBuffer().catch((err) =>
      console.error('Failed to refill buffer:', err)
    )
    return next
  }

  async preloadAssets(manifest) {
    const assets = {}
    // Use _folderName for asset paths (manifest.name may differ from folder)
    const folderName = manifest._folderName || manifest.name
    const basePath = `/${folderName}/assets/`

    for (const conf of manifest.assets || []) {
      const { filename, options } = this.assetConf(conf)
      if (!filename) continue

      if (filename.endsWith('.mp3') || filename.endsWith('.wav')) {
        assets[filename] = await this.loadAudio(basePath + filename, options)
      }
    }

    return assets
  }

  async loadImages(manifest, p5) {
    const result = {}
    // Use _folderName for asset paths (manifest.name may differ from folder)
    const folderName = manifest._folderName || manifest.name
    const basePath = `/${folderName}/assets/`

    for (const conf of manifest.assets || []) {
      const { filename } = this.assetConf(conf)

      if (!filename) {
        console.warn(`Unable to load asset for game ${manifest.name}`, conf)
        continue
      }

      if (filename.endsWith('.png') || filename.endsWith('.jpg')) {
        const img = new Image()
        img.src = basePath + filename
        await img.decode()
        result[filename] = await new Promise((resolve) => {
          p5.loadImage(basePath + filename, (img) => {
            resolve(img)
          })
        })
      }
    }
    return result
  }

  async loadAudio(path, options = {}) {
    const sound = new Howl({
      src: [path],
      preload: true,
      ...options,
    })

    return new Promise((resolve, reject) => {
      sound.once('load', () => resolve(sound))
      sound.once('loaderror', reject)
    })
  }

  assetConf(conf) {
    let filename, options

    if (typeof conf === 'string') {
      filename = conf
      options = {}
    } else {
      const { file, ...rest } = conf
      filename = file
      options = rest
    }

    return { filename, options }
  }

  shuffle(arr) {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
