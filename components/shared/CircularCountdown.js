import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg from 'react-native-svg';
import { Circle } from 'react-native-svg';

const CircularCountdown = ({ 
  duration = 10, 
  remainingTime, 
  onComplete, 
  size = 120,
  strokeWidth = 8,
  color = '#4A90E2',
  backgroundColor = '#e0e0e0'
}) => {
  const circumference = (size - strokeWidth) * Math.PI;
  const radius = (size - strokeWidth) / 2;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [dashOffset, setDashOffset] = React.useState(circumference);

  // Add listener to update dashOffset
  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value }) => {
      const currentOffset = circumference * (1 - value);
      setDashOffset(currentOffset);
    });
    
    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [circumference]);
  
  // Calculate progress (0 to 1)
  const progress = remainingTime / duration;
  
  // Animate the stroke offset when progress changes
  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: 1 - progress, // 0 when full (no time passed), 1 when empty (time finished)
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();
    
    return () => animation.stop(); // Cleanup animation on unmount
  }, [progress]);

  

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        
        {/* Countdown text */}
        <View style={styles.textContainer}>
          <Text style={[styles.countdownText, { color }]}>
            {Math.ceil(remainingTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'ComicSansMS',
  },
  labelText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'ComicSansMS',
  },
});

export default CircularCountdown;
