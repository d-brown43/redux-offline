import { getMockRealId } from "../utils";

export const API_CREATE_TEST_OBJECT = "API_CREATE_TEST_OBJECT";

type ApiData = {
  type: string;
  fails?: boolean;
  [other: string]: any;
};

const fakeApi = (apiData: ApiData) => {
  if (apiData.type === API_CREATE_TEST_OBJECT) {
    return {
      ...apiData.data,
      id: getMockRealId(),
    };
  }
  return null;
};

const api = (apiData: ApiData) => {
  return new Promise((resolve, reject) => {
    console.log("making fake request with data", apiData);
    window.setTimeout(() => {
      const fakeResponse = fakeApi(apiData);
      if (apiData.fails) {
        console.info("REJECT response for request data", apiData);
        reject("fake error");
      } else {
        console.info(
          "RESOLVE response for request data",
          apiData,
          fakeResponse
        );
        resolve(fakeResponse);
      }
    }, 5000);
  });
};

export default api;
