export default class MicroGame {
  constructor({ input, assets, libs, mirco }) {
    this.input = input
    this.assets = assets
    this.libs = libs
    this.mirco = mirco

    this.state = {
      gameOver: false,
      won: false,
      maze: [],
      cellSize: 40,
      rows: 0,
      cols: 0,
      margin: 60,
      playerPosition: { x: 0, y: 0 },
      endPosition: { x: 0, y: 0 },
      visitedCells: new Set(),
      autoMoving: false,
      autoMovePath: [],
      glitch: { intensity: 0, colorPhase: 0, playerTrail: [] },
      resurrection: {
        active: false,
        phase: 0,
        startTime: 0,
        playerEmoji: '🐙',
        shakeAmount: 0,
        flashCount: 0,
      },
      helpMessage: { show: false, startTime: 0 },
    }
  }

  allArrowsPressed() {
    return (
      this.input.isPressedUp() &&
      this.input.isPressedDown() &&
      this.input.isPressedLeft() &&
      this.input.isPressedRight()
    )
  }

  handleInput() {
    const p5 = this.libs.p5

    // Handle just pressed keys for movement
    if (!this.state.autoMoving) {
      if (this.input.justPressedUp()) {
        if (this.allArrowsPressed() && !this.state.resurrection.active) {
          this.startAutoMove()
        } else {
          this.handleMove('ArrowUp')
        }
      }
      if (this.input.justPressedDown()) {
        if (this.allArrowsPressed() && !this.state.resurrection.active) {
          this.startAutoMove()
        } else {
          this.handleMove('ArrowDown')
        }
      }
      if (this.input.justPressedLeft()) {
        if (this.allArrowsPressed() && !this.state.resurrection.active) {
          this.startAutoMove()
        } else {
          this.handleMove('ArrowLeft')
        }
      }
      if (this.input.justPressedRight()) {
        if (this.allArrowsPressed() && !this.state.resurrection.active) {
          this.startAutoMove()
        } else {
          this.handleMove('ArrowRight')
        }
      }
    }

    // Handle key releases to stop auto-moving
    if (this.state.autoMoving) {
      if (
        this.input.releasedUp() ||
        this.input.releasedDown() ||
        this.input.releasedLeft() ||
        this.input.releasedRight()
      ) {
        this.state.autoMoving = false
        this.state.autoMovePath = []
        this.state.glitch.intensity = 0
        if (!this.state.resurrection.active) {
          this.state.helpMessage.show = false
          this.state.helpMessage.startTime = p5.millis()
        }
      }
    }
  }

  init(canvas) {
    const margin = this.state.margin
    const cellSize = this.state.cellSize
    const rows = Math.floor((canvas.height - 2 * margin) / cellSize)
    const cols = Math.floor((canvas.width - 2 * margin) / cellSize)

    this.state = {
      ...this.state,
      maze: this.generateMaze(rows, cols),
      rows,
      cols,
      playerPosition: { x: 0, y: 0 },
      endPosition: { x: cols - 1, y: rows - 1 },
      visitedCells: new Set(['0,0']),
      autoMoving: false,
      autoMovePath: [],
      gameOver: false,
      won: false,
      helpMessage: { show: false, startTime: this.libs.p5.millis() },
    }
  }

  generateMaze(rows, cols) {
    let maze = Array(rows)
      .fill()
      .map(() =>
        Array(cols)
          .fill()
          .map(() => ({
            top: true,
            right: true,
            bottom: true,
            left: true,
            visited: false,
          }))
      )

    const dfs = (r, c) => {
      maze[r][c].visited = true
      const directions = [
        { dr: -1, dc: 0, wall: 'top', oppositeWall: 'bottom' },
        { dr: 0, dc: 1, wall: 'right', oppositeWall: 'left' },
        { dr: 1, dc: 0, wall: 'bottom', oppositeWall: 'top' },
        { dr: 0, dc: -1, wall: 'left', oppositeWall: 'right' },
      ]

      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[directions[i], directions[j]] = [directions[j], directions[i]]
      }

      for (const dir of directions) {
        const newR = r + dir.dr
        const newC = c + dir.dc
        if (
          newR >= 0 &&
          newR < rows &&
          newC >= 0 &&
          newC < cols &&
          !maze[newR][newC].visited
        ) {
          maze[r][c][dir.wall] = false
          maze[newR][newC][dir.oppositeWall] = false
          dfs(newR, newC)
        }
      }
    }

