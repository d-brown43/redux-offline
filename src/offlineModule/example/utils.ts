import {v4 as uuidv4} from "uuid";

export const getRandomId = () => uuidv4();
export const getNow = () => new Date().toISOString();
