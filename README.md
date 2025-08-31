# Arkascript

A lightweight Breakout clone built with vanilla HTML5 Canvas + JS.
Smooth input, paddle angle bounce, brick hit-states, pause/reset, and anti-tunneling collision so the ball doesn’t sneak through the paddle or bricks at high speed.

🎮 Features

Canvas rendering with a minimal, dependency-free loop (requestAnimationFrame).

Responsive controls: Arrow keys, mouse, and touch (drag) for the paddle.

Paddle bounce with angle based on where the ball hits the paddle.

Brick states: ACTIVE → HIT → DESTROYED with scoring.

Pause (P) and Reset (R).

Optional sprites (paddle + bricks). If images aren’t available, it falls back to crisp rectangles.

Anti-tunneling:

Continuous Collision Detection (CCD) against the paddle (segment sweep).

Sub-steps update for bricks to reduce pass-through at high speeds.

🗂 File structure
.
├── index.html     # Canvas & HUD; loads game.js
├── main.js        # Game logic, rendering & physics
├── sprite.png     # (optional) paddle spritesheet
└── bricks.png     # (optional) bricks spritesheet


If you don’t have sprite.png/bricks.png, the game draws paddle/bricks with fills/strokes automatically.

▶️ Getting started

Put index.html and game.js in the same folder (add sprites if you have them).

Open index.html in a browser.
(Tip: using a simple static server avoids image caching/CORS quirks, but double-click works too.)

⌨️ Controls

Left / Right: move the paddle

P: pause / resume

R: reset game

Mouse / Touch: move the paddle by dragging across the canvas

⚙️ Configuration knobs (edit in game.js)

Ball: ballRadius, initial speed in resetBallAndPaddle()

Paddle: paddleWidth, paddleHeight, paddleSpeed

Bricks layout: brickRowCount, brickColumnCount, sizes and offsets

Brick scoring/health: BRICK_STATUS progression and points

Max speed (optional): clamp Math.hypot(dx, dy) if you push speeds higher

🧠 How it works (tech notes)
1) Game loop

The loop is a single draw() called via requestAnimationFrame.

Each frame:

Clear canvas → draw bricks, ball, paddle, HUD

If running: handle input, update physics, detect collisions, check win/lose

2) Paddle bounce with angle

When the ball collides with the paddle, the bounce angle depends on where it hits:

const rel = (hitX - (paddleX + paddleWidth/2)) / (paddleWidth/2); // -1..1
const angle = rel * (Math.PI / 3); // spread up to ±60°


Horizontal (dx) and vertical (dy) components are recalculated from that angle, keeping ball speed roughly constant (slightly boosted to increase game pace).

3) Continuous Collision Detection (CCD) vs paddle

Prevents the ball from “tunneling” through the paddle when it moves fast:

Treat the ball path during a frame as a segment from (x,y) to (x+dx,y+dy).

If the segment crosses the paddle’s top plane within this frame, compute the impact time t:

const t = (paddleTop - y) / dy; // fraction of the frame where collision happens
const hitX = x + dx * t;


If hitX is within the paddle bounds (with a margin = ball radius), place the ball exactly at the impact point, reflect its velocity using the angle rule above, and then integrate the remaining time 1 - t of the frame with the new velocity.

This ensures no visual overlap and consistent rebounds even at high speed.

4) Anti-tunneling for bricks (sub-steps)

When the ball is very fast, it could skip over thin bricks.

Solution: split the frame into several mini-steps based on speed and ball radius:

const steps = Math.max(1, Math.ceil(speed / (ballRadius * 0.9)));
for (let i = 0; i < steps; i++) {
  // move a fraction of dx,dy
  // check brick collisions each sub-step
}


This drastically reduces pass-through while keeping the code simple and fast.

5) Brick states & scoring

Each brick has a status: ACTIVE (1) → HIT (0.5) → DESTROYED (0).

On collision:

ACTIVE → HIT (+5)

HIT → DESTROYED (+10)

Victory when all bricks are destroyed.

6) Sprites with graceful fallback

If the images load (sprite.png, bricks.png), ctx.drawImage() uses a tile from the spritesheet.

If they’re missing or fail to load, the code auto-falls back to fillRect()/strokeRect() with colors.

🧪 Known limits / tips

At extremely high speeds, you may still want to clamp max speed (e.g. <= 10–12 px/frame).

Brick collision is AABB-based and resolved once per sub-step for performance (good enough for arcade feel).

Paddle angle range (±60°) is configurable; narrower angles make the game easier.

🗺️ Roadmap (ideas)

Multi-ball, paddle size power-ups, speed boost/slow

Particles and SFX

Levels with different brick patterns

Scoreboard & lives UI polish

Mobile vibration feedback

📄 License

MIT — do what you love, ship games. 🎮# Arkascript
