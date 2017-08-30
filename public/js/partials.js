angular.module('partials', [])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/nav.html', [
'',
'<li ng-class="getClass(\'/katalog\')"><a href="#" pdf></a></li>',
'<li class="dropdown"><a href="#" data-toggle="dropdown" class="dropdown-toggle">Dodaj stronę<span class="caret"></span></a>',
'  <ul class="dropdown-menu">',
'    <li>',
'      <addpage></addpage>',
'    </li>',
'  </ul>',
'</li>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/katalog.html', [
'',
'<ul ui-sortable="sortPages" ng-model="pages" ng-class="tileSize" class="pages-list">',
'  <li ng-repeat="page in pages" class="page"><a class="page-image {{page.status}}"><img ng-src="http://localhost:3000/jpg/w100/{{page.svg.file | encodeFilename}}.jpg{{page.nocache}}" type="image/jpg" width="100" height="141"></a><a ng-show="page.needsRefresh" ng-click="refresh($index)" class="spinner"><span ng-class="{\'m-refreshing\': page.refreshing}" class="glyphicon glyphicon-refresh"></span><span ng-hide="page.refreshing" class="spinner-label">Odśwież</span></a>',
'    <div ng-show="cutting" paste="pastePage({{$index}})" class="spinner"><span class="glyphicon glyphicon-hand-left"></span></div>',
'    <div ng-show="isPrinting" class="spinner"><span class="glyphicon glyphicon-print"></span></div>',
'    <div role="toolbar" ng-class="{\'btn-group-vertical\': tileSize == \'m-smallTiles\' }" class="controls btn-group btn-group-sm">',
'      <button title="Podgląd" data-index="$index" ng-click="preview($index)" class="btn btn-primary"><span class="glyphicon glyphicon-search"></span></button>',
'      <button title="Wytnij" data-index="{{$index}}" ng-click="cutPage($index)" class="btn btn-primary"><span class="glyphicon glyphicon-transfer"></span></button>',
'      <div class="btn-group btn-group-sm">',
'        <button data-toggle="dropdown" title="Podmień na nową" class="btn btn-primary"><span class="glyphicon glyphicon-refresh"></span></button>',
'        <ul class="dropdown-menu">',
'          <li>',
'            <addpage data-index="{{$index}}"></addpage>',
'          </li>',
'        </ul>',
'      </div>',
'      <button disablepage title="Wyłącz stronę" class="btn btn-primary"><span class="glyphicon glyphicon-off"></span></button>',
'      <button print title="Drukuj" class="btn btn-primary"><span class="glyphicon glyphicon-print"></span></button><a ng-click="edit($index)" title="Edytuj w Inkscape" class="btn btn-primary"><span class="glyphicon glyphicon-edit"></span></a><a data-index="{{$index}}" title="Zapisz jako" ng-href="http://localhost:3000/jpg/w800/{{page.svg.file | encodeFilename}}.jpg" download class="btn btn-primary"><span class="glyphicon glyphicon-download"></span></a>',
'      <button delete data-index="{{$index}}" title="Usuń" class="delete btn btn-primary"><span class="glyphicon glyphicon-trash"></span></button>',
'    </div><span data-index="{{$index}}" class="name">{{page.svg.file}}</span><span class="page-number">\- {{$index +1 }} \-</span>',
'  </li>',
'</ul>',''].join("\n"));
}]);