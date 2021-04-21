import networkDetector from './networkDetector';
import {
  dispatchOfflineEvent,
  dispatchOnlineEvent,
  setOnlineStatusInitial,
} from './test/utils';

it.each([[true], [false]])(
  'calls the callback initially with current online status',
  (initialValue) => {
    setOnlineStatusInitial(initialValue);
    const detector = jest.fn();
    networkDetector(detector);
    expect(detector).toHaveBeenCalledWith(initialValue);
  }
);

it('calls given callback with true when online', () => {
  setOnlineStatusInitial(false);
  const detector = jest.fn();
  networkDetector(detector);

  dispatchOnlineEvent();

  expect(detector).toHaveBeenCalledTimes(2);
  expect(detector).toHaveBeenNthCalledWith(1, false);
  expect(detector).toHaveBeenLastCalledWith(true);
});

it('calls given callback with false when offline', () => {
  setOnlineStatusInitial(true);
  const detector = jest.fn();
  networkDetector(detector);

  dispatchOfflineEvent();

  expect(detector).toHaveBeenCalledTimes(2);
  expect(detector).toHaveBeenNthCalledWith(1, true);
  expect(detector).toHaveBeenLastCalledWith(false);
});
