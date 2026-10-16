using UnityEngine;

namespace AdaptiveStealth
{
    public enum PlayerMoveState { Idle, Walking, Running, Crouching, Crawling }

    [RequireComponent(typeof(CharacterController))]
    public sealed class StealthPlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float walkSpeed = 2.5f;
        [SerializeField] private float runSpeed = 5.2f;
        [SerializeField] private float crouchSpeed = 1.35f;
        [SerializeField] private float crawlSpeed = 0.85f;
        [SerializeField] private float gravity = -22f;
        [SerializeField] private float turnSharpness = 14f;
        [Header("Stance")]
        [SerializeField] private float standingHeight = 1.8f;
        [SerializeField] private float crouchingHeight = 1.15f;
        [SerializeField] private float heightLerpSpeed = 12f;
        [SerializeField] private Transform cameraReference;
        [SerializeField] private KeyCode crouchKey = KeyCode.LeftControl;
        [SerializeField] private KeyCode runKey = KeyCode.LeftShift;
        private CharacterController controller;
        private float verticalVelocity;
        private bool forcedCrawl;
        public PlayerMoveState MoveState { get; private set; } = PlayerMoveState.Idle;
        public bool IsCrouching => MoveState == PlayerMoveState.Crouching || MoveState == PlayerMoveState.Crawling;
        public bool IsRunning => MoveState == PlayerMoveState.Running;
        public bool IsWalking => MoveState == PlayerMoveState.Walking;
        public bool IsCrawling => MoveState == PlayerMoveState.Crawling;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            standingHeight = Mathf.Max(standingHeight, controller.height);
            controller.center = new Vector3(controller.center.x, standingHeight * 0.5f, controller.center.z);
        }

        private void Update()
        {
            float dt = Time.deltaTime;
            bool crouchHeld = forcedCrawl || Input.GetKey(crouchKey);
            bool runHeld = !crouchHeld && Input.GetKey(runKey);
            float targetHeight = crouchHeld ? crouchingHeight : standingHeight;
            controller.height = Mathf.MoveTowards(controller.height, targetHeight, heightLerpSpeed * dt);
            controller.center = new Vector3(controller.center.x, controller.height * 0.5f, controller.center.z);
            Vector2 input = Vector2.ClampMagnitude(new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical")), 1f);
            Transform basis = cameraReference != null ? cameraReference : transform;
            Vector3 forward = Vector3.ProjectOnPlane(basis.forward, Vector3.up).normalized;
            Vector3 right = Vector3.ProjectOnPlane(basis.right, Vector3.up).normalized;
            Vector3 move = forward * input.y + right * input.x;
            if (move.sqrMagnitude > 1f) move.Normalize();
            float speed = forcedCrawl ? crawlSpeed : crouchHeld ? crouchSpeed : runHeld ? runSpeed : walkSpeed;
            if (move.sqrMagnitude > 0.001f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(move, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, turnSharpness * dt);
            }
            if (controller.isGrounded && verticalVelocity < 0f) verticalVelocity = -2f;
            verticalVelocity += gravity * dt;
            Vector3 velocity = move * speed;
            velocity.y = verticalVelocity;
            controller.Move(velocity * dt);
            if (forcedCrawl) MoveState = PlayerMoveState.Crawling;
            else if (crouchHeld) MoveState = PlayerMoveState.Crouching;
            else if (move.sqrMagnitude < 0.001f) MoveState = PlayerMoveState.Idle;
            else MoveState = runHeld ? PlayerMoveState.Running : PlayerMoveState.Walking;
        }

        public void SetCrawlMode(bool enabled) => forcedCrawl = enabled;
    }
}