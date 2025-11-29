import './style.css'
import { RcadeEngine } from './RcadeEngine.js'
import { SYSTEM } from '@rcade/plugin-input-classic'

const container = document.querySelector('#app')

// Show start screen
container.innerHTML = `
  <div class="start-screen">
    <h1>miRCo</h1>
    <p>Press 1P START</p>
  </div>
`

let engine = null
let started = false

// Wait for 1P START button
function waitForStart() {
  if (!started && SYSTEM.ONE_PLAYER) {
    started = true
    // Clear start screen
    container.innerHTML = ''
    // Create engine AFTER clearing (so game wrapper doesn't get destroyed)
    engine = new RcadeEngine(container)
    engine.init().then(() => {
      engine.triggerGameplayStart()
    })
  } else {
    requestAnimationFrame(waitForStart)
  }
}

waitForStart()
