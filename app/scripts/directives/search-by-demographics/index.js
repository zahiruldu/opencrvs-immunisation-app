'use strict'

var moment = require('moment')

module.exports = function (Api, loadResource, $q, state, FormBuilderService) {
  var createParametersResource = function (formFields) {
    var resource = {
      resourceType: 'Patient',
      name: [
        {
          given: [ formFields.givenName ],
          family: [ formFields.familyName ]
        }
      ],
      gender: formFields.gender,
      birthDate: moment(formFields.birthDate).format('YYYY-MM-DD')
    }

    return {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'resource',
          resource: resource
        },
        {
          name: 'count',
          valueInteger: 100
        },
        {
          name: 'onlyCertainMatches',
          valueBoolean: false
        }
      ]
    }
  }

  return {
    restrict: 'EA',
    templateUrl: 'app/scripts/directives/search-by-demographics/view.html',
    scope: {},
    link: function (scope) {
      var submit = function (form) {
        var defer = $q.defer()

        scope.$on('clear-search-form', () => {
          FormBuilderService.resetForm(scope.state.FormBuilderDemographics, form)
        })

        var formFieldsValues = {}
        for (var k in form) {
          if (form.hasOwnProperty(k)) {
            if (typeof form[k] === 'object' && form[k].hasOwnProperty('$modelValue') && form[k].$dirty) {
              formFieldsValues[k] = form[k].$modelValue
            }
          }
        }

        var body = createParametersResource(formFieldsValues)

        // save partial patient demographics so they can be used for creating a patientRef
        state.setPartialPatientDemographics(body.parameter[0].resource)

        Api.Patients.match(body, function (bundle) {
          state.setSearchResults(bundle.entry)
          state.setSearchType('demographics')
          defer.resolve({ isValid: true, msg: 'Search Successful' })
        }, function (err) {
          console.error(err)
          defer.reject({ isValid: false, msg: err.statusText || 'Could not connect to server' })
        })

        return defer.promise
      }

      scope.state = {}
      scope.state.FormBuilderDemographics = {
        name: 'searchByDemographics',
        displayType: null,
        globals: {
          viewModeOnly: false,
          showDraftSubmitButton: false,
          showReviewButton: false,
          messageTimeout: 5000
        },
        sections: [],
        buttons: {
          submit: 'search'
        },
        submit: {
          execute: submit,
          params: []
        },
        saveAsDraft: false,
        searchByDemographics: {}
      }

      loadResource.fetch('app/scripts/directives/search-by-demographics/form.json').then(function (formSection) {
        scope.state.FormBuilderDemographics.sections.push(formSection)
      })
    }
  }
}
