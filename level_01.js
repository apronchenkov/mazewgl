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
  [9, 14],
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

  let lastTimestampMs = performance.now();

  const edgeCov = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];

  let player0Vertex = 0;
  let player0Edge = -1;
  let player0Phi = 0.0;

  const kPlayer0Speed = 0.01;

  const updateGameStateEdgeCase = function (timestampMs, dirX, dirY) {
    const [edgeX0, edgeY0] = kLevel01Vertices[kLevel01Edges[player0Edge][0]];
    const [edgeX1, edgeY1] = kLevel01Vertices[kLevel01Edges[player0Edge][1]];
    const edgeDirX = edgeX1 - edgeX0;
    const edgeDirY = edgeY1 - edgeY0;
    const edgeL = Math.hypot(edgeDirX, edgeDirY);
    const dir = Math.sign(dirX * edgeDirX + dirY * edgeDirY);
    if (dir == 0.0) {
      lastTimestampMs = timestampMs;
    } else if (dir > 0.0) {
      const dT = (edgeL * (1 - player0Phi)) / kPlayer0Speed;
      if (lastTimestampMs + dT < timestampMs) {
        player0Phi = 1.0;
        lastTimestampMs += dT;
      } else {
        player0Phi += ((timestampMs - lastTimestampMs) * kPlayer0Speed) / edgeL;
        lastTimestampMs = timestampMs;
      }
    } else if (dir < 0.0) {
      const dT = (edgeL * player0Phi) / kPlayer0Speed;
      if (lastTimestampMs + dT < timestampMs) {
        player0Phi = 0.0;
        lastTimestampMs += dT;
      } else {
        player0Phi -= ((timestampMs - lastTimestampMs) * kPlayer0Speed) / edgeL;
        lastTimestampMs = timestampMs;
      }
    }
    if (kLevel01Edges[player0Edge][0] == player0Vertex) {
      edgeCov[player0Edge][0] = Math.max(edgeCov[player0Edge][0], player0Phi);
    } else {
      edgeCov[player0Edge][1] = Math.max(
        edgeCov[player0Edge][1],
        1.0 - player0Phi,
      );
    }
    if (edgeCov[player0Edge][0] == 1.0) {
      edgeCov[player0Edge][1] = 1.0;
    }
    if (edgeCov[player0Edge][1] == 1.0) {
      edgeCov[player0Edge][0] = 1.0;
    }
    if (player0Phi == 0.0) {
      player0Vertex = kLevel01Edges[player0Edge][0];
      player0Edge = -1;
    } else if (player0Phi == 1.0) {
      player0Vertex = kLevel01Edges[player0Edge][1];
      player0Edge = -1;
    }
  };

  const updateGameStateVertexCase = function (timestampMs, dirX, dirY) {
    // Select best fit edge.
    let bestEdge = -1;
    let bestWeight = 0.0;
    let edgeX0, edgeX1, edgeY0, edgeY1;
    for (const i of kLevel01Edges.keys()) {
      if (kLevel01Edges[i][0] == player0Vertex) {
        [edgeX0, edgeY0] = kLevel01Vertices[kLevel01Edges[i][0]];
        [edgeX1, edgeY1] = kLevel01Vertices[kLevel01Edges[i][1]];
      } else if (kLevel01Edges[i][1] == player0Vertex) {
        [edgeX0, edgeY0] = kLevel01Vertices[kLevel01Edges[i][1]];
        [edgeX1, edgeY1] = kLevel01Vertices[kLevel01Edges[i][0]];
      } else {
        continue;
      }
      const edgeDirX = edgeX1 - edgeX0;
      const edgeDirY = edgeY1 - edgeY0;
      const weight =
        (dirX * edgeDirX + dirY * edgeDirY) / Math.hypot(edgeDirX, edgeDirY);
      if (bestWeight + kEps < weight) {
        bestWeight = weight;
        bestEdge = i;
      } else if (bestWeight < weight + kEps) {
        bestWeight = weight;
        bestEdge = -1;
      }
    }
    if (bestEdge < 0) {
      lastTimestampMs = timestampMs;
    } else {
      player0Edge = bestEdge;
      player0Phi = player0Vertex == kLevel01Edges[bestEdge][0] ? 0.0 : 1.0;
      updateGameStateEdgeCase(timestampMs, dirX, dirY);
    }
  };

  updateGameState = function () {
    const timestampMs = performance.now();
    // ArrowUp, ArrowDown, ArrowLeft, ArrowRight
    // Space
    let dirX = 0.0;
    let dirY = 0.0;
    if (keycodePressed.has("ArrowUp")) {
      dirY += 1.0;
    }
    if (keycodePressed.has("ArrowDown")) {
      dirY -= 1.0;
    }
    if (keycodePressed.has("ArrowLeft")) {
      dirX -= 1.0;
    }
    if (keycodePressed.has("ArrowRight")) {
      dirX += 1.0;
    }
    while (lastTimestampMs < timestampMs) {
      if (player0Edge < 0) {
        updateGameStateVertexCase(timestampMs, dirX, dirY);
      } else {
        updateGameStateEdgeCase(timestampMs, dirX, dirY);
      }
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
    const positions = new Float32Array(kLevel01Edges.length * 6 * 4);
    const w = 0.025;
    for (const i of kLevel01Edges.keys()) {
      const [x0, y0] = kLevel01Vertices[kLevel01Edges[i][0]];
      const [x1, y1] = kLevel01Vertices[kLevel01Edges[i][1]];
      const [c0, c1] = edgeCov[i];

      const lx = x1 - x0;
      const ly = y1 - y0;
      const l = Math.hypot(lx, ly);
      const nx = -ly / l;
      const ny = lx / l;

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
