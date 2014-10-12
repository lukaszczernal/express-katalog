'use strict'

### Directives ###

# register the module with Angular
angular.module('app.directives', [
  'app.services'
])

.directive('tooltip', () ->
	restrict: 'A'
	link: (scope, element) ->
		$(element).tooltip()
)

.directive('loadpages', () ->
	restrict: 'A'
	template: 'Load pages'
	link: (scope, element) ->
		$(element).bind('click', (e) ->
			e.preventDefault()
			scope.loadpages()
			false
		)
)

.directive('save', () ->
	restrict: 'A'
	template: 'Save'
	link: (scope, element) ->
		$(element).bind('click', (e) ->
			e.preventDefault()
			scope.save()
			false
		)
)

.directive('pdf', () ->
	restrict: 'A'
	template: 'Zbuduj katalog'
	link: (scope, element) ->
		$(element).bind('click', (e) ->
			e.preventDefault()
			element.text 'Robi się'
			scope.pdf(scope.pages)
				.success (response) ->
					element.text 'Zbuduj katalog'
			false
		)
)

.directive('addpage', () ->
	restrict: 'E'
	template: '<form enctype="multipart/form-data"><input name="page" type="file" class="addpage"></form>'
	link: (scope, element, attrs) ->
		form = element.find('form')
		input = form.find('input[type="file"]')

		form.bind 'change', ->
			if attrs.index?		# REPLACING SELECTED PAGE WITH NEW VERSION
				upload(@)
				.done (res) ->
					page = res.data
					replace attrs.index, page
			else
				upload(@)
				.done (res) ->
					scope.pages.push res.data
					scope.save()

		replace = (index, page) ->
			scope.deletePageFiles(index)
			.success (res) ->
				scope.pages[index] = page
				scope.save()

		upload = (form) ->
			def = new $.Deferred()

			scope.upload(form)
			.done (res) ->
				res = JSON.parse(res)
				if res.status is 'ok'
					def.resolve res
				else
					onUploadPageFail res
					def.reject res

			.fail (failResp) ->
				onUploadPageFail failResp
				def.reject failResp

			def.promise()

		onUploadPageFail = (res) ->
			console.log 'submit error', res

)

.directive 'delete', () ->
	(scope, element, attrs) ->
		$(element).click (e) ->
			e.preventDefault()
			index = parseInt attrs.index, 10
			if confirm 'Czy na pewno chcesz usunąć stronę? ' + '[' +  (index + 1)  + ']'
				scope.delete index
			false

.directive 'edit', () ->
	(scope, element, attrs) ->
		$(element).click (e) ->
			e.preventDefault()
			index = attrs.index
			scope.edit index
			false

.directive 'cut', () ->
	(scope, element, attrs) ->
		$(element).click (e) ->
			e.preventDefault()
			index = attrs.index

			# SET ISCUT SELECTION FOR THIS PAGE
			# scope.isCut = true

			# if (scope.cutting && scope.isCut) || not scope.cutting
			# 	scope.isCut = !scope.isCut
			# 	scope.setCutting scope.isCut, index
			# 	scope.$apply()

			scope.$apply(attrs.cut)

			false

.directive 'paste', () ->
	(scope, element, attrs) ->

		$(element).click (e) ->
			e.preventDefault()

			# index = attrs.index
			# console.log 'paste page nr ' + scope.cutPageIndex + ' before page nr ' + (parseInt(index,10)+1)

			scope.$apply(attrs.paste)

			false

.directive 'print', () ->
	(scope, element) ->
		$(element).click (e) ->
			e.preventDefault()
			printframe = $('#printFrame')

			printframe.load ->
				printframe[0].contentWindow.print()

			printframe[0].src = 'svg/' + scope.page.svg.file

			console.log scope.page

			false

.directive 'disablepage', () ->
	(scope, element) ->
		$(element).click (e) ->
			e.preventDefault()
			if scope.page.status is 'disable'
				scope.page.status = 'enable'
			else
			 	scope.page.status = 'disable'

			scope.save()

			false

.directive 'lazySrc', ($window, $document) ->

	class lazyLoader
		@test: 'test1'

	class lazyImage
		constructor: () ->
			console.log 'lazy image created'

	{
	restrict: 'A'
	link: ($scope, $element) ->
		console.log lazyLoader.test
	}


