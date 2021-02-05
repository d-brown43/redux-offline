const networkDetector = (offlineHandler: (isOnline: boolean) => void) => {
  const updateOnlineStatus = (isOnline: boolean) => () => {
    offlineHandler(isOnline);
  };

  window.addEventListener('online', updateOnlineStatus(true));
  window.addEventListener('offline', updateOnlineStatus(false));

  offlineHandler(navigator.onLine);
};

export default networkDetector;
