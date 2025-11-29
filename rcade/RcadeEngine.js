import { Howl } from 'howler'
import p5 from 'p5'

import { RcadeInputAdapter } from './RcadeInputAdapter.js'
import { RcadeGameLoader } from './RcadeGameLoader.js'
import { RcadeUIManager } from './RcadeUIManager.js'

// Keep original miRCo canvas size (games have hardcoded positions)
// CSS will scale it down to fit the arcade display
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const DEFAULT_BUFFER_SIZE = 3
const GAME_DURATION = 5000 // 5sec

export class RcadeEngine {
  constructor(container, options = {}) {
    this.container = container
    this.options = options
    this.gameLoopStarted = false
    this.currentGame = null

    // managers (using RCade-specific versions)
    this.input = new RcadeInputAdapter()
    this.gameLoader = new RcadeGameLoader(DEFAULT_BUFFER_SIZE)
    this.ui = new RcadeUIManager(this.container, GAME_DURATION)

    this.libs = {
      sound: {
        play: (sound) => {
          if (sound instanceof Howl) {
            sound.play()
          }
        },
        stop: (sound) => {
          if (sound instanceof Howl) {
            sound.stop()
          }
        },
      },
      // p5 is added separately between each game to prevent muddying p5 state
    }

    this.mirco = {
      round: 0,
      wins: 0,
      losses: 0,
    }
  }

  async init() {
    if (this.options.round) {
      this.mirco.round = parseInt(this.options.round)
    }

    const allGameManifests = await this.gameLoader.loadGameManifests()
    this.ui.updateDirectory(allGameManifests)
  }

  triggerGameplayStart = () => {
    this.gameLoopStarted = true
    this.ui.hideSplash()
    this.playNext()
  }

  async playNext() {
    this.mirco.round++

    let next = this.gameLoader.getNextGame()

    if (!next) {
      console.error('Game buffer empty! Refilling...')
      await this.gameLoader.refillBuffer()
      next = this.gameLoader.getNextGame()
      if (!next) {
        console.error('Still no games after refill')
        return
      }
    }

    try {
      const { p5Instance, images } = await this.bootstrapP5(next.manifest)
      this.currentP5 = p5Instance // Store reference for cleanup

      // Initialize game
      this.currentGame = new next.module.default({
        input: this.input,
        mirco: this.mirco,
        assets: { ...next.assets, ...images },
        libs: { ...this.libs, p5: p5Instance },
      })

      // show instruction (timed) and author info
      this.ui.showGameInfo(next.manifest)

      this.currentGame.init(this.canvas)

      this.startGameLoop()

      // Automatically end game after time
      this.ui.gameTimer = setTimeout(() => {
        this.endGame(true) // win by default if time expires
      }, GAME_DURATION)
    } catch (err) {
      console.error(
        `Failed to play ${next.manifest?.name || 'game'}:`,
        err
      )
      // Clean up any partial p5 instance on error
      this.cleanupCurrentGame()
      this.ui.showErrorPlayingGame(next.manifest?.name || 'game')
      setTimeout(() => this.playNext(), 2000) // Skip to next game
    }
  }

  startGameLoop() {
    this.isRunning = true
    this.lastTime = performance.now()
    this.tick()
    this.ui.startTimer()
  }

  stopGameLoop() {
    this.isRunning = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  tick(currentTime = performance.now()) {
    if (!this.isRunning || !this.currentGame) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Update current game
    this.currentGame.update?.(deltaTime)
    this.input.postUpdate()

    // Schedule next frame
    this.frameId = requestAnimationFrame((time) => this.tick(time))
  }

  cleanupCurrentGame() {
    // Stop any running animation frame
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }

    // Clean up game assets
    if (this.currentGame?.assets) {
      Object.values(this.currentGame.assets).forEach((asset) => {
        if (asset instanceof Howl) {
          asset.unload()
        }
      })
    }

    // Remove p5 instance and canvas
    if (this.currentP5) {
      this.currentP5.remove()
      this.currentP5 = null
    }

    // Also remove any orphaned canvases from game wrapper
    const gameContainer = this.ui.getGameContainer()
    const canvases = gameContainer.querySelectorAll('canvas')
    canvases.forEach((c) => c.remove())

    this.currentGame = null
    this.canvas = null
  }

  endGame(won) {
    this.isRunning = false
    clearTimeout(this.ui.gameTimer)

    // Call end on current game if it exists
    if (this.currentGame) {
      won = this.currentGame.end?.() || false
      this.updateScore(won)
    }

    // Clean up
    this.cleanupCurrentGame()

    // reset timer
    this.ui.resetTimer()

    // Show interstitial, then start next game
    this.ui.showInterstitial(() => {
      this.playNext()
    })
  }

  updateScore(won) {
    if (won) {
      this.mirco.wins++
    } else {
      this.mirco.losses++
    }
    this.ui.updateScore(this.mirco)
  }

  async bootstrapP5(manifest) {
    // Get the game wrapper from UI manager (where canvas should go)
    const gameContainer = this.ui.getGameContainer()

    const theP5 = new p5((p) => {
      p.setup = () => {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
        this.canvas = canvas
        canvas.parent(gameContainer)
        p.noLoop() // game manager will control looping
      }
    }, gameContainer)

    const images = await this.gameLoader.loadImages(manifest, theP5)

    theP5.setup()

    return { p5Instance: theP5, images }
  }
}
