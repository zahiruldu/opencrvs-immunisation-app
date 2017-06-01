'use strict'

var app = require('angular').module('rcbsApp')

app.directive('header', require('./header'))
app.directive('patientsList', require('./patients-list'))
app.directive('patientsListRowDetails', require('./patients-list-row-details'))
app.directive('searchById', require('./search-by-id'))
app.directive('searchByDemographics', require('./search-by-demographics'))
app.directive('patientDetailsBar', require('./add-cbs-events/patient-details-bar'))
app.directive('cbsEventSelector', require('./add-cbs-events/cbs-event-selector'))
app.directive('linkageToCare', require('./add-cbs-events/linkage-to-care'))
