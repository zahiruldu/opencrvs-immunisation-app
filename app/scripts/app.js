'use strict'

const moment = require('moment')
const angular = require('angular')
const ngRoute = require('angular-route')
const ngCookies = require('angular-cookies')
const ngResource = require('angular-resource')
const ngMessages = require('angular-messages')
const ngMaterial = require('angular-material')
const mdDataTable = require('angular-material-data-table')
const formBuilder = require('md-form-builder')

require('angular-timeline')

const dependencies = [ ngRoute, formBuilder, ngMaterial, ngCookies, ngResource, ngMessages, mdDataTable, 'angular-timeline' ]
const app = angular.module('rcbsApp', dependencies)

app.config(function ($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'app/views/landing.html'
  })
  .when('/patients', {
    templateUrl: 'app/views/patients.html',
    controller: 'PatientsControl'
  })
  .when('/add-patient', {
    templateUrl: 'app/views/add-patient.html',
    controller: 'AddPatientControl'
  })
  .when('/patients/:patientId/add-events', {
    templateUrl: 'app/views/add-cbs-events.html',
    controller: 'AddCbsEventsControl'
  })
  .when('/events/:patientId', {
    templateUrl: 'app/views/view-cbs-events.html',
    controller: 'ViewCbsEventsControl'
  })
  .otherwise({
    redirectTo: '/'
  })
})

app.config(function ($locationProvider) {
  $locationProvider.hashPrefix('') // Remove ! from url
})

/* ------------- CUSTOM THEMING ---------------- */
app.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('light-blue')
    .accentPalette('orange')
})
// TODO: Update styles based on design - Using default for now
// app.config(function ($mdThemingProvider) {
//   var customPrimary = {
//     '50': '#52f220',
//     '100': '#42eb0e',
//     '200': '#3bd30c',
//     '300': '#35bb0b',
//     '400': '#2ea309',
//     '500': '#278B08',
//     '600': '#207307',
//     '700': '#195b05',
//     '800': '#134304',
//     '900': '#0c2b02',
//     'A100': '#65f438',
//     'A200': '#77f551',
//     'A400': '#8af669',
//     'A700': '#051201'
//   }
//   $mdThemingProvider.definePalette('customPrimary', customPrimary)

//   var customAccent = {
//     '50': '#0d5179',
//     '100': '#106190',
//     '200': '#1270a7',
//     '300': '#157fbe',
//     '400': '#178fd5',
//     '500': '#1f9de6',
//     '600': '#4db1ec',
//     '700': '#64bbee',
//     '800': '#7bc5f1',
//     '900': '#92cff3',
//     'A100': '#4db1ec',
//     'A200': '#36A7E9',
//     'A400': '#1f9de6',
//     'A700': '#a9d9f6'
//   }
//   $mdThemingProvider.definePalette('customAccent', customAccent)

//   $mdThemingProvider.theme('default')
//     .primaryPalette('customPrimary')
//     .accentPalette('customAccent')
// })
/* ------------- CUSTOM THEMING ---------------- */

app.config(function ($mdDateLocaleProvider) {
  $mdDateLocaleProvider.formatDate = function (date) {
    return date ? moment(date).format('YYYY-MM-DD') : date
  }
})

function loadConfig () {
  var initInjector = angular.injector(['ng'])
  var $http = initInjector.get('$http')

  return $http.get('app/config/default.json').then(function (response) {
    app.constant('config', response.data)
  }, function (err) {
    app.constant('config', 'No Config Loaded')
    console.error(err)
  })
}

function bootstrapApplication () {
  require('./directives')
  require('./services')
  require('./controllers')

  angular.element(document).ready(function () {
    angular.bootstrap(document, ['rcbsApp'])
  })
}

loadConfig().then(bootstrapApplication)
