export default class MircoGame {
  constructor({ input, assets, libs }) {
    this.input = input
    this.assets = assets
    this.libs = libs
    this.state = {
      gameOver: false,
      won: true,
    }
  }

  init(canvas) {
    const customState = {
      player: {
        x: 100,
        y: 220,
        width: 40,
        height: 40,
      },
      block: {
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 100,
        height: 70,
        speed: 0.2,
      },
      currentSeconds: 0,
      currentMinutes: 30,
      currentHours: 3,
      currentSecondsOffset: 0,
      currentMinutesOffset: 0,
      currentHoursOffset: 0,
      expectedSeconds: Math.floor(Math.random() * 60),
      expectedMinutes: 30,
      expectedHours: 3,

      startTime: performance.now(),

      message: '',
    }

    this.state = { ...this.state, ...customState }
    return
  }

  update(dt) {
    const s = this.state
    if (s.gameOver) return

    // Move player
    // if (this.input.isPressedLeft()) s.player.x -= 0.2 * dt;
    // if (this.input.isPressedRight()) s.player.x += 0.2 * dt;

    // Move time
    // forwards
    if (this.input.isPressedUp()) {
      s.currentMinutesOffset += 1
      if (s.currentMinutesOffset >= 60) {
        s.currentMinutesOffset = 0
        s.currentHoursOffset += 1
        if (s.currentHoursOffset >= 24) {
          s.currentHoursOffset = 0
        }
      }
      if (
        s.currentHours === s.expectedHours &&
        s.currentMinutes === s.expectedMinutes &&
        s.currentSeconds === s.expectedSeconds
      ) {
        s.won = true
        this.won()
      }
    }
    // backwards
    if (this.input.isPressedDown()) {
      s.currentMinutesOffset -= 1
      if (s.currentMinutesOffset < 0) {
        s.currentMinutesOffset = 59
        s.currentHoursOffset -= 1
        if (s.currentHoursOffset < 0) {
          s.currentHoursOffset = 23
        }
      }
      if (
        s.currentHours === s.expectedHours &&
        s.currentMinutes === s.expectedMinutes &&
        s.currentSeconds === s.expectedSeconds
      ) {
        s.won = true
        this.won()
      }
    }
    this.draw()
  }

