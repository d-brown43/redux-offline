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

<strong style="color: red">DISCLAIMER: This project is very much a work in progress, I do not recommend that you use it in any real environment.</strong>



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
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <ul>
      <li><a href="#writing-optimistic-actions">Writing optimistic actions</a></li>
      <li><a href="#writing-the-network-handler">Writing the network handler</a></li>
      <li><a href="#writing-the-action-updater">Writing the action updater</a></li>
    </ul>
    <li><a href="#roadmap">Roadmap</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->

## About The Project

This is a project inspired by [redux-offline](https://github.com/redux-offline/redux-offline), which works quite well,
but has a big main shortcoming, in that it does not help you manage your optimistic-dependent entities.

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

You could manually manage relationships in your frontend between optimistic entities, but it is much more convenient to
have your optimistic-data framework mostly manage this for you. This lets you use the server-side representation of your
entities (e.g. by foreign keys in a relational database)
without having to duplicate all that effort in your frontend code.

This framework lets you describe relationships between entities, describe how to update the relationships, and all the
state changes are handled for you.

### Built With

This is a simple project with no external dependencies other than [redux](https://redux.js.org/) as a peer dependency.

<!-- GETTING STARTED -->

## Getting Started

This is a pretty straightforward library, that only requires you to have redux installed as a prerequisite.This project
is purely for managing data in a redux store, so you will need to have redux already installed in your project.

  ```sh
  npm install redux
  ```

<!-- USAGE EXAMPLES -->

## Usage

This library has two main entry points, a wrapper around your root reducer, and a required `configureRuntime` function
call. Also see `./example` for a minimal demonstration application. 

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
   * Your function which handles updating dependent pending actions.
   */
  mapDependentAction: actionUpdater,
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

### Writing the action updater
You will need to provide a function which updates actions that depend on other optimistic actions for the library to work
as expected.

For example:
```
const actionUpdater = (
  // This is the original optimistic action which you dispatched originally
  originalAction,
  // This is the action you mapped to in your networkHandler
  fulfilledAction,
  // This is a pending action which is still to be processed in the queue.
  // Note that this can also be a dependent action, i.e. it is not just a network-related action.
  // If the pending action does not depend on the originalAction/fulfilledAction, you should
  // return it, or something falsy from this function for it to remain unchanged.
  pendingAction
) => {
  switch (originalAction.type) {
    case CREATE_NOTE:
      switch (pendingAction.type) {
        // Imagine you have a dependent action which makes use of a temporary value you
        // created inside your CREATE_NOTE action, an id for example
        case SET_CURRENT_NOTE:
          // If your pending action depends on the original action's id
          if (pendingAction.payload === originalAction.payload.id) {
            return {
              ...pendingAction,
              // Then we can create a new action with the fulfilled value instead 
              payload: fulfilledAction.payload.id,
            };
          }
          break;
      }
      break;
    case DELETE_NOTE:
      switch (pendingAction.type) {
        case SET_CURRENT_NOTE:
          if (pendingAction.payload === originalAction.payload.id) {
            // In this case we have an optimistic action "DELETE_NOTE",
            // with a dependent action "SET_CURRENT_NOTE". Since the note you depend on
            // no longer exists, you will likely want to take action to remove references
            // to the now deleted note from your dependent-optimistic actions.
            // To simply remove the optimistic "SET_CURRENT_NOTE" action, you can return
            // the "DELETE_PENDING_ACTION" symbol which is exported by the library.
            // You can also map to other actions to take special action in the case of a deletion.
            return DELETE_PENDING_ACTION;
          }
      }
  }
  return null;
};
```

<!-- ROADMAP -->

## Roadmap

- Support for custom redux-store key other than `offlineQueue`
- Serialisation support/documentation
- redux-observable support - actions are replayed quite often, need to be able to hide replay-actions from
  redux-observable
- Idempotence support via generating unique client-side identifiers to prevent duplicate entities being created for
  example## Acknowledgements