    dfs(0, 0)

    return maze
  }

  handleMove(key) {
    if (this.state.gameOver || this.state.resurrection.active) return

    const pos = this.state.playerPosition
    const maze = this.state.maze

    let moved = false
    let newPos = { ...pos }

    if (key === 'ArrowUp' && pos.y > 0 && !maze[pos.y][pos.x].top) {
      newPos.y--
      moved = true
    } else if (
      key === 'ArrowDown' &&
      pos.y < this.state.rows - 1 &&
      !maze[pos.y][pos.x].bottom
    ) {
      newPos.y++
      moved = true
    } else if (key === 'ArrowLeft' && pos.x > 0 && !maze[pos.y][pos.x].left) {
      newPos.x--
      moved = true
    } else if (
      key === 'ArrowRight' &&
      pos.x < this.state.cols - 1 &&
      !maze[pos.y][pos.x].right
    ) {
      newPos.x++
      moved = true
    }

    if (moved) {
      this.state.playerPosition = newPos
      this.trackMovement(newPos)
    }
  }

  trackMovement(position) {
    const trail = this.state.glitch.playerTrail
    trail.push({ ...position, age: 0 })
    if (trail.length > 20) trail.shift()

    this.state.visitedCells.add(`${position.x},${position.y}`)

    if (
      position.x === this.state.endPosition.x &&
      position.y === this.state.endPosition.y
    ) {
      this.startResurrection()
      this.state.gameOver = true
      this.state.won = true
    }
  }

  findPath() {
    const maze = this.state.maze
    const rows = this.state.rows
    const cols = this.state.cols
    const start = this.state.playerPosition
    const end = this.state.endPosition

    let queue = [start]
    let visited = Array(rows)
      .fill()
      .map(() => Array(cols).fill(false))
    let prev = Array(rows)
      .fill()
      .map(() => Array(cols).fill(null))
    visited[start.y][start.x] = true

    while (queue.length > 0) {
      const current = queue.shift()
      const { x, y } = current

      if (x === end.x && y === end.y) {
        let path = []
        let cur = current
        while (cur) {
          path.push(cur)
          cur = prev[cur.y][cur.x]
        }
        return path.reverse().slice(1)
      }

      const directions = [
        { dx: 0, dy: -1, wall: 'top' },
        { dx: 0, dy: 1, wall: 'bottom' },
        { dx: -1, dy: 0, wall: 'left' },
        { dx: 1, dy: 0, wall: 'right' },
      ]

      for (const dir of directions) {
        const nx = x + dir.dx
        const ny = y + dir.dy

        if (
          nx >= 0 &&
          nx < cols &&
          ny >= 0 &&
          ny < rows &&
          !maze[y][x][dir.wall] &&
          !visited[ny][nx]
        ) {
          visited[ny][nx] = true
          prev[ny][nx] = current
          queue.push({ x: nx, y: ny })
        }
      }
    }
    return []
  }

  startAutoMove() {
    const path = this.findPath()

    if (path.length === 0) {
      this.state.autoMoving = false
      return
    }

    this.state.autoMoving = true
    this.state.autoMovePath = path
    this.state.glitch.intensity = 100
    this.state.glitch.playerTrail = [{ ...this.state.playerPosition, age: 0 }]
    this.lastAutoMoveTime = this.libs.p5.millis()
  }

  startResurrection() {
    const r = this.state.resurrection
    r.active = true
    r.phase = 0
    r.startTime = this.libs.p5.millis()
    r.shakeAmount = 0
    r.flashCount = 10

    const trail = this.state.glitch.playerTrail
    if (trail.length > 0) trail.forEach((pos) => (pos.age = 0))

    this.state.gameOver = true
    this.state.won = true
  }

  update(dt) {
    this.handleInput()

    const p5 = this.libs.p5
    const state = this.state
    const r = state.resurrection
    const g = state.glitch

    if (r.active) {
      const now = p5.millis()
      const elapsed = now - r.startTime

      if (elapsed < 1000) {
        r.phase = 1
        r.shakeAmount = Math.min(0.8, r.shakeAmount + 0.05)
      } else {
        r.phase = 2
        r.shakeAmount = 0.7 + Math.sin(now * 0.001) * 0.3
        if (Math.random() < 0.02) r.flashCount++
      }

      g.colorPhase = (g.colorPhase + 1) % 360
      g.intensity = 50 + Math.sin(now * 0.001) * 50
      g.playerTrail.forEach((pos) => (pos.age += 0.03))
    } else {
      g.intensity *= 0.995
      g.colorPhase = (g.colorPhase + 1) % 360

      g.playerTrail.forEach((pos) => (pos.age += 0.1))
      if (g.playerTrail.length > 0 && g.playerTrail[0].age > 10)
        g.playerTrail.shift()

      if (state.autoMoving) {
        const now = p5.millis()
        if (now - this.lastAutoMoveTime > 5) {
          const stepsToTake = Math.min(3, state.autoMovePath.length)

          for (let i = 0; i < stepsToTake; i++) {
            if (state.autoMovePath.length === 0) {
              state.autoMoving = false
              break
            }

            const nextPos = state.autoMovePath.shift()
            state.playerPosition = nextPos

            if (i % 2 === 0) g.playerTrail.push({ ...nextPos, age: 0 })
            state.visitedCells.add(`${nextPos.x},${nextPos.y}`)
            g.intensity = 100

            if (
              nextPos.x === state.endPosition.x &&
              nextPos.y === state.endPosition.y
            ) {
              this.startResurrection()
              state.autoMoving = false
              state.gameOver = true
              state.won = true
              break
            }
          }
          this.lastAutoMoveTime = now
        }
      }

      if (state.autoMoving || r.active) state.helpMessage.show = false
      else if (
        !state.helpMessage.show &&
        p5.millis() - state.helpMessage.startTime > 1750
      )
        state.helpMessage.show = true
    }

    this.draw()
  }

  draw() {
    const p5 = this.libs.p5
    const state = this.state
    const r = state.resurrection
    const g = state.glitch

    p5.resetMatrix()

    if (r.active && r.shakeAmount > 0) {
      p5.push()
      p5.translate(
        (Math.random() - 0.5) * 10 * r.shakeAmount,
        (Math.random() - 0.5) * 10 * r.shakeAmount
      )
    }

    if (state.autoMoving) {
      p5.background(20, 20, 40)
      p5.fill(p5.color(`hsb(${g.colorPhase}, 80%, 90%, 0.3)`))
      p5.noStroke()
      p5.rect(0, 0, p5.width, p5.height)
    } else if (r.active) {
      if (r.phase === 1) p5.background(20, 20, 40)
      else if (r.phase === 2)
        p5.background(Math.random() < 0.05 ? 255 : 10, 10, 20)
    } else p5.background(255)

    if (!r.active) this.drawMazeAndPlayer(p5)
    else {
      this.drawPlayerTrail(p5)

      const centerX = p5.width / 2
      const centerY = p5.height / 2

      if (r.phase === 2 && Math.random() < 0.75) {
        p5.fill(255, 100)
        p5.noStroke()
        for (let i = 0; i < 100; i++) {
          p5.rect(
            Math.random() * p5.width,
            Math.random() * p5.height,
            Math.random() * 5 + 10,
            Math.random() * 5 + 10
          )
        }
      }

      const pulseFactor = Math.sin(p5.millis() * 0.003) * 60
      p5.textSize(100 + pulseFactor)
      p5.textAlign(p5.CENTER, p5.CENTER)

      let x = centerX,
        y = centerY
      if (r.phase === 2) {
        x += (Math.random() - 0.5) * 15 * r.shakeAmount
        y += (Math.random() - 0.5) * 15 * r.shakeAmount
      }

      if (r.phase === 2 && Math.random() < 0.75) {
        p5.text(r.playerEmoji, x + 10, y)
        p5.text(r.playerEmoji, x, y)
        p5.text(r.playerEmoji, x - 10, y)
      } else {
        p5.fill(255)
        p5.text(r.playerEmoji, x, y)
      }

      if (r.flashCount > 0 && Math.random() < 0.1) {
        p5.fill(255, 255, 255, 150)
        p5.rect(0, 0, p5.width, p5.height)
        r.flashCount--
      }
    }

    if (state.helpMessage.show) {
      const scale = 0.9 + Math.sin(p5.millis() * 0.003) * 0.1
      p5.push()
      p5.textAlign(p5.CENTER, p5.CENTER)
      p5.textSize(50 * scale)
      p5.fill(255, 255, 0)
      p5.stroke(0)
      p5.strokeWeight(4)
      p5.text('PRESS ALL ARROW KEYS!', p5.width / 2, p5.height / 2)
      p5.pop()
    }

    if (r.active && r.shakeAmount > 0) p5.pop()
  }

  drawMazeAndPlayer(p5) {
    const state = this.state
    const m = state.margin
    const cs = state.cellSize
    const g = state.glitch

    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.maze[r][c]
        const x = m + c * cs
        const y = m + r * cs

        if (state.visitedCells.has(`${c},${r}`)) {
          p5.noStroke()
          if (state.autoMoving) {
            const hue = (g.colorPhase + c * r * 2) % 360
            p5.fill(p5.color(`hsba(${hue}, 50%, 80%, 0.3)`))
          } else p5.fill(180, 180, 180, 100)
          p5.rect(x, y, cs, cs)
        }

        p5.stroke(0)
        p5.strokeWeight(2)
        if (cell.top) p5.line(x, y, x + cs, y)
        if (cell.right) p5.line(x + cs, y, x + cs, y + cs)
        if (cell.bottom) p5.line(x, y + cs, x + cs, y + cs)
        if (cell.left) p5.line(x, y, x, y + cs)
      }
    }

    this.drawPlayerTrail(p5)

    p5.fill(0)
    p5.noStroke()
    p5.textAlign(p5.CENTER, p5.CENTER)
    p5.textSize(cs * 0.7)
    p5.text(
      '⚰️',
      m + state.endPosition.x * cs + cs / 2,
      m + state.endPosition.y * cs + cs / 2
    )

    p5.textSize(cs * 0.8)
    p5.fill(
      state.autoMoving
        ? p5.color(`hsb(${(g.colorPhase * 2) % 360}, 100%, 100%)`)
        : 0
    )
    p5.text(
      state.resurrection.playerEmoji,
      m + state.playerPosition.x * cs + cs / 2,
      m + state.playerPosition.y * cs + cs / 2
    )
  }

  drawPlayerTrail(p5) {
    const state = this.state
    const trail = state.glitch.playerTrail
    const m = state.margin
    const cs = state.cellSize

    if (trail.length <= 1) return

    p5.noFill()
    p5.strokeWeight(state.resurrection.active ? 8 : 4)
    p5.beginShape()

    for (let i = 0; i < trail.length; i++) {
      const pos = trail[i]
      const x = m + pos.x * cs + cs / 2
      const y = m + pos.y * cs + cs / 2

      const maxAge = state.resurrection.active ? 30 : 10
      const alpha = Math.max(0, 1 - pos.age / maxAge)

      if (state.autoMoving || state.resurrection.active) {
        p5.stroke(
          p5.color(
            `hsba(${(state.glitch.colorPhase + i * 15) % 360}, 100%, 100%, ${alpha})`
          )
        )
      } else p5.stroke(p5.color(`rgba(100, 100, 100, ${alpha})`))

      p5.vertex(x, y)
    }

    p5.endShape()
  }

  end() {
    return this.state.won
  }
}
