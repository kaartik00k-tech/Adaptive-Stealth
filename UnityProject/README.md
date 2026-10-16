# Adaptive Stealth — Unity 3D URP prototype

This directory contains Unity 6 URP C# source. Unity WebGL builds must be created in Unity Editor; Vercel hosts the generated static files and does not compile C#.

## Included systems
- Third-person CharacterController: idle, walking, running, crouching, crawling.
- Visibility exposure from directional, point and spot lights, stance multipliers, and obstacle occlusion.
- Stealth UI binding to Slider and/or Filled Image.
- Guard vision, visibility-scaled FOV/range, suspicion rise/decay and NavMesh investigation.
- Footstep noise events for walk/run/crouch; hearing radius and wall muffling.
- Rigidbody throwable distractions, shadow trigger zones, and ventilation crawl triggers.
- Third-person camera rig.

## Scene hierarchy
```text
NightfallScene
├── Lighting (Directional Light, Point Lights, Spot Lights)
├── Environment (Floor and walls with colliders; Environment layer)
│   ├── ShadowZone (BoxCollider, Is Trigger, ShadowZone)
│   └── Ventilation (trigger collider + VentilationShaft, optional CrawlExit)
├── Player (CharacterController, StealthPlayerController, PlayerVisibilityDetector, PlayerNoiseEmitter, DistractionThrower)
│   └── CameraTarget
├── Main Camera (ThirdPersonCameraRig; target = Player)
├── Guard (NavMeshAgent, GuardVisionAI, GuardHearingAI, optional GuardNoiseInvestigationBridge)
├── DistractionPrefab (Rigidbody, Collider, ThrowableDistraction)
└── Canvas (Slider or Filled Image, StealthMeterUI)
```

## Editor setup
1. Install Unity 6 with URP and WebGL Build Support. Open this folder in Unity Hub, or copy Assets and Packages into a new URP project.
2. Let Package Manager resolve URP and AI Navigation. If a package version conflicts, use the compatible version suggested by your installed Unity editor.
3. Create a floor and solid walls with colliders. Put solid occluders on an Environment layer. Assign this layer to visibility, vision and sound masks to avoid player/trigger colliders interfering with rays.
4. Create Player capsule: CharacterController height ~1.8, radius ~0.32. Add StealthPlayerController, PlayerVisibilityDetector, PlayerNoiseEmitter and DistractionThrower. Assign movement and exposure point if desired.
5. Add Main Camera and ThirdPersonCameraRig; assign Player as target. Assign the camera to DistractionThrower. The controller uses legacy Horizontal/Vertical axes: set Active Input Handling to Input Manager or Both.
6. Create Guard with NavMeshAgent, GuardVisionAI and GuardHearingAI. Assign Player and PlayerVisibilityDetector on GuardVisionAI, and an eye transform at head height. Bake a NavMesh and make sure the guard starts on it.
7. Create a throwable prefab with Rigidbody, Collider and ThrowableDistraction; assign its Rigidbody prefab to DistractionThrower.
8. Add trigger volumes with ShadowZone and VentilationShaft. For a vent, optionally assign a crawl exit transform.
9. Add a Canvas Slider or Filled Image and StealthMeterUI. Assign the player detector and UI references.
10. Tune light intensity/ranges, FOV, suspicion speed, noise radii and shadow cap in the Inspector.

## WebGL and Vercel
1. In Unity Build Profiles / Build Settings, switch to WebGL and build to an output folder such as `webgl-build`.
2. Test the generated build through a local HTTP server; do not open index.html directly from disk.
3. Deploy the generated static WebGL output to Vercel, with `index.html`, `Build/`, and `TemplateData/` at the deployed root. If using this repository, commit the generated output or use a separate deployment repository and set Vercel Root Directory accordingly.
4. Optimize textures/audio and test browser memory/performance. Vercel deploys the output; it does not build the Unity project.

## Scope and verification
This is a system foundation, not a finished commercial game. Scene art, models, animation, lighting, NavMesh bake and UI prefabs must be assembled in Unity. Editor compilation and play-mode tests have not been run in this environment. Audio/material-specific occlusion, multiplayer, saves and advanced group coordination are not included.