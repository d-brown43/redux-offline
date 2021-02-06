import { useDispatch, useSelector } from 'react-redux';
import {
  createNote as createNoteAction,
  getFolders,
  getNotes,
  createFolder as createFolderAction,
  RootState,
  getCurrentFolderId,
  setCurrentFolderId,
} from './redux';
import { Folder } from './types';
import { ChangeEventHandler } from 'react';
import { getNow } from './utils';

const App = () => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state);
  const currentFolderId = useSelector(getCurrentFolderId);

  const optimisticState = useSelector<RootState>((state) => {
    const { offline, ...rest } = state;
    return rest;
  });

  const realState = useSelector<RootState>((state) => {
    return state.offline.realState;
  });

  const folders = useSelector(getFolders);
  const notes = useSelector(getNotes);

  const getNotesInFolder = (folder: Folder) => {
    return notes.filter((note) => note.folderId === folder.id);
  };

  const onSelectFolder: ChangeEventHandler = (event) => {
    dispatch(setCurrentFolderId((event.target as any).value));
  };

  const createNote = () => {
    if (currentFolderId) {
      dispatch(
        createNoteAction({
          folderId: currentFolderId,
          name: `Note created at ${getNow()}`,
        })
      );
    }
  };

  const createFolder = () => {
    dispatch(
      createFolderAction({
        name: `Folder created at ${getNow()}`,
      })
    );
  };

  const formatState = (state: any) => JSON.stringify(state, null, 2);

  return (
    <div>
      <div>
        <h2>Folders</h2>
        {folders.map((folder) => (
          <div key={folder.id}>
            <label>
              <input
                type="radio"
                name="site_name"
                value={folder.id}
                checked={currentFolderId === folder.id}
                onChange={onSelectFolder}
              />
              {folder.name} - {folder.createdAt}
            </label>
            <h3>Notes in folder</h3>
            {getNotesInFolder(folder).map((note) => (
              <div key={note.id}>
                {note.name} - {note.createdAt}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={createFolder}>Create Folder</button>
      <button disabled={currentFolderId === null} onClick={createNote}>
        Create Note
      </button>
      <div>
        <h2>State</h2>
        <pre>{formatState(state)}</pre>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div>
          <h2>Optimistic State</h2>
          <pre>{formatState(optimisticState)}</pre>
        </div>
        <div>
          <h2>Resolved State</h2>
          <pre>{formatState(realState)}</pre>
        </div>
      </div>
    </div>
  );
};

export default App;
