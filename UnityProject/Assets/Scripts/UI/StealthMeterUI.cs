using UnityEngine;
using UnityEngine.UI;

namespace AdaptiveStealth
{
    public sealed class StealthMeterUI : MonoBehaviour
    {
        [SerializeField] private PlayerVisibilityDetector detector;
        [SerializeField] private Slider slider;
        [SerializeField] private Image fillImage;
        [SerializeField] private Gradient exposureGradient;
        [SerializeField, Min(0.1f)] private float responseSpeed = 5f;
        private float displayed;

        private void Awake()
        {
            if (exposureGradient == null || exposureGradient.colorKeys.Length == 0)
            {
                exposureGradient = new Gradient();
                exposureGradient.SetKeys(
                    new[] { new GradientColorKey(new Color(0.2f, 1f, 0.48f), 0f), new GradientColorKey(new Color(1f, 0.18f, 0.12f), 1f) },
                    new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) });
            }
        }

        private void Update()
        {
            if (detector == null) return;
            displayed = Mathf.MoveTowards(displayed, detector.currentVisibility, responseSpeed * Time.deltaTime);
            if (slider != null) slider.SetValueWithoutNotify(displayed);
            if (fillImage != null) fillImage.color = exposureGradient.Evaluate(displayed);
        }
    }
}