import {v4 as uuidv4} from 'uuid';

type ApiData = {
  type: string;
  [other: string]: any
}

const fakeApi = (apiData: ApiData) => {
  if (apiData.type === 'test_object') {
    return uuidv4();
  }
  return null;
};

const api = (apiData: ApiData) => {
  return new Promise(resolve => {
    console.log('making fake request with data', apiData);
    window.setTimeout(() => {
      const fakeResponse = fakeApi(apiData);
      console.log('resolving response for request data', apiData, fakeResponse);
      resolve(fakeResponse);
    }, 5000);
  });
};

export default api;
