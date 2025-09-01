const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  const $sprite = document.querySelector('#sprite');
  const $bricks = document.querySelector('#bricks');
  const $bricksdos = document.querySelector('#bricksdos');

  // Flags de sprites cargados fallback a rectángulos si no hay imágenes
  let spriteOk = !!($sprite && $sprite.complete && $sprite.naturalWidth > 0);
  let bricksOk = !!($bricks && $bricks.complete && $bricks.naturalWidth > 0);
  let bricksdosOk = !!($bricksdos && $bricksdos.complete && $bricksdos.naturalWidth > 0);
  
  if ($sprite) $sprite.addEventListener('load', () => spriteOk = true);
  if ($sprite) $sprite.addEventListener('error', () => spriteOk = false);
  if ($bricks) $bricks.addEventListener('load', () => bricksOk = true);
  if ($bricks) $bricks.addEventListener('error', () => bricksOk = false);
  if ($bricksdos) $bricksdos.addEventListener('load', () => bricksdosOk = true);
  if ($bricksdos) $bricksdos.addEventListener('error', () => bricksdosOk = false);

  // Estado de juego y constantes globales
  let score = 0;
  let lives = 3;
  let isGameOver = false;
  let isGameWon = false;
  let paused = false;

  // Bola y su movimiento
  const ballRadius = 5;
  let x, y, dx, dy;

  // Pala y su movimiento
  const paddleHeight = 30;
  const paddleWidth  = 90;
  const paddleSpeed  = 7;
  let paddleX, paddleY;
  let rightPressed = false;
  let leftPressed  = false;

  // Ladrillos y su configuración inicial
  const brickRowCount = 5;
  const brickColumnCount = 13;
  const brickWidth = 40;
  const brickHeight = 20;
  const brickPadding = 5;
  const brickOffsetTop = 35;
  const brickOffsetLeft = 60;

  const BRICK_TILE_W = 32;
  const BRICK_TILE_H = 16;

  const BRICK_STATUS = {
    ACTIVE: 1,
    HIT: 0.5,
    DESTROYED: 0
  };
  const bricks = [];

  function initBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        const colorIndex = Math.floor(Math.random() * 8); // 0..7
        bricks[c][r] = {
          x: brickX, y: brickY,
          status: BRICK_STATUS.ACTIVE,
          color: colorIndex
        };
      }
    }
  }

  function resetBallAndPaddle() {
    x = canvas.width / 2;
    y = canvas.height - 40;
    const speed = 3;       // velocidad base
    const angle = -Math.PI / 3; // -60º
    dx = speed * Math.cos(angle);
    dy = speed * Math.sin(angle);

    paddleX = (canvas.width - paddleWidth) / 2;
    paddleY = canvas.height - paddleHeight - 14;
  }

  function resetGame(full = true) {
    score = 0;
    lives = 3;
    isGameOver = false;
    isGameWon = false;
    if (full) initBricks();
    resetBallAndPaddle();
  }

  //  Dibujo de elementos en pantalla y limpieza
  function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
  }

  function drawPaddle() {
    if (spriteOk) {
      // Ajusta estos valores según tu spritesheet
      const sx = 29, sy = 174, sw = 58, sh = 16; // tamaño probable de un trozo de sprite
      ctx.drawImage($sprite, sx, sy, sw, sh, paddleX, paddleY, paddleWidth, paddleHeight);
    } else {
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
      ctx.strokeStyle = '#0b7285';
      ctx.strokeRect(paddleX, paddleY, paddleWidth, paddleHeight);
    }
  }

  function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === BRICK_STATUS.DESTROYED) continue;

      // Elegimos hoja según estado: ACTIVE -> bricks, HIT -> bricksdos
      const isHit = (b.status === BRICK_STATUS.HIT);
      const sheet = isHit ? $bricksdos : $bricks;
      const sheetOk = isHit ? bricksdosOk : bricksOk;

      if (sheetOk) {
        const clipX = b.color * (BRICK_TILE_W || 32);
        const clipW = (BRICK_TILE_W || 32);
        const clipH = (BRICK_TILE_H || 16);
        ctx.drawImage(sheet, clipX, 0, clipW, clipH, b.x, b.y, brickWidth, brickHeight);
      } else {
        // Fallback a rectángulos si falta alguna hoja
        ctx.fillStyle = isHit ? '#f59f00' : '#d9eb38';
        ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(b.x, b.y, brickWidth, brickHeight);
      }
    }
  }
}


  function drawScore() {
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#9ae6b4';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function drawLives() {
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('Lives: ' + lives, canvas.width - 90, 20);
  }

  function drawOverlay(text) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'start';
  }

  // Lógica de la pala y la bola
  function paddleMovement() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
      paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
      paddleX -= paddleSpeed;
    }
  }

  function ballMovement() {
  let nextX = x + dx;
  let nextY = y + dy;

  // Paredes laterales (rebote simple con previsión)
  if (nextX > canvas.width - ballRadius || nextX < ballRadius) {
    dx = -dx;
    nextX = x + dx;
  }

  // Techo
  if (nextY < ballRadius) {
    dy = -dy;
    nextY = y + dy;
  }

  // --- CCD con la PALA (evita que la bola la atraviese) ---
  if (dy > 0) { // sólo si baja
    const paddleTop = paddleY - ballRadius;

    // ¿Cruza el plano superior de la pala en este frame?
    if (y <= paddleTop && nextY >= paddleTop) {
      const t = (paddleTop - y) / dy;        // 0..1 tiempo de impacto dentro del frame
      const hitX = x + dx * t;

      // Acepta impacto si cae dentro (con margen = radio)
      const within =
        hitX >= (paddleX - ballRadius) &&
        hitX <= (paddleX + paddleWidth + ballRadius);

      if (within) {
        // Coloca la bola EXACTAMENTE en el punto de choque
        x = hitX;
        y = paddleTop;

        // Rebote con ángulo según punto de impacto
        const speed = Math.hypot(dx, dy) * 1.03; // acelera un pelín
        const rel = (hitX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2); // -1..1
        const angle = rel * (Math.PI / 3); // +-60°

        dx = speed * Math.sin(angle);
        dy = -Math.abs(speed * Math.cos(angle));

        // Avanza el resto del frame después del impacto
        const rem = 1 - t;
        x += dx * rem;
        y += dy * rem;

        return; // salta el avance normal abajo
      }
    }
  }

  // Suelo (no tocó la pala)
  if (nextY > canvas.height - ballRadius) {
    lives--;
    if (!lives) {
      isGameOver = true;
    } else {
      resetBallAndPaddle();
    }
    return;
  }

  // Avance normal
  x = nextX;
  y = nextY;
}


  function collisionDetection() {
    // chequeo simple: si la bola entra en el AABB del ladrillo (con radio)
    const prevX = x - dx;
    const prevY = y - dy;

    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];
        if (b.status === BRICK_STATUS.DESTROYED) continue;

        const hitX = x > b.x - ballRadius && x < b.x + brickWidth + ballRadius;
        const hitY = y > b.y - ballRadius && y < b.y + brickHeight + ballRadius;

        if (hitX && hitY) {
          // decidir si rebotar en X o Y según desde dónde venía
          const wasAbove = prevY <= b.y - ballRadius;
          const wasBelow = prevY >= b.y + brickHeight + ballRadius;
          const wasLeft  = prevX <= b.x - ballRadius;
          const wasRight = prevX >= b.x + brickWidth + ballRadius;

          if (wasAbove || wasBelow) dy = -dy; else if (wasLeft || wasRight) dx = -dx; else dy = -dy;

          // degradar ladrillo y sumar puntos
          if (b.status === BRICK_STATUS.ACTIVE) {
            b.status = BRICK_STATUS.HIT;
            score += 5;
          } else {
            b.status = BRICK_STATUS.DESTROYED;
            score += 10;
          }

          // procesar sólo 1 colisión por frame
          return;
        }
      }
    }
  }

  function checkWin() {
    const left = bricks.flat().filter(b => b.status !== BRICK_STATUS.DESTROYED).length;
    if (left === 0) isGameWon = true;
  }

  // Entrada de usuario y controles
  function initEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Right') { rightPressed = true; e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Left') { leftPressed = true; e.preventDefault(); }
      else if (e.key === 'r' || e.key === 'R') { resetGame(); }
      else if (e.key === 'p' || e.key === 'P') { paused = !paused; }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Right') { rightPressed = false; e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Left') { leftPressed = false; e.preventDefault(); }
    });
  }

  //  Bucle principal de dibujo y actualización
  function draw() {
    cleanCanvas();

    drawBricks();
    drawBall();
    drawPaddle();
    drawLives();
    drawScore();

    if (paused) {
      drawOverlay('PAUSE (P to continue)');
    } else if (!isGameOver && !isGameWon) {
      paddleMovement();
      ballMovement();
      collisionDetection();
      checkWin();
    } else {
      drawOverlay(isGameWon ? 'YOU WIN! Press R to restart' : 'Game Over — Press R to restart');
    }

    requestAnimationFrame(draw);
  }

  // Start
  initBricks();
  resetBallAndPaddle();
  initEvents();
  draw();