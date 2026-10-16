using UnityEngine;
using UnityEngine.AI;

namespace AdaptiveStealth
{
    [RequireComponent(typeof(NavMeshAgent))]
    public sealed class GuardHearingAI : MonoBehaviour
    {
        [SerializeField] private NavMeshAgent agent;
        [SerializeField] private LayerMask soundOccluders = ~0;
        [SerializeField] private float wallMuffleMultiplier = 0.42f;
        [SerializeField] private float investigateSeconds = 5f;
        [SerializeField] private float minimumAudibleLoudness = 0.08f;
        private float investigateUntil;
        private Vector3 investigatePoint;
        public bool IsInvestigating => Time.time < investigateUntil;

        private void Awake()
        {
            if (agent == null) agent = GetComponent<NavMeshAgent>();
        }

        private void OnEnable() => NoiseBus.NoiseEmitted += OnNoise;
        private void OnDisable() => NoiseBus.NoiseEmitted -= OnNoise;

        private void OnNoise(NoiseEvent noise)
        {
            if (noise.Source == gameObject) return;
            float distance = Vector3.Distance(transform.position, noise.Position);
            float effectiveRadius = noise.Radius;
            if (Physics.Linecast(transform.position + Vector3.up, noise.Position + Vector3.up, out RaycastHit hit,
                    soundOccluders, QueryTriggerInteraction.Ignore))
            {
                if (hit.transform != transform && !hit.transform.IsChildOf(transform))
                    effectiveRadius *= wallMuffleMultiplier;
            }
            float loudnessAtGuard = noise.Loudness * (1f - distance / Mathf.Max(0.01f, effectiveRadius));
            if (distance > effectiveRadius || loudnessAtGuard < minimumAudibleLoudness) return;
            investigatePoint = noise.Position;
            investigateUntil = Time.time + investigateSeconds;
            if (agent != null && agent.isOnNavMesh) agent.SetDestination(investigatePoint);
        }

        private void Update()
        {
            if (agent == null || !agent.isOnNavMesh) return;
            if (Time.time >= investigateUntil && agent.hasPath) agent.ResetPath();
        }
    }
}