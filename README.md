# Adaptive Stealth

This repository contains the earlier browser prototype at the root and the new Unity 3D URP source in `UnityProject/`.

## Unity 3D project
Read [UnityProject/README.md](UnityProject/README.md) for the scene hierarchy, script wiring and WebGL deployment steps.

Vercel does not compile Unity C# source. Build the WebGL player with Unity Editor first, then deploy the generated static output. The Unity Editor build and play-mode tests have not been run by GitHub automation.

Included 3D systems: player movement and stance, dynamic light exposure, stealth UI, guard vision/suspicion, noise event bus and hearing, throwable distractions, shadow zones, ventilation crawl, and third-person camera.