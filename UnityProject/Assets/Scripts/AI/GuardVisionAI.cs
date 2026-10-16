using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Events;

namespace AdaptiveStealth
{
    [RequireComponent(typeof(NavMeshAgent))]
    public sealed class GuardVisionAI : MonoBehaviour
    {
        [SerializeField] private Transform eye;
        [SerializeField] private PlayerVisibilityDetector playerVisibility;
        [SerializeField] private Transform player;
        [SerializeField] private NavMeshAgent agent;
        [SerializeField] private LayerMask visionOccluders = ~0;
        [SerializeField, Range(10f, 180f)] private float baseFieldOfView = 100f;
        [SerializeField, Min(0f)] private float baseSightRange = 18f;
        [SerializeField, Min(0.1f)] private float suspicionRisePerSecond = 0.75f;
        [SerializeField, Min(0.1f)] private float suspicionDecayPerSecond = 0.3f;
        [SerializeField, Range(0f, 1f)] private float alertThreshold = 0.8f;
        [SerializeField] private float forgetAfterSeconds = 6f;
        [SerializeField] private UnityEvent onAlerted;
        private float lastSeenTime = -100f;
        private bool alerted;

        public float Suspicion { get; private set; }
        public bool IsAlerted => alerted;
        public float EffectiveSightRange => baseSightRange * Mathf.Lerp(0.025f, 1f, playerVisibility != null ? playerVisibility.currentVisibility : 1f);
        public float EffectiveFieldOfView => baseFieldOfView * Mathf.Lerp(0.12f, 1f, playerVisibility != null ? playerVisibility.currentVisibility : 1f);

        private void Awake()
        {
            if (agent == null) agent = GetComponent<NavMeshAgent>();
            if (eye == null) eye = transform;
        }

        private void Update()
        {
            if (player == null || playerVisibility == null) return;
            Vector3 eyePosition = eye.position;
            Vector3 target = player.position + Vector3.up * 1.1f;
            Vector3 toPlayer = target - eyePosition;
            float distance = toPlayer.magnitude;
            bool inRange = distance <= EffectiveSightRange;
            bool inFov = Vector3.Angle(eye.forward, toPlayer) <= EffectiveFieldOfView * 0.5f;
            bool visible = inRange && inFov &&
                !Physics.Linecast(eyePosition, target, visionOccluders, QueryTriggerInteraction.Ignore);

            if (visible)
            {
                lastSeenTime = Time.time;
                float exposure = Mathf.Lerp(0.12f, 1.35f, playerVisibility.currentVisibility);
                Suspicion = Mathf.Clamp01(Suspicion + suspicionRisePerSecond * exposure * Time.deltaTime);
                if (agent != null && agent.isOnNavMesh) agent.SetDestination(player.position);
            }
            else
            {
                Suspicion = Mathf.Clamp01(Suspicion - suspicionDecayPerSecond * Time.deltaTime);
                if (Time.time - lastSeenTime > forgetAfterSeconds && !alerted && agent != null && agent.isOnNavMesh && agent.hasPath)
                    agent.ResetPath();
            }

            if (!alerted && Suspicion >= alertThreshold)
            {
                alerted = true;
                onAlerted?.Invoke();
            }
            if (alerted && Suspicion < alertThreshold * 0.35f) alerted = false;
        }

        public void Investigate(Vector3 point)
        {
            if (agent != null && agent.isOnNavMesh) agent.SetDestination(point);
        }
    }
}