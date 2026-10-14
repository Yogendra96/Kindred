import React, { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, {
  LinearGradient as SvgLinearGradient,
  Defs,
  Stop,
  Circle,
  Path,
  Rect,
} from 'react-native-svg';
import { MotiView } from 'moti';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type EarthPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'center-right'
  | 'center-left'
  | 'none';

interface SpaceBackgroundProps {
  children?: React.ReactNode;
  earthPosition?: EarthPosition;
  earthScale?: number;
  starCount?: number;
  enableComets?: boolean;
  cometStyle?: 'line' | 'tapered' | 'fireball';
  style?: ViewStyle;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
  children,
  earthPosition = 'top-right',
  earthScale = 1.0,
  starCount = 40,
  enableComets = true,
  cometStyle = 'tapered',
  style,
}) => {
  const DELTA_X = SCREEN_WIDTH + 200;
  const DELTA_Y = DELTA_X * 0.7002075; // Math.tan(35 * Math.PI / 180)

  // Generate consistent twinkling stars coordinates based on count
  const stars = useMemo(() => {
    interface Star {
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      duration: number;
      delay: number;
    }
    const list: Star[] = [];
    const colors = ['#FFFFFF', '#FFE57F', '#B3E5FC', '#E8F5E9'];
    for (let i = 0; i < starCount; i++) {
      list.push({
        id: i,
        // Distribute stars evenly but randomly across screen dimensions
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT * 0.95,
        size: Math.random() * 1.6 + 0.8, // star size between 0.8px and 2.4px
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 1800 + Math.random() * 2400, // pulse duration between 1.8s and 4.2s
        delay: Math.random() * 2000,
      });
    }
    return list;
  }, [starCount]);

  const renderEarth = () => {
    if (earthPosition === 'none') return null;

    let positionStyle: ViewStyle = {};
    switch (earthPosition) {
      case 'top-right':
        positionStyle = { top: 70, right: -80 };
        break;
      case 'top-left':
        positionStyle = { top: 70, left: -80 };
        break;
      case 'bottom-right':
        positionStyle = { bottom: 70, right: -80 };
        break;
      case 'bottom-left':
        positionStyle = { bottom: 70, left: -80 };
        break;
      case 'center-right':
        positionStyle = { top: SCREEN_HEIGHT / 2 - 130, right: -90 };
        break;
      case 'center-left':
        positionStyle = { top: SCREEN_HEIGHT / 2 - 130, left: -90 };
        break;
    }

    return (
      <MotiView
        from={{ rotate: '0deg' }}
        animate={{ rotate: '360deg' }}
        transition={
          {
            loop: true,
            type: 'timing',
            duration: 50000, // extremely slow ambient rotation
            repeatReverse: false,
          } as any
        }
        style={[styles.earthBase, positionStyle, { transform: [{ scale: earthScale }] }]}
      >
        <Svg width={260} height={260} viewBox='0 0 200 200'>
          <Defs>
            <SvgLinearGradient id='oceanGrad' x1='0' y1='0' x2='1' y2='1'>
              <Stop offset='0' stopColor='#2575fc' />
              <Stop offset='1' stopColor='#1a2a6c' />
            </SvgLinearGradient>
            <SvgLinearGradient id='landGrad' x1='0' y1='0' x2='1' y2='1'>
              <Stop offset='0' stopColor='#11998e' />
              <Stop offset='1' stopColor='#38ef7d' />
            </SvgLinearGradient>
          </Defs>
          {/* Atmosphere Glow */}
          <Circle cx='100' cy='100' r='98' fill='rgba(37, 117, 252, 0.12)' />
          <Circle cx='100' cy='100' r='90' fill='rgba(56, 239, 125, 0.05)' />
          {/* Ocean */}
          <Circle cx='100' cy='100' r='80' fill='url(#oceanGrad)' />
          {/* Landmass 1 */}
          <Path
            d='M 60,50 Q 85,35 110,55 T 135,90 T 115,130 T 75,145 T 50,110 Z'
            fill='url(#landGrad)'
          />
          {/* Landmass 2 */}
          <Path
            d='M 125,45 Q 145,35 165,55 T 155,95 T 135,125 T 145,155 T 115,135 Z'
            fill='url(#landGrad)'
          />
          {/* Landmass Australia */}
          <Path d='M 150,135 Q 170,145 160,165 T 140,155 Z' fill='url(#landGrad)' />
          {/* Clouds */}
          <Path d='M 50,85 Q 65,75 80,85 T 95,95 T 65,105 Z' fill='rgba(255,255,255,0.25)' />
          <Path
            d='M 115,105 Q 135,95 150,105 T 165,115 T 130,125 Z'
            fill='rgba(255,255,255,0.25)'
          />
        </Svg>
      </MotiView>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Deep Space Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width='100%' height='100%'>
          <Defs>
            <SvgLinearGradient id='spaceBgGrad' x1='0' y1='0' x2='0' y2='1'>
              <Stop offset='0' stopColor='#080C10' />
              <Stop offset='0.6' stopColor='#0F161E' />
              <Stop offset='1' stopColor='#17222E' />
            </SvgLinearGradient>
          </Defs>
          <Rect x='0' y='0' width='100%' height='100%' fill='url(#spaceBgGrad)' />
        </Svg>
      </View>

      {/* Twinkling Stars */}
      {stars.map(star => (
        <MotiView
          key={star.id}
          from={{ opacity: 0.1 }}
          animate={{ opacity: 0.9 }}
          transition={
            {
              loop: true,
              type: 'timing',
              duration: star.duration,
              delay: star.delay,
              repeatReverse: true,
            } as any
          }
          style={{
            position: 'absolute',
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: star.color,
          }}
        />
      ))}

      {/* Optional Shooting Stars / Comets */}
      {enableComets && (
        <>
          <MotiView
            from={{ translateX: -120, translateY: 100, rotate: '35deg', opacity: 0 }}
            animate={{
              translateX: SCREEN_WIDTH + 80,
              translateY: 100 + DELTA_Y,
              rotate: '35deg',
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={
              {
                loop: true,
                type: 'timing',
                duration: 2200,
                delay: 4000,
                repeatReverse: false,
              } as any
            }
            style={[
              styles.cometLeftToRight,
              cometStyle === 'line' && { width: 60, height: 1.5, backgroundColor: '#FFFFFF' },
            ]}
          >
            {cometStyle === 'tapered' && (
              <Svg width='100' height='20' viewBox='0 0 100 20'>
                <Defs>
                  <SvgLinearGradient id='cometLeftGrad' x1='0' y1='0' x2='1' y2='0'>
                    <Stop offset='0%' stopColor='#38EF7D' stopOpacity={0} />
                    <Stop offset='70%' stopColor='#38EF7D' stopOpacity={0.5} />
                    <Stop offset='100%' stopColor='#FFFFFF' stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Path d='M 0 10 L 90 7 L 90 13 Z' fill='url(#cometLeftGrad)' />
                <Circle cx='90' cy='10' r='3.5' fill='#FFFFFF' />
              </Svg>
            )}
            {cometStyle === 'fireball' && (
              <Svg width='120' height='24' viewBox='0 0 120 24'>
                <Defs>
                  <SvgLinearGradient id='fireballLeftGrad' x1='0' y1='0' x2='1' y2='0'>
                    <Stop offset='0%' stopColor='#FF3B30' stopOpacity={0} />
                    <Stop offset='50%' stopColor='#FF9500' stopOpacity={0.6} />
                    <Stop offset='85%' stopColor='#FFD700' stopOpacity={0.9} />
                    <Stop offset='100%' stopColor='#FFFFFF' stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Path d='M 0 12 L 105 8 L 105 16 Z' fill='url(#fireballLeftGrad)' />
                <Circle cx='105' cy='12' r='4.5' fill='#FFF' />
              </Svg>
            )}
          </MotiView>
          <MotiView
            from={{ translateX: SCREEN_WIDTH + 80, translateY: 50, rotate: '-35deg', opacity: 0 }}
            animate={{
              translateX: -120,
              translateY: 50 + DELTA_Y,
              rotate: '-35deg',
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={
              {
                loop: true,
                type: 'timing',
                duration: 2000,
                delay: 11000,
                repeatReverse: false,
              } as any
            }
            style={[
              styles.cometRightToLeft,
              cometStyle === 'line' && { width: 50, height: 1.5, backgroundColor: '#FFE57F' },
            ]}
          >
            {cometStyle === 'tapered' && (
              <Svg width='100' height='20' viewBox='0 0 100 20'>
                <Defs>
                  <SvgLinearGradient id='cometRightGrad' x1='1' y1='0' x2='0' y2='0'>
                    <Stop offset='0%' stopColor='#38EF7D' stopOpacity={0} />
                    <Stop offset='70%' stopColor='#38EF7D' stopOpacity={0.5} />
                    <Stop offset='100%' stopColor='#FFFFFF' stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Path d='M 100 10 L 10 7 L 10 13 Z' fill='url(#cometRightGrad)' />
                <Circle cx='10' cy='10' r='3.5' fill='#FFFFFF' />
              </Svg>
            )}
            {cometStyle === 'fireball' && (
              <Svg width='120' height='24' viewBox='0 0 120 24'>
                <Defs>
                  <SvgLinearGradient id='fireballRightGrad' x1='1' y1='0' x2='0' y2='0'>
                    <Stop offset='0%' stopColor='#FF3B30' stopOpacity={0} />
                    <Stop offset='50%' stopColor='#FF9500' stopOpacity={0.6} />
                    <Stop offset='85%' stopColor='#FFD700' stopOpacity={0.9} />
                    <Stop offset='100%' stopColor='#FFFFFF' stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Path d='M 120 12 L 15 8 L 15 16 Z' fill='url(#fireballRightGrad)' />
                <Circle cx='15' cy='12' r='4.5' fill='#FFF' />
              </Svg>
            )}
          </MotiView>
        </>
      )}

      {/* Animated Earth */}
      {renderEarth()}

      {/* Screen Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C10',
  },
  earthBase: {
    position: 'absolute',
    width: 260,
    height: 260,
    opacity: 0.25,
  },
  cometLeftToRight: {
    position: 'absolute',
  },
  cometRightToLeft: {
    position: 'absolute',
  },
});
