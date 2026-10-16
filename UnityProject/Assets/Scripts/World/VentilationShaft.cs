using UnityEngine;

namespace AdaptiveStealth
{
    [RequireComponent(typeof(Collider))]
    public sealed class VentilationShaft : MonoBehaviour
    {
        [SerializeField] private Transform crawlExit;
        [SerializeField] private bool teleportToExitOnExit;
        private void Reset() => GetComponent<Collider>().isTrigger = true;
        private void OnTriggerEnter(Collider other)
        {
            StealthPlayerController player = other.GetComponentInParent<StealthPlayerController>();
            if (player != null) player.SetCrawlMode(true);
        }
        private void OnTriggerExit(Collider other)
        {
            StealthPlayerController player = other.GetComponentInParent<StealthPlayerController>();
            if (player == null) return;
            player.SetCrawlMode(false);
            if (!teleportToExitOnExit || crawlExit == null) return;
            CharacterController controller = player.GetComponent<CharacterController>();
            if (controller != null) controller.enabled = false;
            player.transform.SetPositionAndRotation(crawlExit.position, crawlExit.rotation);
            if (controller != null) controller.enabled = true;
        }
    }
}