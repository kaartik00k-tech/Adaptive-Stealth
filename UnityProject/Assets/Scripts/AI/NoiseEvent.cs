using System;
using UnityEngine;

namespace AdaptiveStealth
{
    public readonly struct NoiseEvent
    {
        public readonly Vector3 Position;
        public readonly float Radius;
        public readonly float Loudness;
        public readonly GameObject Source;
        public readonly string Kind;

        public NoiseEvent(Vector3 position, float radius, float loudness, GameObject source, string kind)
        {
            Position = position;
            Radius = radius;
            Loudness = loudness;
            Source = source;
            Kind = kind;
        }
    }

    public static class NoiseBus
    {
        public static event Action<NoiseEvent> NoiseEmitted;
        public static void Emit(NoiseEvent noise) => NoiseEmitted?.Invoke(noise);
    }
}