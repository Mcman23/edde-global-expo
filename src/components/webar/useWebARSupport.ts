'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WebARSupportState {
  /** getUserMedia is available — the camera experience can be attempted. */
  supported: boolean;
  checking: boolean;
  /** iOS 13+ requires an explicit user-gesture permission request for motion sensors. */
  needsPermissionRequest: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useWebARSupport(): WebARSupportState {
  const [supportState, setSupportState] = useState<{
    supported: boolean;
    checking: boolean;
    needsPermissionRequest: boolean;
  }>({
    supported: false,
    checking: true,
    needsPermissionRequest: false,
  });

  useEffect(() => {
    let isSupported = false;
    let needsPermission = false;

    if (typeof window !== 'undefined') {
      // Camera capability is the only hard requirement for the camera level.
      // Gyroscope is an optional enhancement (parallax) — never a blocker.
      isSupported = !!(
        navigator &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'
      );

      needsPermission =
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function';
    }

    setSupportState({
      supported: isSupported,
      checking: false,
      needsPermissionRequest: needsPermission,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof window !== 'undefined' &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        return permissionState === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true;
  }, []);

  return {
    ...supportState,
    requestPermission,
  };
}

export default useWebARSupport;
