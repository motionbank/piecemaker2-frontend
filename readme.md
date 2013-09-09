# App Tips

## Shortcuts

- `CTRL/CMD + S` → save current form
- `?` → open help-box

## Misc

Columns in group detail view are resizable.

# Todos

- use [RequireJS](http://requirejs.org/) to load views/controllers/models when they're needed
- protect routes depending on user group/check some security matters → adding user management

# Coding Tips

Some general information about frontend development

## Frameworks/Dependencies/Libraries

- [Underscore](http://underscorejs.org/)
- [Backbone](http://backbonejs.org/)
- [Mustache](http://mustache.github.io/)
- [jQuery](http://jquery.com/)
- [jQuery UI](http://jqueryui.com/)
- [jQuery Transit](http://ricostacruz.com/jquery.transit/)

## CSS Authoring

Stylesheets are written in Sass/[Compass](http://compass-style.org/), so every developer have to use it's compiler.
See the ./config.rb for additional information.

[Bourbon](http://bourbon.io/) is included also.

### PhpStorm

Some information for setting up PhpStorm while using RVM and OS X:
Go to "Projects Settings - File Watchers" and add a custom file watcher with the following options:

![PhpStorm File Watcher](http://gopeter.de/misc/filewatcher.png)

If you are using RVM, you have to add an environment variable:

`GEM_PATH : path to your ruby version`

For example:

`GEM_PATH : /Users/peter_goebel/.rvm/gems/ruby-2.0.0-p247`

### External file watcher

If you are using another code editor, you can run an external file watcher, e.g. Scout [Scout](mhs.github.io/scout-app/) or [Prepos](http://alphapixels.com/prepros/).


## HTTP Static File Serving
... used by [.app](https://github.com/motionbank/piecemaker2-app) but might be helpful for others as well.

```
$ cd piecemaker2-frontend
$ bundle install

$ rake daemon[start]
$ open http://localhost:50726

$ rake daemon[status]
$ rake daemon[stop]
```

