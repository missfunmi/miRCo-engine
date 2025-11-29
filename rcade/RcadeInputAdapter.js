import { PLAYER_1 } from '@rcade/plugin-input-classic'

export class RcadeInputAdapter {
  constructor() {
    this.prev = { up: false, down: false, left: false, right: false }
    this.released = { up: false, down: false, left: false, right: false }
  }

  // Current state (held)
  isPressedUp() {
    return PLAYER_1.DPAD.up
  }
  isPressedDown() {
    return PLAYER_1.DPAD.down
  }
  isPressedLeft() {
    return PLAYER_1.DPAD.left
  }
  isPressedRight() {
    return PLAYER_1.DPAD.right
  }

  // Just pressed (edge detection)
  justPressedUp() {
    return PLAYER_1.DPAD.up && !this.prev.up
  }
  justPressedDown() {
    return PLAYER_1.DPAD.down && !this.prev.down
  }
  justPressedLeft() {
    return PLAYER_1.DPAD.left && !this.prev.left
  }
  justPressedRight() {
    return PLAYER_1.DPAD.right && !this.prev.right
  }

  // Just released (edge detection)
  releasedUp() {
    return this.released.up
  }
  releasedDown() {
    return this.released.down
  }
  releasedLeft() {
    return this.released.left
  }
  releasedRight() {
    return this.released.right
  }

  // Gamepad stub (for games that use pulse())
  gamepad = {
    pulse: () => {}, // No rumble on arcade cabinet
    isAnyButtonPressed: () => false,
  }

  // Called after each frame to update edge detection state
  postUpdate() {
    // Detect releases (was pressed last frame, not pressed now)
    this.released.up = this.prev.up && !PLAYER_1.DPAD.up
    this.released.down = this.prev.down && !PLAYER_1.DPAD.down
    this.released.left = this.prev.left && !PLAYER_1.DPAD.left
    this.released.right = this.prev.right && !PLAYER_1.DPAD.right

    // Store current as previous for next frame
    this.prev.up = PLAYER_1.DPAD.up
    this.prev.down = PLAYER_1.DPAD.down
    this.prev.left = PLAYER_1.DPAD.left
    this.prev.right = PLAYER_1.DPAD.right
  }
}
