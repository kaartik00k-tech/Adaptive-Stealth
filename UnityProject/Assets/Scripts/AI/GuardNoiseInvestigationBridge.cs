using UnityEngine;

namespace AdaptiveStealth
{
    public sealed class GuardNoiseInvestigationBridge : MonoBehaviour
    {
        [SerializeField] private GuardVisionAI visionAI;
        [SerializeField] private float hearingRadius = 20f;
        [SerializeField] private LayerMask soundOccluders = ~0;
        [SerializeField, Range(0f, 1f)] private float wallMuffle = 0.4f;
        private void Awake() { if (visionAI == null) visionAI = GetComponent<GuardVisionAI>(); }
        private void OnEnable() => NoiseBus.NoiseEmitted += HandleNoise;
        private void OnDisable() => NoiseBus.NoiseEmitted -= HandleNoise;
        private void HandleNoise(NoiseEvent noise)
        {
            if (noise.Source == gameObject) return;
            float radius = Mathf.Min(hearingRadius, noise.Radius);
            if (Physics.Linecast(transform.position + Vector3.up, noise.Position + Vector3.up, soundOccluders, QueryTriggerInteraction.Ignore)) radius *= wallMuffle;
            if (Vector3.Distance(transform.position, noise.Position) <= radius) visionAI?.Investigate(noise.Position);
        }
    }
}