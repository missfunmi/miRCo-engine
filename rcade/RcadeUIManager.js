import recurseSvg from './recurse.svg'

const DEFAULT_AUTHOR_NAME = 'Someone'
const INTERSTITIAL_DURATION = 1000 // 1 second between games

export class RcadeUIManager {
  constructor(container, gameDuration = 5000) {
    this.container = container
    this.GAME_DURATION = gameDuration
    this.gameTimer = null
    this.showingInstruction = false
    this.DEFAULT_INSTRUCTION = 'Ready?'

    this.buildOverlays()
  }

  buildOverlays() {
    // Create game wrapper - this gets zoomed to fit arcade display
    this.gameWrapper = document.createElement('div')
    this.gameWrapper.className = 'game-wrapper'
    this.container.appendChild(this.gameWrapper)

    // INTERSTITIAL - shown between games
    this.interstitialOverlay = this.createOverlay(
      'interstitial-overlay',
      `
        <div class="interstitial-content">
          <img src="${recurseSvg}" class="interstitial-logo" alt="Recurse Center" />
        </div>
      `,
      this.gameWrapper
    )
    this.interstitialOverlay.style.display = 'none'

    // SPLASH (hidden by default on RCade)
    this.splashOverlay = this.createOverlay('start-splash-overlay', '', this.gameWrapper)
    this.splashOverlay.style.display = 'none'

    // SCOREBOARD - at top
    this.scoreOverlay = this.createOverlay(
      'score-overlay',
      `
        <span class="round">Round: 0</span>
        <span class="wins">Wins: 0</span>
        <span class="losses">Losses: 0</span>
      `,
      this.gameWrapper
    )

    // GAME INFO
    this.instructionOverlay = this.createOverlay('instruction-overlay', '', this.gameWrapper)
    this.authorOverlay = this.createOverlay('author-overlay', '', this.gameWrapper)

    // TIMER - at bottom
    this.timerOverlay = document.createElement('div')
    this.timerOverlay.className = 'timer-overlay'
    this.timerProgress = document.createElement('div')
    this.timerProgress.className = 'timer-progress'
    this.timerOverlay.appendChild(this.timerProgress)
    this.gameWrapper.appendChild(this.timerOverlay)
  }

  showInterstitial(callback) {
    const logo = this.interstitialOverlay.querySelector('.interstitial-logo')

    // Pick a random animation
    const animations = [
      'spin',
      'spin-reverse',
      'zoom-in',
      'spin-3d',
      'wobble',
      'pulse-spin'
    ]
    const randomAnim = animations[Math.floor(Math.random() * animations.length)]

    // Random starting rotation
    const randomRotation = Math.floor(Math.random() * 360)
    logo.style.setProperty('--start-rotation', `${randomRotation}deg`)

    // Apply animation
    logo.className = `interstitial-logo anim-${randomAnim}`

    this.interstitialOverlay.style.display = 'flex'

    setTimeout(() => {
      this.interstitialOverlay.style.display = 'none'
      logo.className = 'interstitial-logo'
      if (callback) callback()
    }, INTERSTITIAL_DURATION)
  }

  // Returns the game wrapper so canvas gets added inside it
  getGameContainer() {
    return this.gameWrapper
  }

  createOverlay(className, innerHTML = '', parent = null) {
    const overlay = document.createElement('div')
    overlay.className = className
    overlay.innerHTML = innerHTML
    ;(parent || this.container).appendChild(overlay)
    return overlay
  }

  showSplash() {
    this.splashOverlay.style.display = 'flex'
  }

  hideSplash() {
    this.splashOverlay.style.display = 'none'
  }

  showErrorPlayingGame(gameName = 'game') {
    const error = this.createOverlay(
      'error-splash-overlay',
      `<div class="error-splash-content"><h2>Error: ${gameName}<br>Skipping...</h2></div>`,
      this.gameWrapper
    )
    setTimeout(() => error.remove(), 2000)
  }

  showGameInfo(manifest) {
    this.showInstruction(manifest?.instruction || this.DEFAULT_INSTRUCTION)
    this.authorOverlay.innerHTML = this.buildAuthorInfoHTML(manifest)
  }

  showInstruction(instruction, duration = 500) {
    this.showingInstruction = true
    this.instructionOverlay.textContent = instruction
    this.instructionOverlay.classList.add('visible')

    setTimeout(() => {
      this.hideInstruction()
    }, duration)
  }

  hideInstruction() {
    this.showingInstruction = false
    this.instructionOverlay.classList.remove('visible')
  }

  updateDirectory(allGameManifests) {
    console.log(`Loaded ${allGameManifests.length} games`)
  }

  updateScore(mirco) {
    this.scoreOverlay.querySelector('.round').textContent =
      `Round: ${mirco.round}`
    this.scoreOverlay.querySelector('.wins').textContent = `Wins: ${mirco.wins}`
    this.scoreOverlay.querySelector('.losses').textContent =
      `Losses: ${mirco.losses}`
  }

  startTimer() {
    this.resetTimer()

    // Force reflow to ensure transition reset takes effect
    this.timerProgress.offsetHeight

    // Start timer animation
    this.timerProgress.style.transition = `width ${this.GAME_DURATION}ms linear`
    this.timerProgress.style.width = '0%'
  }

  resetTimer() {
    clearTimeout(this.gameTimer)
    this.gameTimer = null
    this.timerProgress.style.transition = 'none'
    this.timerProgress.style.width = '100%'
  }

  buildAuthorInfoHTML(manifest) {
    if (!manifest) {
      return `game by ${DEFAULT_AUTHOR_NAME}`
    }
    return `${manifest?.name} by ${manifest?.author || DEFAULT_AUTHOR_NAME}`
  }
}
