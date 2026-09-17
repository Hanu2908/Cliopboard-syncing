import { DeviceType } from '../types';

export function getDeviceDetails(): { id: string; name: string; type: DeviceType } {
  const ua = navigator.userAgent;
  let type: DeviceType = 'desktop';
  let osName = 'Device';

  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    type = 'tablet';
    osName = 'Tablet';
  } else if (/iPhone/i.test(ua)) {
    type = 'mobile';
    osName = 'iPhone';
  } else if (/Android/i.test(ua)) {
    type = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
    osName = 'Android Device';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    type = 'desktop';
    osName = 'Mac';
  } else if (/Windows/i.test(ua)) {
    type = 'desktop';
    osName = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    type = 'desktop';
    osName = 'Linux Station';
  }

  // Check saved device id or generate
  let id = localStorage.getItem('device_sync_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    localStorage.setItem('device_sync_id', id);
  }

  let customName = localStorage.getItem('device_sync_name');
  if (!customName) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    customName = `${osName} #${randomSuffix}`;
    localStorage.setItem('device_sync_name', customName);
  }

  return { id, name: customName, type };
}

export function updateDeviceName(name: string): void {
  localStorage.setItem('device_sync_name', name.trim());
}
