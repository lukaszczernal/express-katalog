'use strict'

### Sevices ###

angular.module('app.services', [])

.factory 'version', ->
	"0.2"

# .factory 'pages', ($rootScope, $http, $q) ->
#   save: ->
#     $http.post('http://localhost:3000/api/save/dd')

#   load: ->
# 	  console.log 'factory loading'
# 	  $http.get('http://localhost:3000/api/pages')

.service 'pagesSrv', ($rootScope, $http, $q) ->
  @save = (json) ->
    $http.post('http://localhost:3000/api/save', {jsondata: JSON.stringify(json)})

  @load = ->
    $http.get('http://localhost:3000/api/pages')

  @pdf = (json) ->
    console.log 'generationg PDF'
    $http.post('http://localhost:3000/api/pdf', {jsondata: JSON.stringify(json)})

  @delete = (index) ->
    console.log 'deleting page number ' + (parseInt(index,10) + 1)
    $http.get('http://localhost:3000/api/delete/' + index)

  @edit = (index) ->
    console.log 'edit page number ' + (index + 1)
    $http.get('http://localhost:3000/api/edit/' + index)

  @refresh = (index) ->
    console.log 'refreshing page number ' + (index + 1)
    $http.get('http://localhost:3000/api/refresh/' + index)

  # @add = (file) ->
  #   console.log 'service - adding file'
  #   $http.post('http://localhost:3000/api/add')

  @upload = (form) ->
    def = new $.Deferred()
    $(form).ajaxSubmit
      url: 'http://localhost:3000/api/add'
      type: 'POST'
      timeout: 600000 # have you ever seen a 10min timeout? I bet not.
      success: (response) ->
        def.resolve response
      error: (response) ->
        console.log('srv upload error');
        def.reject response

    def.promise()
