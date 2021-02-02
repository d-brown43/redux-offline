<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<br />
<p align="center">
<h3 align="center">Offline Redux Queue</h3>

  <p align="center">
    A library for managing optimistic updates in your redux data store
  </p>
</p>



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
    <li><a href="#roadmap">Roadmap</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This is a project inspired by [redux-offline](https://github.com/redux-offline/redux-offline), which works quite well, but has a big main shortcoming,
in that it does not help you manage your optimistic-dependent entities.

Using the go to TODO example, if you create some entities optimistically, e.g. a folder for organising notes, and a note to go inside the folder:

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

Then you have created a dependency between an optimistic note and an optimistic folder, where your note
now depends on a temporary id which will most likely get replaced when you actually create the entity in your API.
If you don't do anything about this, once you update your store with the new ID/other values generated
by your backend, the relationship will be broken and your note will reference a non-existent folder.

You could manually manage relationships in your frontend between optimistic entities, but it is
much more convenient to have your optimistic-data framework mostly manage this for you. This lets
you use the server-side representation of your entities (e.g. by foreign keys in a relational database)
without having to duplicate all that effort in your frontend code.

This framework lets you describe relationships between entities, describe how to update the relationships,
and all the state changes are handled for you.

### Built With

This section should list any major frameworks that you built your project using. Leave any add-ons/plugins for the acknowledgements section. Here are a few examples.
* [redux](https://redux.js.org/)


<!-- GETTING STARTED -->
## Getting Started

This is a pretty straightforward library, that only requires you to have redux installed as a prerequisite.This project is purely for managing data in a redux store, so you will need to have redux already installed in your project.

  ```sh
  npm install redux
  ```

<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_



<!-- ROADMAP -->
## Roadmap

- Serialisation support/documentation
- Idempotence support via generating unique client-side identifiers to prevent duplicate entities being created for example## Acknowledgements
