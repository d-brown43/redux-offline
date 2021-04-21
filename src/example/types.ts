// Types for the entities in our application

export type Note = {
  id: string;
  // Notes are dependent on folders
  folderId: string;
  name: string;
  createdAt: string;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};
