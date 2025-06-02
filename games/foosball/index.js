export default class MircoGame {
  constructor({ input, assets, libs, mirco }) {
    this.input = input
    this.assets = assets
    this.libs = libs
    this.mirco = mirco // { round: number, wins: number, losses: number }

    this.state = {
      gameOver: false,
      won: false, // set false = lose by default, true = win by default
    }
  }

  /** Create model */
  init(canvas) {
    const customState = {
      ball: {
        position: {
          x: canvas.width / 2,
          y: canvas.height / 2,
        },
        diameter: 25,
        speed: 2,
        angle: (Math.random() * Math.PI) / 2 - Math.PI / 4,
        velocity: {
          x: 0,
          y: 0,
        },
      },
      bar: {
        x: canvas.width * 0.8,
        yOffset: 0,
        numPlayers: 3,
        playerDiameter: 20,
      },
      goalPost: {
        top: canvas.height / 6,
        bottom: (5 * canvas.height) / 6,
      },
    }

    // leave this - merges default state with your state
    this.state = { ...this.state, ...customState }
  }

  update(dt) {
    // this function gets called every tick
    // dt is deltaTime - time between ticks
    const state = this.state
    const p5 = this.libs.p5

    let ball = state.ball
    let goalPost = state.goalPost

    ball.velocity.x = ball.speed * Math.cos(ball.angle)
    ball.velocity.y = ball.speed * Math.sin(ball.angle)

    ball.position.x += ball.velocity.x
    ball.position.y += ball.velocity.y

    const playerSpacing = p5.height / (state.bar.numPlayers + 1)
    
    // player collision
    const xDiff = ball.position.x - state.bar.x
    if (Math.abs(xDiff) < (state.bar.playerDiameter + ball.diameter) / 2) {
      let touchingPlayer = false
      for (var i = 0; i < state.bar.numPlayers; i++) {
        const yDiff =
          ball.position.y - ((i + 1) * playerSpacing + state.bar.yOffset)
        if (Math.abs(yDiff) < (state.bar.playerDiameter + ball.diameter) / 2) {
          // collision occured
          touchingPlayer = true
          const angleOfCollision = Math.atan2(yDiff, xDiff)
          if (
            Math.abs(angleOfCollision) <= Math.PI / 4 ||
            Math.abs(angleOfCollision - Math.PI) <= Math.PI / 4
          ) {
            ball.velocity.x *= -1
          }
          if (
            Math.abs(angleOfCollision - Math.PI / 2) <= Math.PI / 4 ||
            Math.abs(angleOfCollision - (3 * Math.PI) / 2)
          ) {
            ball.velocity.y *= -1
          }
        }
      }
    }

    // bounce the ball off the walls!
    if (ball.position.x >= p5.width) {
      ball.velocity.x = -ball.velocity.x
    } else if (ball.position.x <= 0) {
      if (ball.position.y < goalPost.top || ball.position.y > goalPost.bottom) {
        ball.velocity.x = -ball.velocity.x
      } else {
        state.won = true
        state.gameOver = true
      }
    }

    if (ball.position.y <= 0 || ball.position.y >= p5.height) {
      ball.velocity.y = -ball.velocity.y
    }

    ball.angle = Math.atan2(ball.velocity.y, ball.velocity.x)

    if (this.input.isPressedUp()) {
      state.bar.yOffset -= 5
    } else if (this.input.isPressedDown()) {
      state.bar.yOffset += 5
    }
    state.bar.yOffset = Math.max(
      -playerSpacing,
      Math.min(playerSpacing, state.bar.yOffset)
    )

    this.draw()
  }

  draw() {
    const state = this.state
    const p5 = this.libs.p5

    p5.background('green')
    p5.fill('white')
    p5.stroke('transparent')
    p5.circle(state.ball.position.x, state.ball.position.y, state.ball.diameter)

    p5.stroke('white')
    p5.fill('transparent')
    // opponent net
    p5.strokeWeight(10)
    p5.rect(0, state.goalPost.top, 50, state.goalPost.bottom - state.goalPost.top)
    p5.strokeWeight(2)
    for (let i = 0; i < 30; i += 15) {
      p5.line(15 + i, state.goalPost.top, 15 + i, state.goalPost.bottom)
    }
    for (let i = state.goalPost.top + 20; i < state.goalPost.bottom; i += 20) {
      p5.line(0, i, 50, i)
    }
    // player net
    p5.strokeWeight(10)
    p5.rect(p5.width, state.goalPost.top, -50, state.goalPost.bottom - state.goalPost.top)
    p5.strokeWeight(2)
    for (let i = 0; i < 30; i += 15) {
      p5.line(
        p5.width - (15 + i),
        state.goalPost.top,
        p5.width - (15 + i),
        state.goalPost.bottom
      )
    }
    for (let i = state.goalPost.top + 20; i < state.goalPost.bottom; i += 20) {
      p5.line(p5.width, i, p5.width - 50, i)
    }

    // player bar
    p5.stroke('black')
    p5.strokeWeight(10)
    p5.line(state.bar.x, 0, state.bar.x, p5.height)
    const playerSpacing = p5.height / (state.bar.numPlayers + 1)
    for (var i = 0; i < state.bar.numPlayers; i++) {
      p5.circle(
        state.bar.x,
        state.bar.yOffset + (i + 1) * playerSpacing,
        state.bar.playerDiameter
      )
    }
  }

  /** return true if game is won, false if lost */
  end() {
    return this.state.won
  }
}
