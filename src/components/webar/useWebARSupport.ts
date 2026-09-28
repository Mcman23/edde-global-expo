'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WebARSupportState {
  supported: boolean;
  checking: boolean;
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
      const hasGetUserMedia = !!(
        navigator &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'
      );

      const hasGyro = typeof DeviceOrientationEvent !== 'undefined';

      isSupported = hasGetUserMedia && hasGyro;

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
