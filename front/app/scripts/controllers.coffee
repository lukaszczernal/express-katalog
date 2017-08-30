'use strict'

### Controllers ###

angular.module('app.controllers', ['ui.sortable'])

.controller('AppCtrl', [
  '$scope'
  '$location'
  '$resource'
  '$rootScope'

($scope, $location, $resource, $rootScope) ->

  # Uses the url to determine if the selected
  # menu item should have the class active.
  $scope.$location = $location
  $scope.$watch('$location.path()', (path) ->
    $scope.activeNavId = path || '/'
  )

  # getClass compares the current url with the id.
  # If the current url starts with the id it returns 'active'
  # otherwise it will return '' an empty string. E.g.
  #
  #   # current url = '/products/1'
  #   getClass('/products') # returns 'active'
  #   getClass('/orders') # returns ''
  #
  $scope.getClass = (id) ->
    if $scope.activeNavId.substring(0, id.length) == id
      return 'active'
    else
      return ''
])


.controller('PagesCtrl', ($scope, $q, pagesSrv, $filter) ->

  $scope.pages    = []
  $scope.tileSize = 'm-smallTiles'

  $scope.cutting      = false
  $scope.cutPageIndex = null
  $scope.isPreview    = false
  $scope.isLoading    = false

  $scope.cutPage = (index) ->
    $scope.cutting      = true
    $scope.cutPageIndex = index

  $scope.pastePage = (index) ->
    cutPage = $scope.pages[$scope.cutPageIndex]         # GET PAGE WE WANT TO MOVE
    $scope.pages.splice index, 0, cutPage               # PASTE THE PAGE

    # CUT OUT the PAGE from an OLD PLACE
    # IF THE PAGE WAS TAKEN FROM SUBSEQUENT PLACE THEN THE ONE THAT WAS CHOSEN
    # TO PLACE THE PAGE THAN WE NED TO ADJUST ITS INDEX
    $scope.cutPageIndex++ if index <= $scope.cutPageIndex
    $scope.pages.splice $scope.cutPageIndex, 1

    $scope.cutting = false
    $scope.save()

  $scope.sortPages =
    stop: (e, ui) ->
      $scope.save()

  $scope.changeTileSize = (size) ->
    $scope.tileSize = size
    false

  loadpages = ->
    pagesSrv.load()
    .success (response) ->
      $scope.pages = response
    .error (status, error) ->
      console.log 'not loaded', status, error

  $scope.save = ->
    pagesSrv.save($scope.pages)
    .success (response) ->
      console.log 'save success: ', response
    .error (status, error) ->
      console.log 'save error: ', status, error

  $scope.delete = (index) ->
    pagesSrv.delete(index)
    .success (response) ->
      $scope.pages.splice(index, 1)
      $scope.save()
      console.log 'delete success: ', response
    .error (status, error) ->
      console.log 'delete error: ', response, error

  $scope.deletePageFiles = (index) ->
    pagesSrv.delete(index)
    .error (status, error) ->
      console.log 'delete error: ', response, error

  $scope.upload = (form) ->
    pagesSrv.upload(form)
    .always ->
      $scope.hideLoader()

  $scope.edit = (index) ->
    if isNaN(index) then return false;
    $scope.pages[index].needsRefresh = true
    $scope.save()
    pagesSrv.edit(index)

  $scope.refresh = (index) ->
    if isNaN(index) then return false;
    $scope.pages[index].refreshing = true
    pagesSrv.refresh(index).then ->
      delete $scope.pages[index].needsRefresh
      delete $scope.pages[index].refreshing
      $scope.pages[index].nocache = '?' + new Date().getTime()
      $scope.save()


  $scope.pdf = (pages) ->
    pagesSrv.pdf(pages)
    .success (response) ->
      console.log 'PDF generated! ', response
    .error (status, error) ->
      console.log 'Error occured while generating PDF: ', status, error

  $scope.print = (page) ->
    pagesSrv.pdf(page)

  $scope.preview = (page) ->
    previewPage = $scope.pages[page].svg.file
    $scope.previewImgURL = "jpg/w800/" + $filter('encodeFilename')(previewPage) + ".jpg"
    $scope.isPreview = true

  $scope.hidePreview = () ->
    $scope.isPreview = false

  $scope.showLoader = () ->
    $scope.$apply () ->
      $scope.isLoading = true

  $scope.hideLoader = () ->
    $scope.$apply () =>
      $scope.isLoading = false

  loadpages()
)


# .controller('TodoCtrl', [
#   '$scope'

# ($scope) ->

#   $scope.todos = [
#     text: "learn angular"
#     done: true
#   ,
#     text: "build an angular app"
#     done: false
#   ]

#   $scope.addTodo = ->
#     $scope.todos.push
#       text: $scope.todoText
#       done: false

#     $scope.todoText = ""

#   $scope.remaining = ->
#     count = 0
#     angular.forEach $scope.todos, (todo) ->
#       count += (if todo.done then 0 else 1)

#     count

#   $scope.archive = ->
#     oldTodos = $scope.todos
#     $scope.todos = []
#     angular.forEach oldTodos, (todo) ->
#       $scope.todos.push todo  unless todo.done

# ])

# .controller('MyCtrl1', [
#   '$scope'

# ($scope) ->
#   $scope.onePlusOne = 2

# ])

# .controller('MyCtrl2', [
#   '$scope'

# ($scope) ->
#   $scope
# ])
