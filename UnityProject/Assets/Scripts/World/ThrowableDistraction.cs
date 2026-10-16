using UnityEngine;

namespace AdaptiveStealth
{
    [RequireComponent(typeof(Rigidbody), typeof(Collider))]
    public sealed class ThrowableDistraction : MonoBehaviour
    {
        [SerializeField] private float impactNoiseRadius = 22f;
        [SerializeField, Range(0f, 1f)] private float impactLoudness = 1f;
        [SerializeField] private float minimumImpactSpeed = 1.2f;
        [SerializeField] private float destroyAfterSeconds = 18f;
        private bool emitted;

        private void Start() => Destroy(gameObject, destroyAfterSeconds);

        private void OnCollisionEnter(Collision collision)
        {
            if (emitted || collision.relativeVelocity.magnitude < minimumImpactSpeed) return;
            emitted = true;
            Vector3 point = collision.GetContact(0).point;
            NoiseBus.Emit(new NoiseEvent(point, impactNoiseRadius, impactLoudness, gameObject, "thrown distraction"));
        }
    }
}