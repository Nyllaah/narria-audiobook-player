import React, { useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;

type SeekBarProps = {
  position: number;
  duration: number;
  isSeeking: boolean;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  thumbTintColor: string;
  onSeekStart: () => void;
  onSeekChange: (value: number) => void;
  onSeekComplete: (value: number) => void;
  style?: object;
};

function getSeekPosition(locationX: number, trackWidth: number, safeDuration: number): number {
  const w = trackWidth;
  if (w <= 0) return 0;
  const x = Math.max(0, Math.min(w, locationX));
  return (x / w) * safeDuration;
}

export function SeekBar({
  position,
  duration,
  isSeeking: _isSeeking,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  onSeekStart,
  onSeekChange,
  onSeekComplete,
  style,
}: SeekBarProps) {
  const containerRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);

  const safeDuration = Math.max(1, duration);
  const clampedPosition = Math.max(0, Math.min(position, safeDuration));
  const ratio = clampedPosition / safeDuration;

  const isDragging = dragX !== null;
  const displayX = isDragging && trackWidthRef.current > 0
    ? dragX
    : ratio * trackWidthRef.current;
  const fillRatio = trackWidthRef.current > 0
    ? displayX / trackWidthRef.current
    : ratio;
  const thumbLeft = trackWidthRef.current > 0
    ? displayX - THUMB_SIZE / 2
    : ratio * trackWidth - THUMB_SIZE / 2;

  const ensureTrackWidth = useRef((locationX: number, onReady: (w: number) => void) => {
    const w = trackWidthRef.current;
    if (w > 0) {
      onReady(w);
      return;
    }
    containerRef.current?.measure((_x, _y, width) => {
      if (width > 0) {
        trackWidthRef.current = width;
        setTrackWidth(width);
        onReady(width);
      }
    });
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        ensureTrackWidth(locationX, (w) => {
          const x = Math.max(0, Math.min(w, locationX));
          const pos = getSeekPosition(locationX, w, safeDuration);
          onSeekStart();
          setDragX(x);
          onSeekChange(pos);
        });
      },
      onPanResponderMove: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const x = Math.max(0, Math.min(w, locationX));
        const pos = (x / w) * safeDuration;
        setDragX(x);
        onSeekChange(pos);
      },
      onPanResponderRelease: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const w = trackWidthRef.current;
        if (w <= 0) {
          setDragX(null);
          return;
        }
        const x = Math.max(0, Math.min(w, locationX));
        const pos = (x / w) * safeDuration;
        setDragX(null);
        onSeekComplete(pos);
      },
    })
  ).current;

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) {
          trackWidthRef.current = w;
          setTrackWidth(w);
        }
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.trackWrap}>
        <View
          pointerEvents="none"
          style={[
            styles.track,
            { backgroundColor: maximumTrackTintColor },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.fill,
              {
                width: `${fillRatio * 100}%`,
                backgroundColor: minimumTrackTintColor,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                left: thumbLeft,
                backgroundColor: thumbTintColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  trackWrap: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'visible',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
