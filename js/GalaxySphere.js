import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';

const VERT = `
varying vec3 vDir;
void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform float uTime;
varying vec3 vDir;

#define PI 3.14159265358979

// ── Hashes ───────────────────────────────────────────────────────────────────
float h11(float p) {
    return fract(sin(p * 127.1) * 43758.5453);
}
float h21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

// ── Value noise ───────────────────────────────────────────────────────────────
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(h21(i),              h21(i + vec2(1,0)), f.x),
        mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x),
        f.y
    );
}

// ── FBM ──────────────────────────────────────────────────────────────────────
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
        v += a * vnoise(p);
        p  = m * p;
        a *= 0.5;
    }
    return v;
}

// ── Star layer ────────────────────────────────────────────────────────────────
float starLayer(vec2 uv, float scale, float seed) {
    vec2  cell = floor(uv * scale + seed);
    vec2  f    = fract(uv * scale + seed);
    float rnd  = h21(cell);
    if (rnd > 0.91) {
        vec2  center = vec2(h11(rnd), h11(rnd * 13.7)) * 0.7 + 0.15;
        float d      = length(f - center);
        float sz     = 0.020 + h11(rnd * 5.0) * 0.028;
        float bri    = h11(rnd * 9.3);
        float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + bri * 3.0) + rnd * 60.0);
        return smoothstep(sz, 0.0, d) * bri * twinkle;
    }
    return 0.0;
}

void main() {
    vec3 dir = normalize(vDir);

    // Spherical UV
    float theta = atan(dir.z, dir.x);
    float phi   = asin(clamp(dir.y, -1.0, 1.0));
    vec2  uv    = vec2(theta / (2.0 * PI), phi / PI);

    float t   = uTime * 0.012;
    vec2  uvA = uv + vec2(t, 0.0);

    // ── Nebula ────────────────────────────────────────────────────────────────
    float n1 = fbm(uvA * 2.2);
    float n2 = fbm(uvA * 2.2 + vec2(5.2, 1.3) + n1 * 0.6);
    float n3 = fbm(uvA * 4.0 + vec2(n2 * 0.9, n1 * 0.4));
    float cloudMask = smoothstep(0.25, 0.7, n1) * smoothstep(0.2, 0.65, n2);

    // ── Galaxy band ───────────────────────────────────────────────────────────
    float galLat   = abs(dir.y);
    float bandMask = exp(-galLat * 2.5);
    float r        = length(dir.xz);

    // Core
    float core = exp(-r * 4.5) * exp(-galLat * 6.0);

    // Spiral arms (two symmetric)
    float armAngle = theta * 2.0 + t * 0.25 - r * 9.0;
    float arms     = pow(max(0.0, sin(armAngle) * 0.5 + 0.5), 2.5)
                   * exp(-r * 2.2) * bandMask;

    // ── Build color ───────────────────────────────────────────────────────────
    vec3 col = vec3(0.0, 0.001, 0.010); // near-black space

    col += vec3(0.08, 0.02, 0.20) * n1 * 0.55;               // purple nebula
    col += vec3(0.02, 0.05, 0.25) * n2 * 0.45;               // blue nebula
    col += vec3(0.20, 0.02, 0.12) * n3 * cloudMask * 0.30;   // pink wisps
    col += vec3(0.02, 0.15, 0.18) * (n1 * n2) * 0.40;       // teal overlap

    col += vec3(0.25, 0.45, 0.95) * arms * 0.20;             // arm glow
    col += vec3(1.00, 0.82, 0.50) * core * 1.00;             // warm core

    // ── Stars ─────────────────────────────────────────────────────────────────
    float s  = starLayer(uv,  75.0,  0.00);
    s       += starLayer(uv,  50.0, 17.30) * 0.80;
    s       += starLayer(uv, 115.0,  3.70) * 0.50;
    s       += starLayer(uv,  28.0, 89.10) * 1.30; // bright sparse

    vec3 starCol = mix(vec3(0.90, 0.95, 1.00), vec3(1.00, 0.82, 0.60),
                       h21(floor(uv * 37.0)));
    col += s * starCol * 2.0;

    gl_FragColor = vec4(col, 1.0);
}
`;

export class GalaxySphere {
    constructor() {
        const geo  = new THREE.SphereGeometry(60, 64, 64);
        this._mat  = new THREE.ShaderMaterial({
            uniforms:       { uTime: { value: 0.0 } },
            vertexShader:   VERT,
            fragmentShader: FRAG,
            side:           THREE.BackSide,
            depthWrite:     false,
        });
        const mesh = new THREE.Mesh(geo, this._mat);
        mesh.renderOrder = -1;
        AppContext.scene.add(mesh);
        console.log('✅ GalaxySphere ready');
    }

    update() {
        this._mat.uniforms.uTime.value += 0.005;
    }
}
