/* ═══════════════════════════════════════════════════════════
   BACKGROUND SECTION - THREE.JS 3D PARTICLE & GEOMETRIC COSMOS
   Continuous scroll-reactive 3D space across all sections with
   organically scattered multi-dimensional geometric structures,
   cosmic particle field with real-time fluid spring physics,
   constellation network, ambient energy embers, and fast-moving
   burning asteroids creating dynamic gravity & antigravity forces.
   ═══════════════════════════════════════════════════════════ */
window.BackgroundSystem = (() => {
    let renderer, scene, camera;
    let particles, emberParticles, constellationLines;
    let particlePositions, particleBasePositions, particleVelocities;
    let emberPositions, emberBaseX, emberVelocities;
    let geoGroup;
    let floatingMeshes = [];
    let activeAsteroids = [];
    let mouseX = 0, mouseY = 0;
    let worldMouseX = 9999, worldMouseY = 9999;
    let targetCameraY = 0;
    let currentCameraY = 0;
    let animId = null;
    let clock;
    let isRunning = false;
    let isReducedMotion = false;
    let lastSpawnTime = 0;
    let nextSpawnDelay = 2.5;

    // Materials reference for theme switching
    let materials = {
        wireBlue: null,
        wireCyan: null,
        wireGold: null,
        wireEmerald: null,
        wirePurple: null,
        coreGlow: null,
        particles: null,
        embers: null,
        lines: null,
        fireCore: null,
        fireCorona: null,
        plasmaCore: null,
        plasmaCorona: null,
        bipolarCore: null,
        bipolarCorona: null
    };

    /**
     * Build Theme Materials
     */
    const createMaterials = (theme = 'dark') => {
        const isLight = theme === 'light';

        materials.wireBlue = new THREE.MeshBasicMaterial({
            color: isLight ? 0x2563eb : 0x3d8bff,
            wireframe: true,
            transparent: true,
            opacity: isLight ? 0.08 : 0.14
        });

        materials.wireCyan = new THREE.MeshBasicMaterial({
            color: isLight ? 0x0284c7 : 0x00d4ff,
            wireframe: true,
            transparent: true,
            opacity: isLight ? 0.07 : 0.13
        });

        materials.wireGold = new THREE.MeshBasicMaterial({
            color: isLight ? 0xb45309 : 0xc8a84b,
            wireframe: true,
            transparent: true,
            opacity: isLight ? 0.06 : 0.12
        });

        materials.wireEmerald = new THREE.MeshBasicMaterial({
            color: isLight ? 0x059669 : 0x34d399,
            wireframe: true,
            transparent: true,
            opacity: isLight ? 0.06 : 0.11
        });

        materials.wirePurple = new THREE.MeshBasicMaterial({
            color: isLight ? 0x7c3aed : 0xa855f7,
            wireframe: true,
            transparent: true,
            opacity: isLight ? 0.07 : 0.13
        });

        materials.coreGlow = new THREE.MeshBasicMaterial({
            color: isLight ? 0x3b82f6 : 0x00d4ff,
            wireframe: true,
            transparent: true,
            opacity: isLight ? 0.12 : 0.28
        });

        materials.lines = new THREE.LineBasicMaterial({
            color: isLight ? 0x3b82f6 : 0x3d8bff,
            transparent: true,
            opacity: isLight ? 0.04 : 0.08,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending
        });

        materials.particles = new THREE.PointsMaterial({
            size: isLight ? 0.12 : 0.15,
            vertexColors: true,
            transparent: true,
            opacity: isLight ? 0.45 : 0.80,
            sizeAttenuation: true,
            depthWrite: false,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending
        });

        materials.embers = new THREE.PointsMaterial({
            size: isLight ? 0.20 : 0.26,
            vertexColors: true,
            transparent: true,
            opacity: isLight ? 0.38 : 0.75,
            sizeAttenuation: true,
            depthWrite: false,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending
        });

        // Asteroid Core Materials (High-luminance emissive heads)
        materials.fireCore = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: false
        });
        materials.fireCorona = new THREE.MeshBasicMaterial({
            color: isLight ? 0xea580c : 0xff6600,
            transparent: true,
            opacity: isLight ? 0.75 : 0.88,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
            depthWrite: false
        });

        materials.plasmaCore = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: false
        });
        materials.plasmaCorona = new THREE.MeshBasicMaterial({
            color: isLight ? 0x0284c7 : 0x00f0ff,
            transparent: true,
            opacity: isLight ? 0.75 : 0.90,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
            depthWrite: false
        });

        materials.bipolarCore = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: false
        });
        materials.bipolarCorona = new THREE.MeshBasicMaterial({
            color: isLight ? 0xb45309 : 0xffbe1a,
            transparent: true,
            opacity: isLight ? 0.75 : 0.88,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
            depthWrite: false
        });
    };

    /**
     * Build Main Particle Cosmos with Fluid Elastic Physics
     */
    const createCosmicParticles = () => {
        const count = window.innerWidth < 768 ? 1000 : 2200;
        particlePositions = new Float32Array(count * 3);
        particleBasePositions = new Float32Array(count * 3);
        particleVelocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const palette = [
            new THREE.Color('#3d8bff'), // Electric Blue
            new THREE.Color('#00d4ff'), // Cyan
            new THREE.Color('#c8a84b'), // Gold
            new THREE.Color('#34d399'), // Emerald
            new THREE.Color('#a855f7')  // Amethyst
        ];

        // Distribute in a rich 3D cosmic volume across all sections (Y: +30 to -145, full horizontal & depth spread)
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const y = (Math.random() * 175) - 145; // from +30 down to -145
            const radius = 4 + Math.random() * 42;
            const angle = Math.random() * Math.PI * 2;
            const zSpread = (Math.random() - 0.5) * 44;

            const px = radius * Math.cos(angle);
            const py = y;
            const pz = (radius * Math.sin(angle) * 0.48) + zSpread - 8;

            particlePositions[i3] = px;
            particlePositions[i3 + 1] = py;
            particlePositions[i3 + 2] = pz;

            particleBasePositions[i3] = px;
            particleBasePositions[i3 + 1] = py;
            particleBasePositions[i3 + 2] = pz;

            particleVelocities[i3] = 0;
            particleVelocities[i3 + 1] = 0;
            particleVelocities[i3 + 2] = 0;

            const c = palette[i % palette.length].clone().lerp(
                palette[(i + 1) % palette.length],
                Math.random() * 0.45
            );

            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;

            sizes[i] = Math.random() * 1.6 + 0.4;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        particles = new THREE.Points(geo, materials.particles);
        scene.add(particles);
    };

    /**
     * Build Upward-Drifting Ambient Embers
     */
    const createAmbientEmbers = () => {
        const count = window.innerWidth < 768 ? 90 : 220;
        emberPositions = new Float32Array(count * 3);
        emberBaseX = new Float32Array(count);
        emberVelocities = [];
        const colors = new Float32Array(count * 3);

        const emberColors = [
            new THREE.Color('#00d4ff'),
            new THREE.Color('#3d8bff'),
            new THREE.Color('#c8a84b'),
            new THREE.Color('#ff8c38')
        ];

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const x = (Math.random() - 0.5) * 64;
            const y = (Math.random() * 175) - 145;
            const z = (Math.random() - 0.5) * 28 - 6;

            emberPositions[i3] = x;
            emberPositions[i3 + 1] = y;
            emberPositions[i3 + 2] = z;
            emberBaseX[i] = x;

            const c = emberColors[i % emberColors.length];
            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;

            emberVelocities.push({
                speedY: 0.045 + Math.random() * 0.075,
                swaySpeed: 0.8 + Math.random() * 1.2,
                swayAmp: 0.04 + Math.random() * 0.06,
                phase: Math.random() * Math.PI * 2,
                impulseX: 0,
                impulseY: 0,
                impulseZ: 0
            });
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        emberParticles = new THREE.Points(geo, materials.embers);
        scene.add(emberParticles);
    };

    /**
     * Build Constellation Network (3D Graph connecting nearby cosmic nodes)
     */
    const createConstellationNetwork = () => {
        const nodeCount = 46;
        const nodePositions = [];
        const linePositions = [];

        // Distribute nodes randomly across the vertical cosmic column
        for (let i = 0; i < nodeCount; i++) {
            const y = 20 - (i * 3.3) + (Math.random() * 2.5 - 1.25);
            const x = (Math.random() - 0.5) * 44;
            const z = (Math.random() - 0.5) * 24 - 8;
            nodePositions.push(new THREE.Vector3(x, y, z));
        }

        // Connect nodes within distance threshold
        const maxDist = 15;
        for (let i = 0; i < nodePositions.length; i++) {
            for (let j = i + 1; j < nodePositions.length; j++) {
                const dist = nodePositions[i].distanceTo(nodePositions[j]);
                if (dist < maxDist) {
                    linePositions.push(
                        nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
                        nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
                    );
                }
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

        const lines = new THREE.LineSegments(geo, materials.lines);
        lines.userData.nodes = nodePositions;
        scene.add(lines);
        constellationLines = lines;
    };

    /**
     * Build Rich Floating Geometries Scattered Completely Across the Whole Page
     * (Eliminates parallel lines: scattered across full X: -28 to +29, Z: -22 to +4, Y: +24 to -135)
     */
    const createFloatingGeometries = () => {
        geoGroup = new THREE.Group();
        scene.add(geoGroup);
        floatingMeshes = [];

        const getMat = (key) => {
            switch (key) {
                case 'cyan': return materials.wireCyan;
                case 'gold': return materials.wireGold;
                case 'emerald': return materials.wireEmerald;
                case 'purple': return materials.wirePurple;
                default: return materials.wireBlue;
            }
        };

        // Complete scattered constellation across the entire page (wide X coverage, staggered Y, multi-depth Z)
        const shapeConfigs = [
            // ── Section 0: Hero & Intro (Y: +26 to 0) ──
            { type: 'icosahedron', args: [3.2, 1], mat: 'blue', x: -24, y: 22, z: -12, rot: [0.06, 0.09, 0.04], float: [0.6, 0.8, 0.1] },
            { type: 'dodecahedron', args: [2.5, 0], mat: 'gold', x: 7, y: 18, z: -22, rot: [0.08, 0.05, 0.07], float: [0.5, 0.7, 1.4] }, // Deep center background
            { type: 'torusOrbit', args: [3.8, 0.07, 16, 64], mat: 'cyan', x: 26, y: 14, z: -8, rot: [0.09, 0.07, 0.08], float: [0.6, 0.9, 2.3], nested: [2.5, 0.07, 16, 48, 'blue'] },
            { type: 'octahedron', args: [2.4, 0], mat: 'emerald', x: -10, y: 10, z: -7, rot: [0.07, 0.11, 0.05], float: [0.7, 0.8, 0.8] },
            { type: 'torusKnot', args: [2.5, 0.52, 60, 12, 2, 3], mat: 'blue', x: 18, y: 6, z: -14, rot: [0.08, 0.10, 0.06], float: [0.5, 0.7, 1.9] },
            { type: 'tetrahedron', args: [2.3, 0], mat: 'gold', x: -28, y: 2, z: 2, rot: [0.10, 0.08, 0.09], float: [0.8, 0.9, 0.4] }, // Foreground floater

            // ── Section 1: The Architect / About (Y: -2 to -26) ──
            { type: 'boxInBox', args: [2.8, 2.8, 2.8], mat: 'cyan', x: -4, y: -2, z: -18, rot: [0.05, 0.07, 0.06], float: [0.6, 0.7, 2.7], inner: [1.6, 1.6, 1.6, 'gold'] }, // Deep center
            { type: 'icosahedron', args: [3.0, 0], mat: 'emerald', x: 29, y: -6, z: -10, rot: [0.07, 0.08, 0.05], float: [0.7, 0.8, 1.1] },
            { type: 'torusOrbit', args: [3.4, 0.06, 16, 48], mat: 'gold', x: -18, y: -10, z: -9, rot: [0.08, 0.06, 0.09], float: [0.6, 0.7, 3.1], nested: [2.2, 0.06, 16, 32, 'cyan'] },
            { type: 'octahedron', args: [2.6, 0], mat: 'blue', x: 12, y: -14, z: -6, rot: [0.09, 0.12, 0.04], float: [0.5, 0.8, 0.6] },
            { type: 'dodecahedron', args: [2.7, 0], mat: 'purple', x: -25, y: -18, z: -15, rot: [0.06, 0.09, 0.07], float: [0.7, 0.8, 1.7] },
            { type: 'tetrahedron', args: [2.2, 0], mat: 'gold', x: 3, y: -21, z: -20, rot: [0.08, 0.07, 0.10], float: [0.5, 0.6, 2.5] }, // Deep center
            { type: 'boxInBox', args: [3.0, 3.0, 3.0], mat: 'blue', x: 22, y: -25, z: -8, rot: [0.07, 0.08, 0.05], float: [0.6, 0.7, 0.9], inner: [1.8, 1.8, 1.8, 'cyan'] },

            // ── Section 2: Technical Arsenal (Y: -28 to -50) ──
            { type: 'torusKnot', args: [2.6, 0.55, 64, 14, 2, 3], mat: 'emerald', x: -12, y: -28, z: -11, rot: [0.08, 0.11, 0.06], float: [0.7, 0.8, 2.2] },
            { type: 'octahedron', args: [2.8, 0], mat: 'cyan', x: 28, y: -32, z: 3, rot: [0.11, 0.07, 0.08], float: [0.8, 0.9, 0.5] }, // Foreground floater
            { type: 'icosahedron', args: [3.2, 1], mat: 'gold', x: -22, y: -36, z: -7, rot: [0.06, 0.10, 0.05], float: [0.5, 0.7, 1.5] },
            { type: 'torusOrbit', args: [3.6, 0.07, 16, 48], mat: 'blue', x: -5, y: -39, z: -19, rot: [0.09, 0.08, 0.07], float: [0.6, 0.8, 2.9], nested: [2.3, 0.07, 16, 32, 'purple'] }, // Deep center
            { type: 'tetrahedron', args: [2.4, 0], mat: 'emerald', x: 16, y: -43, z: -12, rot: [0.08, 0.09, 0.06], float: [0.7, 0.6, 1.3] },
            { type: 'boxInBox', args: [2.8, 2.8, 2.8], mat: 'gold', x: -27, y: -47, z: -14, rot: [0.05, 0.07, 0.08], float: [0.6, 0.8, 0.7], inner: [1.7, 1.7, 1.7, 'emerald'] },
            { type: 'dodecahedron', args: [2.6, 0], mat: 'blue', x: 8, y: -50, z: -8, rot: [0.07, 0.11, 0.04], float: [0.5, 0.7, 2.0] },

            // ── Section 3: Project Portfolio (Y: -52 to -74) ──
            { type: 'torusKnot', args: [2.4, 0.48, 54, 10, 3, 4], mat: 'cyan', x: 25, y: -54, z: -16, rot: [0.09, 0.08, 0.11], float: [0.7, 0.9, 1.2] },
            { type: 'octahedron', args: [2.6, 0], mat: 'purple', x: -15, y: -57, z: -6, rot: [0.08, 0.12, 0.05], float: [0.6, 0.8, 2.8] },
            { type: 'icosahedron', args: [2.8, 0], mat: 'emerald', x: 2, y: -61, z: -21, rot: [0.06, 0.08, 0.07], float: [0.5, 0.7, 0.3] }, // Deep center
            { type: 'torusOrbit', args: [3.9, 0.07, 16, 64], mat: 'gold', x: -28, y: -65, z: 4, rot: [0.08, 0.07, 0.09], float: [0.7, 0.9, 2.1], nested: [2.5, 0.07, 16, 48, 'blue'] }, // Foreground floater
            { type: 'tetrahedron', args: [2.3, 0], mat: 'blue', x: 19, y: -68, z: -10, rot: [0.10, 0.08, 0.06], float: [0.6, 0.7, 1.6] },
            { type: 'boxInBox', args: [3.2, 3.2, 3.2], mat: 'cyan', x: -9, y: -72, z: -13, rot: [0.07, 0.09, 0.05], float: [0.8, 0.8, 3.2], inner: [2.0, 2.0, 2.0, 'blue'] },

            // ── Section 4: Experience Journey (Y: -76 to -96) ──
            { type: 'dodecahedron', args: [2.8, 0], mat: 'gold', x: 27, y: -76, z: -12, rot: [0.06, 0.10, 0.08], float: [0.6, 0.8, 0.8] },
            { type: 'torusKnot', args: [2.7, 0.52, 60, 12, 2, 3], mat: 'purple', x: -21, y: -80, z: -8, rot: [0.09, 0.07, 0.10], float: [0.7, 0.9, 2.4] },
            { type: 'octahedron', args: [2.7, 0], mat: 'blue', x: 6, y: -83, z: -18, rot: [0.08, 0.11, 0.04], float: [0.5, 0.7, 1.0] }, // Deep center
            { type: 'tetrahedron', args: [2.4, 0], mat: 'gold', x: -14, y: -87, z: -15, rot: [0.07, 0.08, 0.09], float: [0.6, 0.7, 2.7] },
            { type: 'torusOrbit', args: [3.7, 0.07, 16, 54], mat: 'emerald', x: 23, y: -90, z: -7, rot: [0.08, 0.09, 0.06], float: [0.7, 0.8, 0.2], nested: [2.4, 0.07, 16, 36, 'cyan'] },
            { type: 'icosahedron', args: [3.1, 1], mat: 'blue', x: -26, y: -94, z: -11, rot: [0.06, 0.11, 0.07], float: [0.6, 0.7, 1.8] },

            // ── Section 5: Credentials & Client Reviews (Y: -97 to -115) ──
            { type: 'boxInBox', args: [2.7, 2.7, 2.7], mat: 'purple', x: -3, y: -97, z: -22, rot: [0.07, 0.06, 0.08], float: [0.5, 0.7, 3.0], inner: [1.6, 1.6, 1.6, 'gold'] }, // Deep center
            { type: 'octahedron', args: [2.5, 0], mat: 'cyan', x: 15, y: -101, z: -9, rot: [0.09, 0.08, 0.05], float: [0.6, 0.8, 1.4] },
            { type: 'dodecahedron', args: [2.6, 0], mat: 'emerald', x: -18, y: -105, z: 3, rot: [0.07, 0.09, 0.06], float: [0.8, 0.9, 0.6] }, // Foreground floater
            { type: 'torusKnot', args: [2.5, 0.49, 58, 12, 2, 3], mat: 'gold', x: 28, y: -108, z: -14, rot: [0.08, 0.10, 0.07], float: [0.6, 0.8, 2.3] },
            { type: 'tetrahedron', args: [2.3, 0], mat: 'blue', x: -11, y: -112, z: -8, rot: [0.10, 0.07, 0.09], float: [0.5, 0.7, 1.9] },

            // ── Section 6: Contact & Cosmic Footer (Y: -116 to -135) ──
            { type: 'icosahedron', args: [2.9, 1], mat: 'cyan', x: 8, y: -116, z: -17, rot: [0.06, 0.09, 0.05], float: [0.6, 0.7, 0.9] }, // Deep center
            { type: 'torusOrbit', args: [3.6, 0.08, 16, 48], mat: 'blue', x: 24, y: -120, z: -10, rot: [0.08, 0.07, 0.09], float: [0.7, 0.8, 2.5], nested: [2.2, 0.08, 16, 32, 'gold'] },
            { type: 'octahedron', args: [2.6, 0], mat: 'emerald', x: -24, y: -124, z: -13, rot: [0.09, 0.11, 0.06], float: [0.6, 0.8, 1.2] },
            { type: 'dodecahedron', args: [2.7, 0], mat: 'gold', x: -5, y: -128, z: -20, rot: [0.07, 0.08, 0.06], float: [0.5, 0.7, 3.1] }, // Deep center
            { type: 'boxInBox', args: [2.8, 2.8, 2.8], mat: 'blue', x: 17, y: -132, z: -8, rot: [0.08, 0.09, 0.07], float: [0.6, 0.7, 1.5], inner: [1.6, 1.6, 1.6, 'cyan'] }
        ];

        shapeConfigs.forEach((cfg, idx) => {
            let mesh;
            const primaryMat = getMat(cfg.mat);

            if (cfg.type === 'torusKnot') {
                const geo = new THREE.TorusKnotGeometry(...cfg.args);
                mesh = new THREE.Mesh(geo, primaryMat);
            } else if (cfg.type === 'icosahedron') {
                const geo = new THREE.IcosahedronGeometry(...cfg.args);
                mesh = new THREE.Mesh(geo, primaryMat);
            } else if (cfg.type === 'octahedron') {
                const geo = new THREE.OctahedronGeometry(...cfg.args);
                mesh = new THREE.Mesh(geo, primaryMat);
            } else if (cfg.type === 'dodecahedron') {
                const geo = new THREE.DodecahedronGeometry(...cfg.args);
                mesh = new THREE.Mesh(geo, primaryMat);
            } else if (cfg.type === 'tetrahedron') {
                const geo = new THREE.TetrahedronGeometry(...cfg.args);
                mesh = new THREE.Mesh(geo, primaryMat);
            } else if (cfg.type === 'torusOrbit') {
                mesh = new THREE.Group();
                const outer = new THREE.Mesh(new THREE.TorusGeometry(...cfg.args), primaryMat);
                mesh.add(outer);
                if (cfg.nested) {
                    const nestedMat = getMat(cfg.nested[4]);
                    const inner = new THREE.Mesh(
                        new THREE.TorusGeometry(cfg.nested[0], cfg.nested[1], cfg.nested[2], cfg.nested[3]),
                        nestedMat
                    );
                    inner.rotation.x = Math.PI * 0.35;
                    inner.rotation.y = Math.PI * 0.25;
                    mesh.add(inner);
                    mesh.userData.inner = inner;
                }
            } else if (cfg.type === 'boxInBox') {
                mesh = new THREE.Group();
                const outer = new THREE.Mesh(new THREE.BoxGeometry(...cfg.args), primaryMat);
                mesh.add(outer);
                if (cfg.inner) {
                    const innerMat = getMat(cfg.inner[3]);
                    const inner = new THREE.Mesh(
                        new THREE.BoxGeometry(cfg.inner[0], cfg.inner[1], cfg.inner[2]),
                        innerMat
                    );
                    mesh.add(inner);
                    mesh.userData.inner = inner;
                }
            } else {
                mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 0), primaryMat);
            }

            mesh.position.set(cfg.x, cfg.y, cfg.z);
            mesh.userData.baseX = cfg.x;
            mesh.userData.baseY = cfg.y;
            mesh.userData.baseZ = cfg.z;
            mesh.userData.rotX = cfg.rot[0];
            mesh.userData.rotY = cfg.rot[1];
            mesh.userData.rotZ = cfg.rot[2];
            mesh.userData.floatSpeed = cfg.float[0];
            mesh.userData.floatAmp = cfg.float[1];
            mesh.userData.phase = cfg.float[2] || (idx * 0.55);

            // Dynamic kinetic impulse fields (for asteroid gravity/antigravity turbulence)
            mesh.userData.wobbleX = 0;
            mesh.userData.wobbleY = 0;
            mesh.userData.wobbleZ = 0;
            mesh.userData.spinBoost = 0;

            geoGroup.add(mesh);
            floatingMeshes.push(mesh);
        });
    };

    /* ═══════════════════════════════════════════════════════════
       BURNING ASTEROIDS SYSTEM (GRAVITY & ANTIGRAVITY ENGINE)
       Fast-moving fiery meteoroids and plasma bolides that roar
       through 3D space, leaving blazing ember wakes and generating
       intense physical gravity & antigravity tidal forces.
       ═══════════════════════════════════════════════════════════ */
    const spawnAsteroid = () => {
        if (!scene || isReducedMotion) return;

        // Asteroid type: 'gravity' (Solar Fire Meteorite), 'antigravity' (Quantum Plasma Bolide), or 'bipolar' (Bow Shock & Slipstream)
        const randType = Math.random();
        let type = 'gravity';
        if (randType < 0.45) type = 'gravity';
        else if (randType < 0.90) type = 'antigravity';
        else type = 'bipolar';

        // Camera context: spawn in active viewport altitude
        const spawnCenterY = currentCameraY + (Math.random() - 0.5) * 30;

        // Trajectory generation (random sides, steep diagonal cuts across the screen)
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? (-46 - Math.random() * 8) : (46 + Math.random() * 8);
        const targetX = fromLeft ? (48 + Math.random() * 10) : (-48 - Math.random() * 10);

        const startY = spawnCenterY + (Math.random() - 0.5) * 26;
        const targetY = startY + ((Math.random() - 0.5) * 34) - (Math.random() * 12); // Slanted downward streak

        const startZ = (Math.random() - 0.5) * 22 - 4; // Midground to near foreground
        const targetZ = startZ + (Math.random() - 0.5) * 16;

        const startPos = new THREE.Vector3(startX, startY, startZ);
        const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

        const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
        const speed = 42 + Math.random() * 24; // High velocity hypersonic streak (42 - 66 units/sec)
        const velocity = dir.clone().multiplyScalar(speed);

        // Core visual group
        const asteroidGroup = new THREE.Group();
        asteroidGroup.position.copy(startPos);

        let coreMat = materials.fireCore;
        let coronaMat = materials.fireCorona;
        let lightColor = 0xff6b10;
        let lightIntensity = 2.0;
        let forceStrength = 320; // Gravity pull or antigravity push magnitude
        let forceRadius = 24;   // Radius of physical space disturbance

        if (type === 'antigravity') {
            coreMat = materials.plasmaCore;
            coronaMat = materials.plasmaCorona;
            lightColor = 0x00f0ff;
            lightIntensity = 2.2;
            forceStrength = 360;
            forceRadius = 26;
        } else if (type === 'bipolar') {
            coreMat = materials.bipolarCore;
            coronaMat = materials.bipolarCorona;
            lightColor = 0xffb800;
            lightIntensity = 2.4;
            forceStrength = 340;
            forceRadius = 25;
        }

        // 1. Incandescent Asteroid Core
        const coreGeo = new THREE.DodecahedronGeometry(0.48, 0);
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        asteroidGroup.add(coreMesh);

        // 2. Burning Fiery Atmosphere / Plasma Corona
        const coronaGeo = new THREE.SphereGeometry(0.85, 12, 12);
        const coronaMesh = new THREE.Mesh(coronaGeo, coronaCoronaMatClone(coronaMat));
        asteroidGroup.add(coronaMesh);

        // 3. Dynamic Point Light casting real-time cosmic illumination on nearby wireframes
        const light = new THREE.PointLight(lightColor, lightIntensity, 32, 2);
        asteroidGroup.add(light);

        scene.add(asteroidGroup);

        // 4. Burning Spark Tail & Jet Wake System
        const trailSparkCount = 48;
        const trailPositions = new Float32Array(trailSparkCount * 3);
        const trailColors = new Float32Array(trailSparkCount * 3);
        const trailSizes = new Float32Array(trailSparkCount);
        const sparkData = [];

        for (let i = 0; i < trailSparkCount; i++) {
            const i3 = i * 3;
            trailPositions[i3] = startPos.x;
            trailPositions[i3 + 1] = startPos.y;
            trailPositions[i3 + 2] = startPos.z;
            trailColors[i3] = 1;
            trailColors[i3 + 1] = 0.5;
            trailColors[i3 + 2] = 0.1;
            trailSizes[i] = 0;

            sparkData.push({
                x: startPos.x,
                y: startPos.y,
                z: startPos.z,
                vx: 0,
                vy: 0,
                vz: 0,
                life: 0,
                maxLife: 0.35 + Math.random() * 0.45,
                size: 0.25 + Math.random() * 0.35,
                active: false
            });
        }

        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
        trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

        const trailMat = new THREE.PointsMaterial({
            size: 0.28,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const trailPoints = new THREE.Points(trailGeo, trailMat);
        scene.add(trailPoints);

        const asteroidInstance = {
            id: Math.random(),
            group: asteroidGroup,
            coronaMesh,
            light,
            trailPoints,
            trailGeo,
            trailMat,
            trailPositions,
            trailColors,
            trailSizes,
            sparkData,
            pos: startPos.clone(),
            vel: velocity,
            dir,
            speed,
            type,
            forceStrength,
            forceRadius,
            radiusSq: forceRadius * forceRadius,
            alive: true,
            age: 0,
            sparkSpawnCursor: 0
        };

        activeAsteroids.push(asteroidInstance);
    };

    /**
     * Helper to clone material for independent corona pulsing
     */
    const coronaCoronaMatClone = (baseMat) => {
        return new THREE.MeshBasicMaterial({
            color: baseMat.color,
            transparent: true,
            opacity: baseMat.opacity,
            blending: baseMat.blending,
            depthWrite: false
        });
    };

    /**
     * Update Asteroid Positions, Burning Sparks Trail, & Lifecycle
     */
    const updateAsteroids = (dt, elapsed) => {
        for (let a = activeAsteroids.length - 1; a >= 0; a--) {
            const ast = activeAsteroids[a];
            ast.age += dt;

            // Advance asteroid head
            ast.pos.addScaledVector(ast.vel, dt);
            ast.group.position.copy(ast.pos);

            // Rapid tumbling of the burning core
            ast.group.rotation.x += dt * 14;
            ast.group.rotation.y += dt * 18;

            // Corona thermal breathing pulse
            const pulse = 1.0 + Math.sin(elapsed * 24 + ast.id * 10) * 0.18;
            ast.coronaMesh.scale.set(pulse, pulse, pulse);

            // Emit new fiery spark particles into the trail wake
            const sparksToEmit = 4;
            for (let s = 0; s < sparksToEmit; s++) {
                const sp = ast.sparkData[ast.sparkSpawnCursor];
                sp.active = true;
                sp.life = 0;
                // Emit slightly behind head with turbulent dispersion
                const jitter = 0.35;
                sp.x = ast.pos.x + (Math.random() - 0.5) * jitter;
                sp.y = ast.pos.y + (Math.random() - 0.5) * jitter;
                sp.z = ast.pos.z + (Math.random() - 0.5) * jitter;

                // Trail spark velocity: negative asteroid velocity + outward thermal scatter
                sp.vx = -ast.dir.x * (ast.speed * 0.12) + (Math.random() - 0.5) * 4.5;
                sp.vy = -ast.dir.y * (ast.speed * 0.12) + (Math.random() - 0.5) * 4.5;
                sp.vz = -ast.dir.z * (ast.speed * 0.12) + (Math.random() - 0.5) * 4.5;

                ast.sparkSpawnCursor = (ast.sparkSpawnCursor + 1) % ast.sparkData.length;
            }

            // Update spark trail positions, colors, & burn stages
            let anySparkActive = false;
            for (let i = 0; i < ast.sparkData.length; i++) {
                const sp = ast.sparkData[i];
                const i3 = i * 3;

                if (sp.active) {
                    sp.life += dt;
                    if (sp.life >= sp.maxLife) {
                        sp.active = false;
                        ast.trailSizes[i] = 0;
                        continue;
                    }

                    anySparkActive = true;
                    // Spark motion with drag
                    sp.x += sp.vx * dt;
                    sp.y += sp.vy * dt;
                    sp.z += sp.vz * dt;
                    sp.vx *= 0.94;
                    sp.vy *= 0.94;
                    sp.vz *= 0.94;

                    ast.trailPositions[i3] = sp.x;
                    ast.trailPositions[i3 + 1] = sp.y;
                    ast.trailPositions[i3 + 2] = sp.z;

                    const lifeRatio = sp.life / sp.maxLife;
                    ast.trailSizes[i] = sp.size * (1 - lifeRatio);

                    // Dynamic color burning gradient
                    if (ast.type === 'antigravity') {
                        // White-hot -> Electric Cyan -> Cosmic Amethyst -> Deep Space Violet
                        if (lifeRatio < 0.3) {
                            ast.trailColors[i3] = 0.95;
                            ast.trailColors[i3 + 1] = 1.0;
                            ast.trailColors[i3 + 2] = 1.0;
                        } else if (lifeRatio < 0.7) {
                            ast.trailColors[i3] = 0.0;
                            ast.trailColors[i3 + 1] = 0.85;
                            ast.trailColors[i3 + 2] = 1.0;
                        } else {
                            ast.trailColors[i3] = 0.65;
                            ast.trailColors[i3 + 1] = 0.2;
                            ast.trailColors[i3 + 2] = 0.95;
                        }
                    } else {
                        // White-hot -> Solar Yellow -> Blazing Molten Orange -> Crimson Ember
                        if (lifeRatio < 0.25) {
                            ast.trailColors[i3] = 1.0;
                            ast.trailColors[i3 + 1] = 0.98;
                            ast.trailColors[i3 + 2] = 0.8;
                        } else if (lifeRatio < 0.6) {
                            ast.trailColors[i3] = 1.0;
                            ast.trailColors[i3 + 1] = 0.45;
                            ast.trailColors[i3 + 2] = 0.05;
                        } else {
                            ast.trailColors[i3] = 0.9;
                            ast.trailColors[i3 + 1] = 0.12;
                            ast.trailColors[i3 + 2] = 0.05;
                        }
                    }
                } else {
                    ast.trailSizes[i] = 0;
                }
            }

            ast.trailGeo.attributes.position.needsUpdate = true;
            ast.trailGeo.attributes.color.needsUpdate = true;
            ast.trailGeo.attributes.size.needsUpdate = true;

            // Check if asteroid has traversed beyond the viewport boundary
            const outOfBounds = Math.abs(ast.pos.x) > 58 ||
                Math.abs(ast.pos.y - currentCameraY) > 52 ||
                ast.age > 3.2;

            if (outOfBounds) {
                ast.alive = false;
                ast.group.visible = false;
                // Fade trail points
                ast.trailMat.opacity *= 0.88;
                if (!anySparkActive || ast.trailMat.opacity < 0.05) {
                    // Clean up Three.js objects cleanly
                    scene.remove(ast.group);
                    scene.remove(ast.trailPoints);
                    ast.trailGeo.dispose();
                    ast.trailMat.dispose();
                    activeAsteroids.splice(a, 1);
                }
            }
        }
    };

    /**
     * Mouse Movement & Parallax Tracking
     */
    const setupInteractions = () => {
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

            // Map screen mouse coordinates to 3D world space at camera plane
            worldMouseX = mouseX * 28;
            worldMouseY = currentCameraY + (-mouseY * 18);
        }, { passive: true });

        // Scroll Tracking: smoothly syncs 3D camera with page scroll
        let cachedDocHeight = 1;
        const updateDocHeight = () => {
            cachedDocHeight = Math.max(
                document.documentElement.scrollHeight - window.innerHeight,
                1
            );
        };

        const updateScroll = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            const progress = Math.min(Math.max(scrollY / cachedDocHeight, 0), 1);
            // Translate camera down through the 3D scene from 0 to -115
            targetCameraY = -progress * 115;
        };

        updateDocHeight();
        window.addEventListener('scroll', updateScroll, { passive: true });
        updateScroll();

        // Responsive resize
        window.addEventListener('resize', () => {
            onResize();
            updateDocHeight();
            updateScroll();
        }, { passive: true });

        // Visibility handling (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pause();
            } else {
                resume();
            }
        });
    };

    /**
     * Window Resize Handler
     */
    const onResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    /**
     * Main Physics & Render Loop
     */
    const animate = () => {
        if (!isRunning) return;
        animId = requestAnimationFrame(animate);

        const delta = clock ? clock.getDelta() : 0.016;
        const dt = Math.min(delta, 0.05);
        const elapsed = clock ? clock.getElapsedTime() : 0;

        // Smooth Camera Drift: Lerp Y towards scroll target, X towards mouse parallax
        currentCameraY += (targetCameraY - currentCameraY) * 0.12;
        camera.position.y = currentCameraY + (-mouseY * 1.6);
        camera.position.x += (mouseX * 3.2 - camera.position.x) * 0.045;
        camera.lookAt(camera.position.x * 0.25, currentCameraY, 0);

        // Update 3D World Mouse coordinates
        worldMouseX = camera.position.x + (mouseX * 24);
        worldMouseY = currentCameraY + (-mouseY * 16);

        // ── Asteroid Random Spawner ──
        if (elapsed - lastSpawnTime > nextSpawnDelay && activeAsteroids.length < 3) {
            spawnAsteroid();
            lastSpawnTime = elapsed;
            // 25% chance of a twin follower shortly after, otherwise 2.8s to 6.2s delay
            nextSpawnDelay = (Math.random() < 0.25) ? (0.45 + Math.random() * 0.5) : (2.8 + Math.random() * 3.4);
        }

        // Update Active Burning Asteroids
        updateAsteroids(dt, elapsed);

        // ═══════════════════════════════════════════════════════════
        // REAL PHYSICAL GRAVITY & ANTIGRAVITY ENGINE FOR PARTICLES
        // ═══════════════════════════════════════════════════════════
        if (particles && particlePositions && particleVelocities) {
            const count = particlePositions.length / 3;
            const mouseRadiusSq = 14 * 14;
            const mouseForce = 3.6;
            const springK = 0.045; // Elastic return to resting cosmic orbit
            const dampingFactor = Math.pow(0.92, dt * 60); // Celestial fluid viscosity

            const activeAstCount = activeAsteroids.length;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                let px = particlePositions[i3];
                let py = particlePositions[i3 + 1];
                let pz = particlePositions[i3 + 2];

                let vx = particleVelocities[i3];
                let vy = particleVelocities[i3 + 1];
                let vz = particleVelocities[i3 + 2];

                // 1. ASTEROID GRAVITATIONAL & ANTIGRAVITATIONAL PHYSICAL INTERACTION
                if (activeAstCount > 0) {
                    for (let a = 0; a < activeAstCount; a++) {
                        const ast = activeAsteroids[a];
                        if (!ast.alive) continue;

                        const dx = px - ast.pos.x;
                        const dy = py - ast.pos.y;
                        const dz = pz - ast.pos.z;
                        const distSq = dx * dx + dy * dy + dz * dz;

                        if (distSq < ast.radiusSq && distSq > 0.05) {
                            const dist = Math.sqrt(distSq);
                            const normX = dx / dist;
                            const normY = dy / dist;
                            const normZ = dz / dist;

                            // Smooth inverse-distance falloff wave
                            const proximity = 1.0 - (dist / ast.forceRadius);
                            const forceMagnitude = proximity * proximity * ast.forceStrength * dt;

                            if (ast.type === 'antigravity') {
                                // ANTIGRAVITY FORCE: Violent repulsive shockwave blasting particles outward
                                vx += normX * forceMagnitude * 1.15;
                                vy += normY * forceMagnitude * 1.15;
                                vz += normZ * forceMagnitude * 1.15;
                            } else if (ast.type === 'gravity') {
                                // GRAVITY FORCE: Massive gravitational pull sucking particles into the vortex wake
                                vx -= normX * forceMagnitude;
                                vy -= normY * forceMagnitude;
                                vz -= normZ * forceMagnitude;
                            } else {
                                // BIPOLAR: Repulsive bow-shock wave in front + gravitational vacuum suction behind
                                const dotVel = normX * ast.dir.x + normY * ast.dir.y + normZ * ast.dir.z;
                                if (dotVel < 0) {
                                    // Ahead of asteroid: antigravity bow-wave repulsion
                                    vx += normX * forceMagnitude * 1.2;
                                    vy += normY * forceMagnitude * 1.2;
                                    vz += normZ * forceMagnitude * 1.2;
                                } else {
                                    // Behind asteroid: gravitational slipstream suction
                                    vx -= normX * forceMagnitude * 0.95;
                                    vy -= normY * forceMagnitude * 0.95;
                                    vz -= normZ * forceMagnitude * 0.95;
                                }
                            }
                        }
                    }
                }

                // 2. MOUSE CURSOR PARTICLES REPULSION
                const mDx = px - worldMouseX;
                const mDy = py - worldMouseY;
                const mDistSq = mDx * mDx + mDy * mDy;
                if (mDistSq < mouseRadiusSq && mDistSq > 0.1) {
                    const mDist = Math.sqrt(mDistSq);
                    const mNormX = mDx / mDist;
                    const mNormY = mDy / mDist;
                    const mForce = (1.0 - mDist / 14) * mouseForce * dt * 45;
                    vx += mNormX * mForce;
                    vy += mNormY * mForce;
                }

                // 3. ELASTIC SPRING RETURN TO RESTING MATRIX
                const ox = particleBasePositions[i3];
                const oy = particleBasePositions[i3 + 1];
                const oz = particleBasePositions[i3 + 2];

                vx += (ox - px) * springK * dt * 60;
                vy += (oy - py) * springK * dt * 60;
                vz += (oz - pz) * springK * dt * 60;

                // 4. CELESTIAL FLUID DAMPING
                vx *= dampingFactor;
                vy *= dampingFactor;
                vz *= dampingFactor;

                // 5. UPDATE POSITION
                px += vx * dt * 60;
                py += vy * dt * 60;
                pz += vz * dt * 60;

                particlePositions[i3] = px;
                particlePositions[i3 + 1] = py;
                particlePositions[i3 + 2] = pz;

                particleVelocities[i3] = vx;
                particleVelocities[i3 + 1] = vy;
                particleVelocities[i3 + 2] = vz;
            }

            particles.geometry.attributes.position.needsUpdate = true;
            // Gentle ambient cosmos rotation
            particles.rotation.y = elapsed * 0.016;
        }

        // ── Animate Ambient Rising Embers (Also affected by Asteroid Forces) ──
        if (emberParticles && emberPositions && emberVelocities) {
            const pos = emberPositions;
            const vel = emberVelocities;
            const count = vel.length;
            const activeAstCount = activeAsteroids.length;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const v = vel[i];

                // Natural upward float
                pos[i3 + 1] += v.speedY;
                // Gentle horizontal wave sway
                const naturalX = emberBaseX[i] + Math.sin(elapsed * v.swaySpeed + v.phase) * v.swayAmp * 12;

                // Asteroid forces on embers
                if (activeAstCount > 0) {
                    for (let a = 0; a < activeAstCount; a++) {
                        const ast = activeAsteroids[a];
                        if (!ast.alive) continue;
                        const dx = pos[i3] - ast.pos.x;
                        const dy = pos[i3 + 1] - ast.pos.y;
                        const dz = pos[i3 + 2] - ast.pos.z;
                        const distSq = dx * dx + dy * dy + dz * dz;
                        if (distSq < (ast.forceRadius * 0.8) * (ast.forceRadius * 0.8) && distSq > 0.1) {
                            const dist = Math.sqrt(distSq);
                            const force = (1.0 - dist / (ast.forceRadius * 0.8)) * 0.45;
                            if (ast.type === 'antigravity') {
                                v.impulseX += (dx / dist) * force;
                                v.impulseY += (dy / dist) * force;
                                v.impulseZ += (dz / dist) * force;
                            } else {
                                v.impulseX -= (dx / dist) * force;
                                v.impulseY -= (dy / dist) * force;
                                v.impulseZ -= (dz / dist) * force;
                            }
                        }
                    }
                }

                // Apply and damp impulses
                v.impulseX *= 0.92;
                v.impulseY *= 0.92;
                v.impulseZ *= 0.92;

                pos[i3] = naturalX + v.impulseX;
                pos[i3 + 1] += v.impulseY;
                pos[i3 + 2] += v.impulseZ;

                // Cycle top boundary back to bottom
                if (pos[i3 + 1] > 28) {
                    pos[i3 + 1] = -145;
                }
            }
            emberParticles.geometry.attributes.position.needsUpdate = true;
        }

        // ── Animate Constellation Lines & Nodes ──
        if (constellationLines) {
            constellationLines.rotation.y = elapsed * 0.007;
        }

        // ── Animate Scattered Floating Geometric Meshes ──
        if (floatingMeshes.length) {
            const activeAstCount = activeAsteroids.length;

            floatingMeshes.forEach(m => {
                // Multi-axis spin with kinetic boost from passing asteroids
                const effectiveRotX = m.userData.rotX + (m.userData.spinBoost * 0.08);
                const effectiveRotY = m.userData.rotY + (m.userData.spinBoost * 0.10);
                const effectiveRotZ = m.userData.rotZ + (m.userData.spinBoost * 0.07);

                m.rotation.x = elapsed * effectiveRotX;
                m.rotation.y = elapsed * effectiveRotY;
                m.rotation.z = elapsed * effectiveRotZ;

                // Organic vertical levitation breathing
                const floatOffset = Math.sin(elapsed * m.userData.floatSpeed + m.userData.phase) * m.userData.floatAmp;
                // Gentle horizontal swaying
                const swayOffset = Math.cos(elapsed * 0.42 + m.userData.phase) * 0.55;

                // Asteroid proximity nudge on geometric meshes
                if (activeAstCount > 0) {
                    for (let a = 0; a < activeAstCount; a++) {
                        const ast = activeAsteroids[a];
                        if (!ast.alive) continue;
                        const dx = m.position.x - ast.pos.x;
                        const dy = m.position.y - ast.pos.y;
                        const dz = m.position.z - ast.pos.z;
                        const distSq = dx * dx + dy * dy + dz * dz;

                        if (distSq < 15 * 15 && distSq > 0.1) {
                            const dist = Math.sqrt(distSq);
                            const nudge = (1.0 - dist / 15) * 0.35;
                            if (ast.type === 'antigravity') {
                                m.userData.wobbleX += (dx / dist) * nudge;
                                m.userData.wobbleY += (dy / dist) * nudge;
                            } else {
                                m.userData.wobbleX -= (dx / dist) * nudge;
                                m.userData.wobbleY -= (dy / dist) * nudge;
                            }
                            m.userData.spinBoost = Math.min(m.userData.spinBoost + 0.6, 2.5);
                        }
                    }
                }

                // Damp kinetic wobble & spin boost
                m.userData.wobbleX *= 0.94;
                m.userData.wobbleY *= 0.94;
                m.userData.spinBoost *= 0.95;

                m.position.x = m.userData.baseX + swayOffset + m.userData.wobbleX;
                m.position.y = m.userData.baseY + floatOffset + m.userData.wobbleY;
                m.position.z = m.userData.baseZ;

                // Counter-rotate nested inner geometries
                if (m.userData.inner) {
                    m.userData.inner.rotation.x = elapsed * -0.16;
                    m.userData.inner.rotation.y = elapsed * 0.20;
                }
            });
        }

        renderer.render(scene, camera);
    };

    /**
     * Initialize Background System
     */
    const init = () => {
        const canvas = document.getElementById('three-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        // Check reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            isReducedMotion = true;
        }

        const theme = window.AppState?.theme || 'dark';
        createMaterials(theme);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: window.innerWidth > 768,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Scene and Camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 220);
        camera.position.set(0, 0, 30);

        // Build all visual layers
        createCosmicParticles();
        createAmbientEmbers();
        createConstellationNetwork();
        createFloatingGeometries();

        // Setup interactions
        setupInteractions();

        clock = new THREE.Clock();
        isRunning = true;
        animate();

        // Save reference to AppState
        if (window.AppState) {
            window.AppState.threeScene = { renderer, scene, camera, particles, floatingMeshes };
        }

        console.log('✓ Scattered 3D cosmic background initialized with burning asteroids & dynamic gravity engine');
    };

    /**
     * Update Theme Styling Dynamically
     */
    const applyTheme = (theme) => {
        const isLight = theme === 'light';

        if (materials.wireBlue) {
            materials.wireBlue.color.setHex(isLight ? 0x2563eb : 0x3d8bff);
            materials.wireBlue.opacity = isLight ? 0.08 : 0.14;
        }
        if (materials.wireCyan) {
            materials.wireCyan.color.setHex(isLight ? 0x0284c7 : 0x00d4ff);
            materials.wireCyan.opacity = isLight ? 0.07 : 0.13;
        }
        if (materials.wireGold) {
            materials.wireGold.color.setHex(isLight ? 0xb45309 : 0xc8a84b);
            materials.wireGold.opacity = isLight ? 0.06 : 0.12;
        }
        if (materials.wireEmerald) {
            materials.wireEmerald.color.setHex(isLight ? 0x059669 : 0x34d399);
            materials.wireEmerald.opacity = isLight ? 0.06 : 0.11;
        }
        if (materials.wirePurple) {
            materials.wirePurple.color.setHex(isLight ? 0x7c3aed : 0xa855f7);
            materials.wirePurple.opacity = isLight ? 0.07 : 0.13;
        }
        if (materials.particles) {
            materials.particles.opacity = isLight ? 0.45 : 0.80;
            materials.particles.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
        }
        if (materials.embers) {
            materials.embers.opacity = isLight ? 0.38 : 0.75;
            materials.embers.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
        }
        if (materials.lines) {
            materials.lines.color.setHex(isLight ? 0x3b82f6 : 0x3d8bff);
            materials.lines.opacity = isLight ? 0.04 : 0.08;
            materials.lines.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
        }
        if (materials.fireCorona) {
            materials.fireCorona.color.setHex(isLight ? 0xea580c : 0xff6600);
            materials.fireCorona.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
        }
        if (materials.plasmaCorona) {
            materials.plasmaCorona.color.setHex(isLight ? 0x0284c7 : 0x00f0ff);
            materials.plasmaCorona.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
        }
    };

    /**
     * Show Background Canvas
     */
    const show = () => {
        const canvas = document.getElementById('three-canvas');
        if (canvas) canvas.classList.add('visible');
    };

    /**
     * Pause Loop
     */
    const pause = () => {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
    };

    /**
     * Resume Loop
     */
    const resume = () => {
        if (!isRunning) {
            isRunning = true;
            if (clock) clock.start();
            animate();
        }
    };

    /**
     * Cleanup
     */
    const destroy = () => {
        pause();
        window.removeEventListener('resize', onResize);
        activeAsteroids.forEach(ast => {
            if (scene) {
                scene.remove(ast.group);
                scene.remove(ast.trailPoints);
            }
            ast.trailGeo.dispose();
            ast.trailMat.dispose();
        });
        activeAsteroids = [];
        if (renderer) renderer.dispose();
    };

    return {
        init,
        show,
        pause,
        resume,
        applyTheme,
        destroy,
        spawnAsteroid // Expose manually if needed for testing or interactive triggers
    };
})();
