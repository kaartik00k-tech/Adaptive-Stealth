using UnityEngine;

namespace AdaptiveStealth
{
    public sealed class DistractionThrower : MonoBehaviour
    {
        [SerializeField] private Camera aimCamera;
        [SerializeField] private Rigidbody throwablePrefab;
        [SerializeField] private Transform throwOrigin;
        [SerializeField, Min(1f)] private float throwImpulse = 9f;
        [SerializeField] private float cooldown = 1.2f;
        private float nextThrow;
        private void Update()
        {
            if (!Input.GetKeyDown(KeyCode.E) || Time.time < nextThrow || throwablePrefab == null) return;
            Camera cam = aimCamera != null ? aimCamera : Camera.main;
            if (cam == null) return;
            Transform origin = throwOrigin != null ? throwOrigin : transform;
            Rigidbody item = Instantiate(throwablePrefab, origin.position, Quaternion.identity);
            item.AddForce((cam.transform.forward + Vector3.up * 0.12f).normalized * throwImpulse, ForceMode.Impulse);
            nextThrow = Time.time + cooldown;
        }
    }
}