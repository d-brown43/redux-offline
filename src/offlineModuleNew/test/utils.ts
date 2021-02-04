export const setOnlineStatusInitial = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value: isOnline,
    configurable: true,
  });
};

export const dispatchOnlineEvent = () => {
  const event = new Event('online');
  window.dispatchEvent(event);
};

export const dispatchOfflineEvent = () => {
  const event = new Event('offline');
  window.dispatchEvent(event);
};
