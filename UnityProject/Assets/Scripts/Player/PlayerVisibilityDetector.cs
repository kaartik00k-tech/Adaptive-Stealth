using UnityEngine;

namespace AdaptiveStealth
{
    [DisallowMultipleComponent]
    public sealed class PlayerVisibilityDetector : MonoBehaviour
    {
        [SerializeField] private StealthPlayerController movement;
        [SerializeField] private Transform exposurePoint;
        [SerializeField] private LayerMask occluderMask = ~0;
        [SerializeField, Min(0.1f)] private float scanRadius = 18f;
        [SerializeField, Range(0f, 1f)] private float crouchMultiplier = 0.58f;
        [SerializeField, Range(0f, 1f)] private float crawlMultiplier = 0.38f;
        [SerializeField, Range(0f, 1f)] private float shadowVisibilityCap = 0.18f;
        [SerializeField, Min(0.1f)] private float smoothing = 7f;
        [SerializeField, Range(0f, 1f)] private float ambientVisibility = 0.025f;

        public float currentVisibility { get; private set; }
        private float shadowCap = 1f;
        private float stanceMultiplier = 1f;

        private void Reset() => movement = GetComponent<StealthPlayerController>();

        private void Update()
        {
            if (movement == null) movement = GetComponent<StealthPlayerController>();
            stanceMultiplier = movement == null ? 1f :
                movement.IsCrawling ? crawlMultiplier :
                movement.IsCrouching ? crouchMultiplier : 1f;

            Vector3 point = exposurePoint != null ? exposurePoint.position : transform.position + Vector3.up * 1.45f;
            float accumulated = ambientVisibility;
            Light[] lights = FindObjectsByType<Light>(FindObjectsSortMode.None);
            foreach (Light lightSource in lights)
            {
                if (!lightSource.isActiveAndEnabled || lightSource.intensity <= 0f) continue;
                float contribution = EvaluateLight(lightSource, point);
                if (contribution <= 0f) continue;
                Vector3 origin = lightSource.type == LightType.Directional
                    ? point - lightSource.transform.forward * 100f
                    : lightSource.transform.position;
                if (Physics.Linecast(origin, point, out RaycastHit hit, occluderMask, QueryTriggerInteraction.Ignore))
                {
                    if (hit.transform != transform && !hit.transform.IsChildOf(transform))
                        contribution *= 0.08f;
                }
                accumulated += contribution;
            }
            float target = Mathf.Clamp01(accumulated) * stanceMultiplier;
            target = Mathf.Min(target, shadowCap, shadowVisibilityCap <= 0f ? 1f : shadowCap);
            currentVisibility = Mathf.MoveTowards(currentVisibility, Mathf.Clamp01(target), smoothing * Time.deltaTime);
        }

        private float EvaluateLight(Light source, Vector3 point)
        {
            float rangeFactor = 1f;
            if (source.type != LightType.Directional)
            {
                float distance = Vector3.Distance(source.transform.position, point);
                if (distance >= Mathf.Min(source.range, scanRadius)) return 0f;
                rangeFactor = 1f - distance / Mathf.Max(0.01f, Mathf.Min(source.range, scanRadius));
                rangeFactor *= rangeFactor;
                Vector3 toPoint = (point - source.transform.position).normalized;
                if (source.type == LightType.Spot && Vector3.Angle(source.transform.forward, toPoint) > source.spotAngle * 0.5f)
                    return 0f;
            }
            float intensityFactor = source.intensity / (source.intensity + 1.5f);
            return rangeFactor * intensityFactor * 0.72f;
        }

        public void SetShadowZone(bool inside, float cap)
        {
            shadowCap = inside ? Mathf.Clamp01(cap) : 1f;
        }
    }
}