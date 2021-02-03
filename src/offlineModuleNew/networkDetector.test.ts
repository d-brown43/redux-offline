import networkDetector from "./networkDetector";

const setOnlineStatusInitial = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value: isOnline,
    configurable: true,
  });
};

it.each([
  [true],
  [false],
])
('calls the callback initially with current online status', (initialValue) => {
  setOnlineStatusInitial(initialValue);
  const detector = jest.fn();
  networkDetector(detector);
  expect(detector).toHaveBeenCalledWith(initialValue);
});

it('calls given callback with true when online', () => {
  setOnlineStatusInitial(false);
  const detector = jest.fn();
  networkDetector(detector);

  const event = new Event('online');
  window.dispatchEvent(event);

  expect(detector).toHaveBeenCalledTimes(2);
  expect(detector).toHaveBeenNthCalledWith(1, false);
  expect(detector).toHaveBeenLastCalledWith(true);
});

it('calls given callback with false when offline', () => {
  setOnlineStatusInitial(true);
  const detector = jest.fn();
  networkDetector(detector);

  const event = new Event('offline');
  window.dispatchEvent(event);

  expect(detector).toHaveBeenCalledTimes(2);
  expect(detector).toHaveBeenNthCalledWith(1, true);
  expect(detector).toHaveBeenLastCalledWith(false);
});
