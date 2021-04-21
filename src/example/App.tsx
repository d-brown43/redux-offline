import { useDispatch, useSelector } from 'react-redux';
import { ChangeEventHandler, useState } from 'react';
import {
  createNote as createNoteAction,
  deleteFolder as deleteFolderAction,
  getFolders,
  getNotes,
  createFolder as createFolderAction,
  RootState,
  getCurrentFolderId,
  setCurrentFolderId,
  dependencyGraph,
} from './redux';
import { Folder } from './types';
import {
  getIsProcessing,
  getPendingActions,
  RenderGraph,
} from '../offlineModule';

const App = () => {
  const dispatch = useDispatch();
  const currentFolderId = useSelector(getCurrentFolderId);
  const pendingActions = useSelector(getPendingActions);

  const [folderCount, setFolderCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);

  const incrementFolderCount = () => setFolderCount((prev) => prev + 1);
  const incrementNoteCount = () => setNoteCount((prev) => prev + 1);

  const isProcessing = useSelector(getIsProcessing);

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
          name: `Note ${noteCount}`,
        })
      );
      incrementNoteCount();
    }
  };

  const createFolder = () => {
    dispatch(
      createFolderAction({
        name: `Folder ${folderCount}`,
      })
    );
    incrementFolderCount();
  };

  const deleteFolder = (folder: Folder) => {
    dispatch(deleteFolderAction(folder));
  };

  const formatState = (state: any) => JSON.stringify(state, null, 2);

  return (
    <div>
      <div>
        <h2>Folders</h2>
        {folders.map((folder) => (
          <div
            key={folder.id}
            style={{
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <label>
              <input
                type="radio"
                name="site_name"
                value={folder.id}
                checked={currentFolderId === folder.id}
                onChange={onSelectFolder}
              />
              {folder.name} - {folder.createdAt}
              <button
                style={{ marginLeft: '1rem' }}
                onClick={() => deleteFolder(folder)}
              >
                X
              </button>
            </label>
            <div style={{ marginBottom: '1rem' }}>
              <h3>Notes in folder</h3>
              {getNotesInFolder(folder).map((note) => (
                <div key={note.id}>
                  {note.name} - {note.createdAt}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={createFolder}>Create Folder</button>
      <button disabled={currentFolderId === null} onClick={createNote}>
        Create Note
      </button>
      <p style={{ marginTop: '1rem' }}>
        Queue is processing: {isProcessing ? 'true' : 'false'}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          marginTop: '3rem',
          borderTop: '1px solid #333333',
        }}
      >
        <div style={{ width: '33%' }}>
          <h2>Optimistic State</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {formatState(optimisticState)}
          </pre>
        </div>
        <div style={{ width: '33%' }}>
          <h2>Pending actions</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {formatState(pendingActions)}
          </pre>
        </div>
        <div style={{ width: '33%' }}>
          <h2>Resolved State</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{formatState(realState)}</pre>
        </div>
      </div>
      <div style={{ marginTop: '3rem', height: '700px' }}>
        <h2>Redux action dependencies</h2>
        <RenderGraph dependencyGraph={dependencyGraph} />
      </div>
    </div>
  );
};
export default App;
