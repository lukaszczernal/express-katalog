'use strict'

### Filters ###

angular.module('app.filters', [])

.filter('interpolate', [
  'version',

(version) ->
  (text) ->
    String(text).replace(/\%VERSION\%/mg, version)
])

.filter('encodeFilename', ()->
  (filename) ->
    filename.split(' ').join('_')
)