  draw() {
    const s = this.state
    const p5 = this.libs.p5
    const cx = 400
    const cy = 300
    p5.background(255)
    // p5.translate(200, 150);

    const innerRadius = 100
    const secondaryInnerRadius = 110
    const outerRadius = 130
    const numTicks = 12 // Number of ticks around the circle

    let seconds =
      p5.map(s.currentSeconds + s.currentSecondsOffset, 0, 60, 0, p5.TWO_PI) -
      p5.HALF_PI
    const secondsRadius = 80

    let minutes =
      p5.map(
        s.currentMinutes +
          s.currentMinutesOffset +
          p5.norm(s.currentSeconds + s.currentSecondsOffset, 0, 60),
        0,
        60,
        0,
        p5.TWO_PI
      ) - p5.HALF_PI
    const minutesRadius = 80

    let hours =
      p5.map(
        s.currentHours +
          s.currentHoursOffset +
          p5.norm(s.currentMinutes + s.currentMinutesOffset, 0, 60),
        0,
        24,
        0,
        p5.TWO_PI * 2
      ) - p5.HALF_PI
    const hoursRadius = 80

    // draw milanese band
    let doFill = true
    let milaneseWidth = 8
    let milaneseHeight = 16
    let colCount = 16
    let borderRadius = 2
    let rowCount = 100
    let milaneseShade = 160
    p5.push() // black stroke
    p5.fill(milaneseShade)
    p5.stroke(milaneseShade)
    p5.strokeWeight(2)
    // rows
    for (let x = 0; x <= 100; x++) {
      // columns
      for (let y = 0; y <= colCount; y++) {
        if ((y + (x % 2)) % 2 === 0) {
          p5.rect(
            cx - (milaneseWidth * colCount) / 2 + y * milaneseWidth,
            x * milaneseHeight,
            milaneseWidth,
            milaneseHeight,
            borderRadius,
            borderRadius,
            borderRadius,
            borderRadius
          )
        }
      }
    }
    p5.pop()

    // winder
    let winderFill = 160
    p5.push()
    p5.translate(cx + outerRadius - 10, cy)
    p5.stroke(winderFill)
    p5.strokeWeight(2)
    p5.fill(winderFill)
    p5.rect(0, -25, 25, 50)
    p5.pop()

    // Draw outer circle
    let outerCircleFill = 40
    p5.push()
    p5.translate(cx, cy)
    p5.stroke(outerCircleFill)
    p5.strokeWeight(2)
    p5.fill(outerCircleFill)
    p5.ellipse(0, 0, outerRadius * 2)
    p5.pop()

    // Draw secondary inner circle
    let secCircleFill = 160
    p5.push()
    p5.translate(cx, cy)
    p5.stroke(secCircleFill)
    p5.strokeWeight(2)
    p5.fill(secCircleFill)
    p5.ellipse(0, 0, secondaryInnerRadius * 2)
    p5.pop()

    // Draw inner circle
    let innerCircleFill = 240
    p5.push()
    p5.translate(cx, cy)
    p5.stroke(innerCircleFill)
    p5.strokeWeight(2)
    p5.fill(innerCircleFill)
    p5.ellipse(0, 0, innerRadius * 2)
    p5.pop()

    // draw-hands
    p5.strokeWeight(2)
    p5.stroke(0)

    // // draw seconds-hand
    p5.push()
    p5.translate(cx, cy)
    p5.rotate(seconds)
    p5.line(0, 0, 0, secondsRadius)
    p5.pop()

    // // Minute hand
    p5.push()
    p5.translate(cx, cy)
    p5.rotate(minutes)
    p5.strokeWeight(3)
    p5.line(0, 0, 0, minutesRadius)
    p5.pop()

    // // Hour hand
    p5.push()
    p5.translate(cx, cy)
    p5.rotate(hours)
    p5.strokeWeight(4)
    p5.line(0, 0, 0, hoursRadius)
    p5.pop()

    // draw sawtooth outline
    // let secondaryOuterRadius = 135;
    // let numTeeth = 30;
    // let toothHeight = 10;
    // p5.beginShape();
    // p5.noFill();
    // p5.strokeWeight(2);

    // for (let i = 0; i < numTeeth; i++) {
    //   let angle = p5.map(i, 0, numTeeth, 0, 360);
    //   let outerRadius = secondaryOuterRadius + toothHeight;
    //   let innerRadius = secondaryOuterRadius - toothHeight;

    //   let xOuter = outerRadius * p5.cos(angle);
    //   let yOuter = outerRadius * p5.sin(angle);

    //   let nextAngle = p5.map(i + 0.5, 0, numTeeth, 0, 360); // Midpoint for the inner point
    //   let xInner = innerRadius * p5.cos(nextAngle);
    //   let yInner = innerRadius * p5.sin(nextAngle);

    //   p5.vertex(xOuter, yOuter);
    //   p5.vertex(xInner, yInner);
    // }
    // p5.endShape(p5.CLOSE);
    // END: sawtooth circle

    // Draw the ticks
    // p5.strokeWeight(1);
    // for (let i = 0; i < numTicks; i++) {
    //   let angle = p5.map(i, 0, numTicks, 0, 360);
    //   let x1 = innerRadius * p5.cos(angle);
    //   let y1 = innerRadius * p5.sin(angle);
    //   let x2 = (innerRadius + 10) * p5.cos(angle); // Ticks extend outwards by 10 pixels
    //   let y2 = (innerRadius + 10) * p5.sin(angle);
    //   p5.line(x1, y1, x2, y2);
    // }
  }

  collides(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  end() {
    return this.state.won
  }
}
