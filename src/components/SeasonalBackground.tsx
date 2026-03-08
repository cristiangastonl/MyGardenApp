import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SeasonKey, SeasonalPalette } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 140;

interface ParticleConfig {
  emojis: string[];
  count: number;
  speed: [number, number];       // min/max duration in ms
  drift: [number, number];       // min/max horizontal drift
  size: [number, number];        // min/max font size
  opacity: [number, number];     // min/max opacity
}

const PARTICLE_CONFIGS: Record<SeasonKey, ParticleConfig> = {
  spring: {
    emojis: ['🌸', '🌷', '💮', '🪻'],
    count: 6,
    speed: [4000, 7000],
    drift: [-30, 30],
    size: [12, 18],
    opacity: [0.4, 0.7],
  },
  summer: {
    emojis: ['✨', '☀️', '🌤️'],
    count: 5,
    speed: [3000, 5000],
    drift: [-15, 15],
    size: [10, 16],
    opacity: [0.3, 0.6],
  },
  fall: {
    emojis: ['🍂', '🍁', '🍃'],
    count: 7,
    speed: [3500, 6000],
    drift: [-40, 40],
    size: [12, 20],
    opacity: [0.4, 0.8],
  },
  winter: {
    emojis: ['❄️', '❅', '✦'],
    count: 8,
    speed: [5000, 8000],
    drift: [-20, 20],
    size: [10, 16],
    opacity: [0.3, 0.6],
  },
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface ParticleData {
  emoji: string;
  startX: number;
  size: number;
  targetOpacity: number;
  duration: number;
  driftX: number;
  delay: number;
}

interface SeasonalBackgroundProps {
  season: SeasonKey;
  palette: SeasonalPalette;
  children: React.ReactNode;
}

export function SeasonalBackground({ season, palette, children }: SeasonalBackgroundProps) {
  const config = PARTICLE_CONFIGS[season];

  // Generate stable particle data
  const particles = useMemo(() => {
    return Array.from({ length: config.count }, (_, i): ParticleData => ({
      emoji: config.emojis[i % config.emojis.length],
      startX: rand(20, SCREEN_WIDTH - 40),
      size: rand(config.size[0], config.size[1]),
      targetOpacity: rand(config.opacity[0], config.opacity[1]),
      duration: rand(config.speed[0], config.speed[1]),
      driftX: rand(config.drift[0], config.drift[1]),
      delay: rand(0, 3000),
    }));
  }, [season]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[palette.gradient[0], palette.gradient[1], 'transparent']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        {particles.map((p, i) => (
          <Particle key={`${season}-${i}`} data={p} season={season} />
        ))}
      </LinearGradient>
      {children}
    </View>
  );
}

function Particle({ data, season }: { data: ParticleData; season: SeasonKey }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const isSummer = season === 'summer';

      const animation = Animated.loop(
        Animated.sequence([
          // Fade in + move
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: data.targetOpacity,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: isSummer ? 10 : HEADER_HEIGHT + 20,
              duration: data.duration,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: data.driftX,
              duration: data.duration,
              useNativeDriver: true,
            }),
          ]),
          // Fade out
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          // Reset position
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -20,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      animation.start();
      return () => animation.stop();
    }, data.delay);

    return () => clearTimeout(timeout);
  }, [season]);

  // Summer: pulse/shimmer instead of falling
  const summerScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (season !== 'summer') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(summerScale, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(summerScale, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [season]);

  const animStyle: any = {
    position: 'absolute' as const,
    left: data.startX,
    top: 0,
    fontSize: data.size,
    opacity,
    transform: [
      { translateY },
      { translateX },
      ...(season === 'summer' ? [{ scale: summerScale }] : []),
    ],
  };

  return (
    <Animated.Text style={animStyle} pointerEvents="none">
      {data.emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
});
