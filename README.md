<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
-->


<br />
<p align="center">
<h3 align="center">Offline Redux Queue</h3>

<p align="center">
  A library for managing optimistic updates in your redux data store
</p>

<strong style="color: red">DISCLAIMER: This project is very much a work in progress, I do not recommend that you use it
in any real environment.</strong>


<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li><a href="#usage">Usage</a></li>
    <ul>
      <li><a href="#writing-optimistic-actions">Writing optimistic actions</a></li>
      <li><a href="#writing-the-network-handler">Writing the network handler</a></li>
      <li><a href="#writing-the-dependency-graph">Writing the dependency graph</a></li>
    </ul>
    <li><a href="#how-it-works">How it works</a></li>
    <ul>
      <li><a href="glossary">Glossary</a></li>
      <li><a href="committed-state">Committed state</a></li>
      <li><a href="optimistic-state">Optimistic state</a></li>
      <li><a href="execution">Execution</a></li>
    </ul>
    <li><a href="#gotchas">Gotchas</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->

## About The Project

This is a project inspired by [redux-offline](https://github.com/redux-offline/redux-offline), and does a similar job as
it covers:

- Queueing optimistic actions
- Processing the queue and making network requests to your backend
- Updating your state as a result of the actions, and handling commits/rollbacks

redux-offline works quite well, but has a big main shortcoming, in that it does not help you manage dependencies between
your entities/optimistic redux actions, which this project aims to cover too.

Using the go to TODO example, if you create some entities optimistically, e.g. a folder for organising notes, and a note
to go inside the folder:

```
// Optimistic folder entity
{
    id: 1 /* client generated temporary id */,
    folderName: 'My folder name'
}

// Optimistic note entity, linking to the optimistic folder entity (imagine you have a relational database model in your backend service)
{
    id: 1 /* client generated temporary id */,
    folderId: 1 /* references the id from the JSON above, foreign key */,
    noteContent: 'Some note content',
}
```

Then you have created a dependency between an optimistic note and an optimistic folder, where your note now depends on a
temporary id which will most likely get replaced when you actually create the entity in your API. If you don't do
anything about this, once you update your store with the new ID/other values generated by your backend, the relationship
will be broken and your note will reference a non-existent folder.

Represented as a graph using [react-graph-vis](https://github.com/crubier/react-graph-vis#readme):

![Represented as a graph](images/note-folder-dependency.png?raw=true "Represented as a graph")

You could manually manage relationships in your frontend between optimistic entities, but it is much more convenient to
have your optimistic-data framework mostly manage this for you. This lets you use the server-side representation of your
entities (e.g. by foreign keys in a relational database)
without having to duplicate all that effort in your frontend code.

This framework lets you describe relationships between redux actions using a directed dependency graph, which includes
functions for updating dependent redux actions when an optimistic action is "committed". See
the [How it works](#how-it-works) section for more details on what this means.

### Built With

This is a simple project with no external dependencies other than [redux](https://redux.js.org/) as a peer dependency.
[react-graph-vis](https://github.com/crubier/react-graph-vis#readme) is also listed as a peer dependency, but is only
required if you are making use of the debugging `RenderGraph` component.

<!-- GETTING STARTED -->

## Getting Started

This project is purely for managing data in a redux store, so you will need to have redux already installed in your
project.

  ```sh
  npm install redux
  ```

<!-- USAGE EXAMPLES -->

## Usage

This library has two main entry points, a wrapper around your root reducer, and a required `configureRuntime` function
call for setting up subscriptions. Also see `src/offlineModule/example` for a minimal demonstration application.

Example usage:

```
const store = createStore(
  makeRootReducer(rootReducer /* Your root reducer here */)
);

configureRuntime({
  store,
  /*
   * Your function which handles mapping your backend entity metadata provided by
   * optimistic actions to network requests.
   */
  networkEffectHandler: networkHandler,
  /*
   * Your dependency graph which describes dependencies between your optimistic redux-actions,
   * and includes functions for updating dependent actions.
   */
  dependencyGraph,
  /*
   * You can optionally provide a mapDependentAction function instead of a dependency
   * graph, which will need to handle updating dependent actions fully itself.
   */
  mapDependentAction?: actionUpdater,
});
```

### Writing optimistic actions

This library requires you to write actions containing a `offline` property containing metadata about your optimistic
actions.

Optimistic action example with all available fields:

```
{
  /* Normal redux action type */
  type: 'SOME_ACTION',
  /* Normal flux-style redux action data */
  payload: 'some data',
  
  /* The field which this library checks for deciding what to do with your optimistic actions. */
  offline: {
    /* Provide one of... */

    // If you provide this metadata field, the library will interpret this action has an action
    // with a network side effect, and will need to be handled by your network handler. 
    networkEffect: {
      // This can be literally anything, the the library will not access anything here.
      // This field being present on an action object signals to the library that this action
      // is an optimistic action with a network related side effect.
    },

    // If dependent === true, this signals to the library that the action depends on data
    // from a preceding network-related action. Once this action is processed, it will be dispatched
    // as it is given without doing anything extra, with the "offline" field removed.
    dependent: true,
  }
}
```

The only thing to note about handling these actions in your reducers, is that any "fulfilled" actions you map to upon
completion of a network request will be being applied on top of the committed state. The initial optimistic state will
not exist in your state, so the fulfilled action should handle the action in full.

For example you might think to write a reducer like so:

(THIS IS WRONG!!!!!)

```
switch (action.type) {
  case CREATE_NOTE: return {
    ...state,
    [action.payload.id]: action.payload // Merge a new note with an id into your state 
  }
  // Action you map to in your network handler
  case CREATE_NOTE_FULFILLED: return {
    ...state,
    [action.payload.id]: {
      // Merge optimistic state and fulfilled state
      ...state[action.payload.id],
      ...action.payload,
    }
  };
}
```

What you should actually write is this:

```
switch (action.type) {
  case CREATE_NOTE:
  case CREATE_NOTE_FULFILLED: return {
    ...state,
    // Merge a new note with an id into your state
    // Any merging of optimistic and fulfilled data needs to be handled by your
    // dependency graph (see below)
    [action.payload.id]: action.payload
  }
}
```

### Writing the network handler

You must provide a function which makes any API calls/network related behaviour, which then resolves to a redux action,
or nothing (null or undefined).

Example network handler:

```
// "offlineAction" here will be the optimistic action containing an "offline" field you created
// earlier
const networkHandler = async (offlineAction) => {
  switch (offlineAction.type) {
    // Some example optimistic actions
    case CREATE_NOTE:
      // Here is where you would make a network call to your "note" endpoint in your backend
      const result = await imaginaryApiCall(offlineAction.offline.networkEffect);
      // Here you map your result/error to a "resolved" action
      return {
        type: CREATE_NOTE_FULFILLED,
        payload: {
          // Merged data from your optimistic action/resolved action
          ...offlineAction.payload,
          // Imagine the server has returned the fields which it generates, for example
          // entity ids, timestamps and so on
          ...result.data
        }
      };
    default:
      // Returning null or undefined will simply remove your pending action from the queue, with any optimistic
      // side effects removed. If you want to simply re-apply your optimistic action with no changes coming
      // from your backend, then you should return the original action/a second "resolved" action containing
      // the data from the given "offlineAction" payload, without an "offline" field.
      //
      // Since this library automatically replays your optimistic actions on top of any resolved actions,
      // it is required to return something here if you want the optimistic action's changes to be "committed".
      //
      // dependent actions (i.e. have offline.dependent === true) do not need to be handled by this function,
      // these are handled automatically as the queue is processed.
      return null;
  }
};
```

### Writing the dependency graph

To use the default action updater, you will need to provide a dependency graph which describes dependencies between
redux actions, and provides functions which handles updating dependent optimistic actions upon network completions.

For example:

```
const dependencyGraph = createDependencyGraph([
  // Root objects describe your nodes (optimistic redux action types),
  // If your redux action does not have any dependents you can leave the dependencies
  // array empty here
  { type: CREATE_NOTE, dependencies: [] },
  {
    type: CREATE_FOLDER,
    // Here we have some actions which can contain temporary data from our optimistic "CREATE_FOLDER"
    // action, as they depend on folder entities.
    dependencies: [
      {
        // Similarly to the nodes, this is the same type as your redux-action type for creating notes. 
        type: CREATE_NOTE,
        // You will need to provide a function to tell the library if the payload
        // for the "CREATE_NOTE" action actually does depend on the "CREATE_FOLDER" action.
        dependsOn: (createFolderOptimisticAction, pendingCreateNoteAction) => {
          // In this case it checks that the folder id is the same as the optimistic id
          // generated by the client.
          return createFolderOptimisticAction.payload.id === pendingCreateNoteAction.payload.folderId;
        },
        // You will also need to provide a function which actually performs the update to the
        // optimistic "CREATE_NOTE" action. This will only be executed if your "dependsOn" function
        // returned true.
        updateDependency: (originalAction, fulfilledAction, pendingAction) =>
          // For this example we simply create a new "CREATE_NOTE" action, which will replace
          // the old pending CREATE_NOTE action, but you are free to update the actions in whatever
          // way you prefer, e.g. by merging data in the action manually.
          // Note that the "fulfilledAction" is whatever you returned from your network handler
          // when you made an API call to create your folder, including any error actions. If you
          // want to skip creating a note (i.e. delete the optimistic note), then you can return
          // the "DELETE_PENDING_ACTION" symbol which is made available by the library here instead.
          createNote({
            ...pendingAction.payload,
            folderId: fulfilledAction.payload.id,
          }),
      },
    ],
  },
]);
```

See the `src/offlineModule/example` folder for more examples on how to write this graph. There is also a utility react
component for debugging which is exported as `RenderGraph`, simply pass your dependency graph as a prop. This requires
you to install the `react-graph-vis` package described in peer dependencies.

## How it works

This section describes how the library works in a bit more detail if you are interested.

### Glossary

There's a couple of terms repeated in the readme which are important to know about, mainly "optimistic" and "committed".

- "optimistic" is used here to refer to redux actions which are reflected in your client state before your backend has
  confirmed the network side effect associated with it has completed successfully.
- "committed" is used here to refer to redux actions which have been confirmed by your backend, and are then added to
  the base redux state for replaying other pending optimistic actions.

### Committed state

This library keeps a duplicate redux state under the "offline" field in your redux store. This state reflects the state
of all your committed actions. This does mean your memory footprint might be larger than normal, but for most
applications this shouldn't be too much of a problem.

### Optimistic state

The state you see under your normal fields in the redux store is the optimistic state, and is the result of applying all
your optimistic actions in order on top of your committed state.

### Execution

Any optimistic action you dispatch to your redux store, doesn't immediately get "committed" to your state. The library's
root reducer instead adds it to a queue, which will be processed when your web browser has a network connection. Each
optimistic actions gets processed one at a time in the order they were dispatched originally, calling back into your
network effect handler, with the results then getting applied to the committed state.

Whenever an action gets applied to the committed state, the optimistic state gets rebuilt by applying your optimistic
actions on top of the committed state again. This in effect merges the optimistic actions into your state which you are
then free to use in your application, with any rollbacks/updates being applied automatically based on the dependency
graph you provide.

If you dispatch a non-optimistic action (e.g. some UI action you want to store in your state), this will be applied
instantly to your committed state, with the optimistic actions being replayed on top of this action.

Processing optimistic actions in this way removes a lot of cognitive overhead in trying to understand what's happening
with real vs optimistic actions, and any rollbacks/updates as a result of your backend calls.

## Gotchas

- Any state which can be temporary/managed by the library should be kept in redux. If you duplicate state from redux
  into component-local react state for example (if you are using react), then when your backend confirms/denies your
  optimistic action, the local state will become stale and will no longer refer to the state you think it does. It can
  be tempting to copy things like "selected ids" into some local state, but you should not do this if there's a
  possibility that the id is a client-generated id which will be replaced later on by your dependency graph.

<!-- ROADMAP -->

## Roadmap

- Support for custom redux-store key other than `offlineQueue`
- Serialisation support/documentation
- redux-observable support - actions are replayed quite often, need to be able to hide replay-actions from
  redux-observable
- Look at implementing parallel network request streams for independent action trees
- Idempotence support via generating unique client-side identifiers to prevent duplicate entities being created for
  example## Acknowledgements
- Hooks for updating local state in the application?
