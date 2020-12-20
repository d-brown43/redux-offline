import {v4 as uuidv4} from "uuid";

export const getTempId = () => `temp_id_${uuidv4()}`;
export const getMockRealId = () => uuidv4();
