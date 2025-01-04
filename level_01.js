const kLevel01VertexShader = `
  uniform mat3 u_matrix;

  attribute vec4 a_position; // x, y, forwardCov, backwardCov

  varying vec2 v_cov;

  void main() {
    gl_Position = vec4((vec3(a_position.xy, 1) * u_matrix).xy, 0, 1);
    v_cov = a_position.zw;
  }
`;

const kLevel01FragmentShader = `
  precision mediump float;

  uniform vec3 u_color;

  varying vec2 v_cov;

  void main() {
    vec2 cov = clamp(v_cov, vec2(0, 0), vec2(1, 1));
    gl_FragColor = vec4(u_color * sign(cov.x + cov.y), 1);
  }
`;

const kLevel01Projection = m3_multiply(
  m3_translation(-7.5, -7),
  m3_scaling(1 / 10, 1 / 10),
);

const kLevel01Vertices = [
  [0, 3],
  [4, 3],
  [9, 3],
  [9, 9],
  [8, 14],
  [0, 14],
  [4, 9],
  [4, 0],
  [15, 0],
  [15, 9],
];

const kLevel01Edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
  [6, 1],
  [1, 7],
  [7, 8],
  [8, 9],
  [9, 3],
  [3, 6],
];

function initLevel01(gl) {
  console.log("level-01");
  const kPlayer0Speed = 0.01;
  const kPlayer0Radius = 0.4;

  const kPlayer1Speed = 0.01;
  const kPlayer1Radius = 0.3;

  const level = new LevelState(kLevel01Vertices, kLevel01Edges);
  let player0 = new PlayerState(performance.now(), 0);
  let player1 = new PlayerState(performance.now(), 9);
  updateEdgeCovs(
    level,
    player0.vertexIndex,
    player0.edgeIndex,
    player0.phi,
    kPlayer0Radius,
  );

  updateGameState = function () {
    const timestampMs = performance.now();
    // ArrowUp, ArrowDown, ArrowLeft, ArrowRight
    // Space
    let dir0X = 0.0;
    let dir0Y = 0.0;
    if (keycodePressed.has("ArrowUp") || keycodePressed.has("KeyW")) {
      dir0Y += 1.0;
    }
    if (keycodePressed.has("ArrowDown") || keycodePressed.has("KeyS")) {
      dir0Y -= 1.0;
    }
    if (keycodePressed.has("ArrowLeft") || keycodePressed.has("KeyA")) {
      dir0X -= 1.0;
    }
    if (keycodePressed.has("ArrowRight") || keycodePressed.has("KeyD")) {
      dir0X += 1.0;
    }

    while (player0.timestampMs < timestampMs) {
      const [x0, y0] = getPlayerXY(player0, level);
      const [x1, y1] = getPlayerXY(player1, level);
      const dir1X = x0 - x1;
      const dir1Y = y0 - y1;
      const dir1L = Math.hypot(dir1X, dir1Y);
      player0Candidate = nextPlayerState(
        timestampMs,
        dir0X,
        dir0Y,
        kPlayer0Speed,
        player0,
        level,
      );
      player1 = nextPlayerState(
        player0Candidate.timestampMs,
        dir1X,
        dir1Y,
        kPlayer1Speed,
        player1,
        level,
      );
      player0 = nextPlayerState(
        player1.timestampMs,
        dir0X,
        dir0Y,
        kPlayer0Speed,
        player0,
        level,
      );
      updateEdgeCovs(
        level,
        player0.vertexIndex,
        player0.edgeIndex,
        player0.phi,
        kPlayer0Radius,
      );
    }
  };

  const program = createProgram(
    gl,
    kLevel01VertexShader,
    kLevel01FragmentShader,
  );

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // lookup uniforms
  const colorLocation = gl.getUniformLocation(program, "u_color");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  drawGameState = function () {
    updateGameState();
    const positions = new Float32Array((level.edges.length + 2) * 6 * 4);
    const w = 0.025;
    for (const i of level.edges.keys()) {
      const [x0, y0] = kLevel01Vertices[kLevel01Edges[i][0]];
      const [x1, y1] = kLevel01Vertices[kLevel01Edges[i][1]];
      const [c0, c1] = level.edgeCovs[i];

      const l = level.edgeLs[i];
      const lx = (x1 - x0) / l;
      const ly = (y1 - y0) / l;
      const nx = -ly;
      const ny = lx;

      positions[24 * i + 0] = x0 + nx * w;
      positions[24 * i + 1] = y0 + ny * w;
      positions[24 * i + 2] = c0;
      positions[24 * i + 3] = c1 - 1.0;

      positions[24 * i + 4] = x0 - nx * w;
      positions[24 * i + 5] = y0 - ny * w;
      positions[24 * i + 6] = c0;
      positions[24 * i + 7] = c1 - 1.0;

      positions[24 * i + 8] = x1 - nx * w;
      positions[24 * i + 9] = y1 - ny * w;
      positions[24 * i + 10] = c0 - 1.0;
      positions[24 * i + 11] = c1;

      positions[24 * i + 12] = x1 - nx * w;
      positions[24 * i + 13] = y1 - ny * w;
      positions[24 * i + 14] = c0 - 1.0;
      positions[24 * i + 15] = c1;

      positions[24 * i + 16] = x1 + nx * w;
      positions[24 * i + 17] = y1 + ny * w;
      positions[24 * i + 18] = c0 - 1.0;
      positions[24 * i + 19] = c1;

      positions[24 * i + 20] = x0 + nx * w;
      positions[24 * i + 21] = y0 + ny * w;
      positions[24 * i + 22] = c0;
      positions[24 * i + 23] = c1 - 1.0;
    }
    {
      let [x, y] = getPlayerXY(player0, level);
      const i = level.edges.length + 0;
      positions[24 * i + 0] = x - kPlayer0Radius;
      positions[24 * i + 1] = y - kPlayer0Radius;
      positions[24 * i + 2] = 1.0;
      positions[24 * i + 3] = 1.0;

      positions[24 * i + 4] = x + kPlayer0Radius;
      positions[24 * i + 5] = y - kPlayer0Radius;
      positions[24 * i + 6] = 1.0;
      positions[24 * i + 7] = 1.0;

      positions[24 * i + 8] = x + kPlayer0Radius;
      positions[24 * i + 9] = y + kPlayer0Radius;
      positions[24 * i + 10] = 1.0;
      positions[24 * i + 11] = 1.0;

      positions[24 * i + 12] = x + kPlayer0Radius;
      positions[24 * i + 13] = y + kPlayer0Radius;
      positions[24 * i + 14] = 1.0;
      positions[24 * i + 15] = 1.0;

      positions[24 * i + 16] = x - kPlayer0Radius;
      positions[24 * i + 17] = y + kPlayer0Radius;
      positions[24 * i + 18] = 1.0;
      positions[24 * i + 19] = 1.0;

      positions[24 * i + 20] = x - kPlayer0Radius;
      positions[24 * i + 21] = y - kPlayer0Radius;
      positions[24 * i + 22] = 1.0;
      positions[24 * i + 23] = 1.0;
    }
    {
      let [x, y] = getPlayerXY(player1, level);
      const i = level.edges.length + 1;
      positions[24 * i + 0] = x - kPlayer1Radius;
      positions[24 * i + 1] = y - kPlayer1Radius;
      positions[24 * i + 2] = 0.0;
      positions[24 * i + 3] = 0.0;

      positions[24 * i + 4] = x + kPlayer1Radius;
      positions[24 * i + 5] = y - kPlayer1Radius;
      positions[24 * i + 6] = 0.0;
      positions[24 * i + 7] = 0.0;

      positions[24 * i + 8] = x + kPlayer1Radius;
      positions[24 * i + 9] = y + kPlayer1Radius;
      positions[24 * i + 10] = 0.0;
      positions[24 * i + 11] = 0.0;

      positions[24 * i + 12] = x + kPlayer1Radius;
      positions[24 * i + 13] = y + kPlayer1Radius;
      positions[24 * i + 14] = 0.0;
      positions[24 * i + 15] = 0.0;

      positions[24 * i + 16] = x - kPlayer1Radius;
      positions[24 * i + 17] = y + kPlayer1Radius;
      positions[24 * i + 18] = 0.0;
      positions[24 * i + 19] = 0.0;

      positions[24 * i + 20] = x - kPlayer1Radius;
      positions[24 * i + 21] = y - kPlayer1Radius;
      positions[24 * i + 22] = 0.0;
      positions[24 * i + 23] = 0.0;
    }

    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.8, 0.8, 0.8, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    // Set Geometry.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.vertexAttribPointer(
      positionAttributeLocation,
      4,
      gl.FLOAT,
      /*normalize=*/ false,
      /*stride=*/ 0,
      /*offset=*/ 0,
    );

    // Set the matrix.
    const canvasWidth = gl.canvas.width;
    const canvasHeight = gl.canvas.height;
    const canvasMinDim = Math.min(canvasWidth, canvasHeight);
    gl.uniformMatrix3fv(
      matrixLocation,
      false,
      m3_to_webgl(
        m3_multiply(
          kLevel01Projection,
          m3_scaling(canvasMinDim / canvasWidth, canvasMinDim / canvasHeight),
        ),
      ),
    );

    // Draw in red
    gl.uniform3fv(colorLocation, [1, 0, 0]);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 4);
  };
}
