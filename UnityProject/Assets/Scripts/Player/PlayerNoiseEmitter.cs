using UnityEngine;

namespace AdaptiveStealth
{
    [RequireComponent(typeof(StealthPlayerController))]
    public sealed class PlayerNoiseEmitter : MonoBehaviour
    {
        [SerializeField] private float walkRadius = 7f;
        [SerializeField] private float runRadius = 15f;
        [SerializeField] private float crouchRadius = 2f;
        [SerializeField] private float intervalWalk = 0.48f;
        [SerializeField] private float intervalRun = 0.28f;
        [SerializeField] private float intervalCrouch = 0.8f;
        private StealthPlayerController movement;
        private Vector3 previousPosition;
        private float nextEmit;

        private void Awake()
        {
            movement = GetComponent<StealthPlayerController>();
            previousPosition = transform.position;
        }

        private void Update()
        {
            float distance = Vector3.Distance(transform.position, previousPosition);
            previousPosition = transform.position;
            if (distance < 0.005f || movement.MoveState == PlayerMoveState.Idle || Time.time < nextEmit) return;

            float radius;
            float interval;
            string kind;
            switch (movement.MoveState)
            {
                case PlayerMoveState.Running: radius = runRadius; interval = intervalRun; kind = "run"; break;
                case PlayerMoveState.Crouching:
                case PlayerMoveState.Crawling: radius = crouchRadius; interval = intervalCrouch; kind = "crouch"; break;
                default: radius = walkRadius; interval = intervalWalk; kind = "walk"; break;
            }

            float speedFactor = Mathf.Clamp01(distance / Mathf.Max(Time.deltaTime, 0.001f) / 5f);
            NoiseBus.Emit(new NoiseEvent(transform.position, radius, speedFactor, gameObject, kind));
            nextEmit = Time.time + interval;
        }
    }
}