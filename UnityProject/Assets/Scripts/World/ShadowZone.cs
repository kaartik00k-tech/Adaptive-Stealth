using UnityEngine;

namespace AdaptiveStealth
{
    [RequireComponent(typeof(Collider))]
    public sealed class ShadowZone : MonoBehaviour
    {
        [SerializeField, Range(0f, 1f)] private float visibilityCap = 0.16f;
        private void Reset() => GetComponent<Collider>().isTrigger = true;
        private void OnTriggerEnter(Collider other)
        {
            PlayerVisibilityDetector detector = other.GetComponentInParent<PlayerVisibilityDetector>();
            if (detector != null) detector.SetShadowZone(true, visibilityCap);
        }
        private void OnTriggerExit(Collider other)
        {
            PlayerVisibilityDetector detector = other.GetComponentInParent<PlayerVisibilityDetector>();
            if (detector != null) detector.SetShadowZone(false, 1f);
        }
    }
}