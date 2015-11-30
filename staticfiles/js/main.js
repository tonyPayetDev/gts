/* The angular module of gtsApp. The config httpProvider is here to
 * active a wait cursor to notify the user a request is running. To
 * active this feature, just add `<div id="loading-cloak"
 * ng-if="feedback.loading"></div>` in your html source after
 * declaring ng-app directive, see the document.html for an example*/

 var gtsApp = angular.module('gtsApp', ['gettext', 'cfp.hotkeys', 'ui.router','ngDragDrop'])
 .config(function($httpProvider) {
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

        $httpProvider.interceptors.push(function($q, feedback) { // intercepter le fait que la requête est envoyé et qu'on a eu la réponse. 
          var _runningRequest = 0;

          return {
                request: function(config) { // notifier de se mettre en mode chargement
                  _runningRequest++;
                  feedback.loading = true;
                  return config;
                },

                response: function(response) { // cesser le mode de chargement. -> cf. documents.html
                  _runningRequest--;
                  if (_runningRequest <= 0) {
                    feedback.loading = false;
                  }
                  return response;
                },

                responseError: function(rejection) {
                  _runningRequest--;
                  if (_runningRequest <= 0) {
                    feedback.loading = false;
                  }
                  return $q.reject(rejection);
                }
              };
            });
      })
.config(function(hotkeysProvider) {
  hotkeysProvider.includeCheatSheet = false;
})
.run(function(gettextCatalog) {
        // gettextCatalog.setCurrentLanguage(CURRENT_USER_LANGUAGE);
        gettextCatalog.setCurrentLanguage("fr");
      });

gtsApp.service('feedback', function($rootScope) {
  
  $rootScope.feedback = this;
  this.loading = false;
});

gtsApp.controller('initialize', function($scope, $timeout, feedback) {
  $scope.init = true;
  var timeout = null;


  $scope.$watch(function() {
    return feedback.loading
  }, function(newData) {
    if (newData != undefined) {
      if (timeout)
        $timeout.cancel(timeout);

      timeout = $timeout(function() {
        $scope.init = newData;
      }, 560);
    }
  });
  
});

/* angular service, register functions from a controller to repeat
* them every refreshRate seconds */

gtsApp.service('refresher', function($timeout) {
  
  var refresher = this;
  this.refreshRate = 60;
  this.autoRefresh = true;

  var _countdown = this.refreshRate;
  var _refreshFunctions = [];


  this.register_refresh_function = function(refreshFunction) {
    _refreshFunctions.push(refreshFunction);
  };

  this.refresh = function() {
    $.each(_refreshFunctions, function(index, refreshFunction) {
      refreshFunction();
    });
    _countdown = this.refreshRate;
  };

  function _tick() {
    if (refresher.autoRefresh) {
      _countdown -= 1;
    }
    if (_countdown <= 0) {
      refresher.refresh();
    }
    $timeout(_tick, 1000);
  }
  _tick();
  
});

/* gtsTable directive. Plug an array of javascript objects to a table
 * with dataTable js library. THE gtsTable DIRECTIVE CAN USE ONLY ONE
 * TIME BY CONTROLLER SCOPE otherwise non predictable behavior will
 * happen. If you have N tables ruled by gtsTable on the same page,
 * create N controllers and share data beween them if necessary.
 *
 * When using gtsTable, you must define in your controller the
 * $scope.tableOptions var defining the columns of the table. See
 * http://datatables.net/reference/option/columns.data#Examples for
 * more details.
 *
 * use case:
 * in the html:
 * <table gts-table table-data="data" apply-after-change="aFonction()"></table>
 * in js file:
 * $scope.tableOptions = {
 *   columns: [
 *    { "data": "attr1" },
 *    { "data": "attr2" },
 *     ...
 *   ]
 *  }
 *
 * applyAfterChange is here to be automatically run each time
 * tableData change. It is optional.
 */

 gtsApp.directive('gtsTable', function() {
  return {
    restrict: 'EAC',
    link: function(scope, element, attrs) {
            /**
             * Init dataTable
             */
             element.addClass('gts-table');

             if (attrs.addSearchTool !== "false") {
                // Add a text input for searching on each column
                var search_row = $('<tr class="column-search-row"></tr>').appendTo($('thead', element));
                $('thead th', element).each(function() {
                  var title = $('thead th', element).eq($(this).index()).text();
                  search_row.append('<th><input class="form-control input-sm column-search" type="text" /></th>');
                });
              }

              var defaultOptions = {
                paging: false,
                searching: true,
                info: false,
                autoWidth: false,
                orderCellsTop: true,
                dom: 'rt'
              };

              var options = $.extend({}, defaultOptions, scope.tableOptions);
            // Create the dataTable
            // var dataTable = element.DataTable(options);
            scope.dataTable = element.DataTable(options);

            if (attrs.addSearchTool !== "false") {
                // Apply the search
                scope.dataTable.columns().eq(0).each(function(colIdx) {
                  if (!options['scrollY']) {
                    element.find('tr.column-search-row th').eq(colIdx).find('input').on('keyup change', function() {
                      scope.dataTable.column(colIdx).search(this.value).draw();
                    });
                  } else {
                    element.parent().parent().children().first().find('tr.column-search-row th').eq(colIdx).find('input').on('keyup change', function() {
                      scope.dataTable.column(colIdx).search(this.value).draw();
                    });
                  }
                });
              }

              scope._adaptColumns = function() {
                if (scope.dataTable.page.info().pages == 0)
                  scope.dataTable.columns.adjust().draw();
              };

            // watch for any changes to our data, rebuild the DataTable
            scope.$watch(attrs.tableData, function(newData) {
              if (newData) {
                scope.$emit('killRows');
                scope.dataTable.clear().rows.add(scope.$eval(attrs.tableData)).draw();
                attrs.applyAfterChange ? scope.$eval(attrs.applyAfterChange, /\(.*\)/.exec(attrs.applyAfterChange)[0].slice(1, -1)) : null;
              }
            });

            scope.$watch(function() {
              return element.width();
            }, function(newData) {
              if (newData) {
                scope._adaptColumns();
              }
            });
          }
        };
        
      });

/**
 * Directive for creating date pickers
 */

 gtsApp.directive('datePicker', function() {
  return {
    restrict: 'AC',
    link: function(scope, element, attrs) {
      scope.isOpen = false;

            /**
             * Shortcut listening.
             * Must be defined BEFORE the declaration of datetimepicker because
             * datetimepicker do an event.preventDefault() on keydown, we would never be notified.
             */
             var hotkeysMap = {
                72: 'h', // yesterday
                65: 'a', // today
                68: 'd' // tomorrow
              };
              element.on('keydown', function(event) {
                // trigger the hotkey only if we have the focus on the date picker
                if (scope.isOpen || element.get() === document.activeElement) {
                    // listen for hotkeys "a", "h" and "d"
                    if (event.which in hotkeysMap) {
                      event.stopPropagation();
                      var date = null;
                      switch (hotkeysMap[event.which]) {
                        case 'h':
                        date = moment().subtract(1, 'days');
                        element.datetimepicker('hide');
                        element.blur();
                        break;
                        case 'a':
                        date = moment();
                        element.datetimepicker('hide');
                        element.blur();
                        break;
                        case 'd':
                        date = moment().add(1, 'days');
                        element.datetimepicker('hide');
                        element.blur();
                        break;
                      };
                      element.val(date.format('DD/MM/YY'));

                    }
                  }
                });

element.datetimepicker({
  lang: 'fr',
  timepicker: false,
  format: 'd/m/y',
  closeOnDateSelect: true,
  validateOnBlur: false,
  mask: '39/19/99',
  onShow: function() {
    scope.isOpen = true;
  },
  onClose: function() {
    scope.isOpen = false;
  }
});

            /**
             * We need to register this jquery event listener to update the angular data-binding.
             * We also need to register it AFTER the declaration of datetimepicker
             * so it is run after the event handler of datepicker
             */
             element.on('keydown', function() {
              element.trigger('input');
            });
           }
         };
       });

gtsApp.directive('gtsFocusable', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {

      element.find('input').each(function(ind, elt) {
        elt.onfocus = function(event) {
          element.addClass("highlighted");
        };
        elt.onblur = function(event) {
          element.removeClass("highlighted");
        };
      });

      element.find('button').each(function(ind, elt) {
        elt.onfocus = function(event) {
          element.addClass("highlighted");
        };
        elt.onblur = function(event) {
          element.removeClass("highlighted");
        };
      });
    }
  };
  
});


/* Directive to fix a DOM element as a modal window opener. Contents
 * of the modal window is define by all descendant DOM nodes following
 * the gtsModal directive (see below) 
 *
 * beforePopping is a function run before the modal window is open
 */

 gtsApp.directive('gtsModalOpener', function() {
  return {
    scope: {
      beforePopping: '&'
    },
    controller: function($scope, $element) {
      this.setUp = function(element) {
        $element.on('click', function() {
          $scope.beforePopping();
          element.dialog("open");
        });
      };
    }
  };
  
});
/* Transcluded directive, need in its parents the gtsModalOpener
 * directive.
 *
 * process() is a function run when click on Ok button.
 * modalWidth define the width of the modal window.
 * buttonName: give a name to Ok button
 */
 gtsApp.directive('gtsModal', function() {
  return {

    restrict: 'A',
    require: '^gtsModalOpener',
    transclude: true,
    scope: {
      process: '&',
      modalWidth: '@',
      buttonName: '@'
    },
    template: "<ng-transclude></ng-transclude>",
    link: function(scope, element, attrs, openerCtrl) {

      if (!scope.buttonName) {
        scope.buttonName = 'Confirm';
      }

      scope.dial = element.dialog({
        modal: true,
        autoOpen: false,
        width: scope.modalWidth,
        title: attrs.modalTitle,
        buttons: [{
          text: scope.buttonName,
          click: function() {
            scope.process();
            $(this).dialog("close");
          }
        }]
      });

      openerCtrl.setUp(element);
    }
  };
});


 gtsApp.directive('buttonSet', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {

      scope.ready = false;
            $timeout(function() { // $timeout wait for the interpolation to process

              element.buttonset();
                scope.ready = true; // to be sure the element buttonset is ready before watchers modify them

                if (attrs.disabled)
                  element.buttonset('disable');
              });

            scope.$watch(attrs.disabled, function(newData) {
              if (scope.ready) {
                if (newData)
                  element.buttonset('disable');
                else
                  element.buttonset('enable');
              }
            });

            scope.$watch(function() {
              return element.find(':checked').length;
            }, function(newData) {

              if (newData >= 0 && scope.ready)
                element.buttonset('refresh');
            });
          }
        };
      });


gtsApp.directive('listSet', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      $timeout(function() {
                // element.selectmenu();
              });
    }
  };
  
})

/*
 * use it as an attribute in input tag to automatically capitalize
 * words the user enter
 */
 gtsApp.directive('capitalize', function() {

  return {

    require: '^ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      

      var capitalize = function(inputValue) {


        if (inputValue == undefined)
          inputValue = '';

        var capitalized = inputValue.toUpperCase();

        if (capitalized !== inputValue) {

          modelCtrl.$setViewValue(capitalized);
          modelCtrl.$render();
        }

        return capitalized;
      };

      modelCtrl.$parsers.push(capitalize);
            capitalize(scope[attrs.ngModel]); // capitalize initial value
            
          }
        };
      });

/* use it if you want a user to prevent from entering more than N
* characters in an input tags */

gtsApp.directive('limitToNCharacter', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      maxChar: '@'
    },
    link: function(scope, element, attrs, modelCtrl) {

      var limitLength = function(inputValue) {

        var slice = inputValue.slice(0, scope.maxChar);
        modelCtrl.$setViewValue(slice);
        modelCtrl.$render();

        return slice;
      }

            // modelCtrl.$validators.limitLength = function(modelValue, viewValue){
            // 	return true;
            // };

            modelCtrl.$parsers.push(limitLength);
          }
        };
        
      });

/* use it to check a regex each time the user enter a word in the
* input*/

gtsApp.directive('regexInput', function() {

  return {
    restrict: 'A',
    require: 'ngModel',
    priority: 3000,
    scope: {
      regex: '@',
      paddingBeforeWith: '@',
    },
    link: function(scope, element, attrs, modelCtrl) {

            scope.stateOk = false; // just here to emit the event when
            // there is a transition no regex
            // matching (false) to matching
            // (true)

            var checkRegex = function(inputValue) {

                // inputValue.search(RegExp(scope.regex)) != 0 ? element.addClass('error-ref-input') :
                //     element.removeClass('error-ref-input');



                if (inputValue.search(RegExp(scope.regex)) != 0) {
                  element.addClass('error-ref-input');
                    scope.stateOk = false; // we don't care is stateOk was already false
                  } else {
                    element.removeClass('error-ref-input');
                    if (!scope.stateOk) { // important to know if there is a transition false to true to emit
                      scope.stateOk = !scope.stateOk;
                      scope.$emit('regexInputOk');
                    }
                  }

                  return inputValue;
                };

                modelCtrl.$validators.regex = function(modelValue, viewValue) {
                  if (element.hasClass('error-ref-input'))
                    return false;

                  return true;
                };

                element.on('blur', function() {

                var i = 0; // prevent infinit loop
                while (element.val().search(RegExp(scope.regex)) != 0 && scope.paddingBeforeWith && i < 10) {

                  element.val(function(index, val) {
                    return scope.paddingBeforeWith + val;
                  });
                  i++;
                }

                if (element.val().search(RegExp(scope.regex)) == 0)
                  element.removeClass('error-ref-input');
              });

                modelCtrl.$parsers.push(checkRegex);
              }
            };
            
          });

gtsApp.directive('toggleCollapse', function() {
  return {

    restrict: 'AC',
    link: function() {
      element.after('<button id="toggleButton"> Toggle </button>');
    },
    controller: function() {
      this.makeMeCollapsable = function(target) {

      };
    }
  };
  
});

/*
 * 
 */

 gtsApp.directive('gtsCollapsable', function() {
  return {
    restrict: 'EAC',
    link: function(scope, element, attrs) {

      scope.showMe = false;
      element.before('<p>' + attrs.gtsTitle + '</p>');
      element.prev().before('<span class="collapser-controller collapser-controller-close"></span>');
      element.hide();
      element.prev().css('cursor', 'pointer');
      element.prev().on('click', function() {
        scope.showMe = !scope.showMe;
        scope.showMe ? element.show() : element.hide();

        element.prev().prev().toggleClass('collapser-controller-open').toggleClass('collapser-controller-close')
      });

      element.prev().hover(function() {
        element.prev().css('background-color', '#d7d7d7');
      }, function() {
        element.prev().css('background-color', 'transparent');
      });

            // no isolated scope, it sucks yes but it is a solution to watch the title
            scope.$watch(function() {
              return attrs.gtsTitle;
            }, function(newData) {
              if (newData)
                element.prev().text(newData);
            });
          }
        };
      });


gtsApp.directive('collapsable', function($timeout) {
  return {
        // require: '^toggleCollapse',
        restrict: 'EAC',
        transclude: true,
        scope: {
          title: '@',
          data: '=',
          offset: '=',
          above_scope: '='
        },
        template: '<div>' +
        '<p ng-click="toggle()" ng-mouseenter="highlightRegion()" ng-mouseleave="unhighlightRegion()"  style="cursor: pointer"> {{title}} <img src="/static/img/arrow.png" ng-class="{ rotation90Right: showMe, removeRotation: !showMe }"> </p>' +
        '<ng-transclude ng-show="showMe"></ng-transclude>' +
        '</div>',
        link: function(scope, element, attrs) {

          scope.showMe = false;
          scope.toggle = function() {
            scope.showMe = !scope.showMe;
            if (scope.showMe)
              element.css('background-color', 'transparent');
            else
              element.css('background-color', '#d7d7d7');
          };

          scope.highlightRegion = function() {
            if (!scope.showMe)
              element.css('background-color', '#d7d7d7');
          };

          scope.unhighlightRegion = function() {
            if (!scope.showMe)
              element.css('background-color', 'transparent');
          };
        }
      };
      
    });

gtsApp.directive('gtsProgressBar', function() {
  return {

    restrict: 'AC',
    replace: true,
    scope: {
      rate: '=',
      color: '@'
    },
    template: '<div class="gts-progressbar">' +
    '<div style="width: {{ rate }}%; background-color:{{ color }};" class="gts-progress-bar-fill-region"> </div>' +
    '</div>',
  }
  
});

/* use on a scrollable DOM. Make the element aware of the event
* `gts-scroll-bottom` by scrolling at the end of the element*/

gtsApp.directive('gtsScrollBottom', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      scope.$on('gts-scroll-bottom', function() {
        $timeout(function() {
          $(element).scrollTop($(element)[0].scrollHeight);
        });
      });
    }
  };
  
});

/* All DOM in the gtsDialogLegend is merged in a modal window with a
* button to open it*/

gtsApp.directive('gtsDialogLegend', function() {
  return {
    restrict: 'A',
    transclude: true,
    replace: true,
    template: '<div> <ng-transclude></ng-transclude></div>',
    link: function(scope, element) {

      element.before('<button> <img src="/static/img/icone_questionmark.png"/> </button>');
      scope.buttonDialog = element.prev();

      element.dialog({
        autoOpen: false,
        width: 650
      });
      scope.isOpen = false;

      scope.buttonDialog.on('click', function() {
        if (!scope.isOpen)
          element.dialog('open');
        else
          element.dialog('close');

        scope.isOpen = !scope.isOpen;
      });
    }
  };
  
});

/* 
 * Useful to filter array of flight or similar objects. 
 *
 * wholeDataSet: the whole array of js objects which is filtered
 * filtered: the result of the previous array which passed all the filters
 *
 * line: line name of the attribute of wholeDataSet index flight line. (sometime is `line`, `line_flight`, `numflight`...)
 * date: same as line but for date
 * filterOnChange: run automatically all filter when wholeDataSet change*. Set it to true if you want such behavior
 */

 gtsApp.directive('flightFilterToolSet', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
            wholeDataSet: '=', // all data where filter are applied
            filtered: '=',
            line: '@',
            date: '@',
            filterOnChange: '@'
          },
          templateUrl: '/static/angular/flight_filter_tool_set.html',
          link: function(scope, element, attrs) {

            scope.beginDate = moment();
            scope.beginDateDisplay = scope.beginDate.format('DD/MM/YY');

            scope.numflight = '';

            scope.endDate = moment().add(1, 'days');
            scope.endDateDisplay = scope.endDate.format('DD/MM/YY');

            // filter the query
            scope.runFilter = function() {

              var begin = new Date(scope.beginDate);
              var end = new Date(scope.endDate);
              var range = moment.range(begin, end);
              var partitions = _.partition(scope.wholeDataSet, function(elt) {
                if (range.contains(new Date(elt[scope.date])) && RegExp(scope.numflight).test(elt[scope.line])) {
                  return true;
                }
                return false;
              });

              scope.filtered = partitions[0];
            }

            // on change
            scope.formatDate = function() {
                // this function is ugly
                var now = moment();

                scope.beginDateDisplay = moment(scope.beginDateDisplay, 'DD/MM/YY');
                scope.beginDate = moment({
                  y: scope.beginDateDisplay.year(),
                  M: scope.beginDateDisplay.month(),
                  d: scope.beginDateDisplay.date(),
                  h: 0,
                  m: 0
                });
                scope.beginDateDisplay = scope.beginDateDisplay.format('DD/MM/YY');

                scope.endDateDisplay = moment(scope.endDateDisplay, 'DD/MM/YY');
                scope.endDate = moment({
                  y: scope.endDateDisplay.year(),
                  M: scope.endDateDisplay.month(),
                  d: scope.endDateDisplay.date(),
                  h: 23,
                  m: 59
                });
                scope.endDateDisplay = scope.endDateDisplay.format('DD/MM/YY');
              }

              if (scope.$eval(scope.filterOnChange)) {
                scope.$watch('wholeDataSet', function(newData) {
                  if (newData)
                    scope.runFilter();
                });
              }
            }
          }
          
        });

/*
 * Force a user to enter a flight line in a input.
 */

 gtsApp.directive('gtsFlightInput', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      var forceInput = function(inputValue) {
        var output = null;
        if (!/^(([a-zA-Z]{2}\d{1,4})|([a-zA-Z]{0,2}))$/.test(inputValue))
          output = inputValue.slice(0, -1).toUpperCase();
        else
          output = inputValue.toUpperCase();

        modelCtrl.$setViewValue(output);
        modelCtrl.$render();
        return output;
      };

      modelCtrl.$parsers.push(forceInput);
    }
  };
  
});

/*
 * a Time pattern input
 */

 gtsApp.directive('gtsTime', function() {
  return {
    restrict: 'E',
    require: 'ngModel',
    template: '<span><input class="time-input" style="width: 35px" ng-keyup="format()" ng-model="time"></span>',
    replace: true,
    link: function(scope, element, attrs, modelCtrl) {
      element.find('.time-input').inputmask("99:99");

      scope.changeByKeydown = false;

      scope.$watch(function() {
        return attrs.disabled;
      }, function(newData) {
        element.find('input').prop('disabled', newData);
      });

      scope.format = function() {
        modelCtrl.$setViewValue(scope.time);
      };

      scope.$watch(function() {
        return modelCtrl.$viewValue;
      }, function(newData) {
        if (!newData)
          scope.time = null;
        else
          scope.time = modelCtrl.$modelValue;
      });
    }
  };
  
});

/*
 * same as above but with seconds
 */

 gtsApp.directive('gtsTimeWithSeconds', function() {
  return {
    
    restrict: 'E',
    require: 'ngModel',
    template: '<span><input class="time-input" style="width: 55px" ng-keyup="format()" ng-model="time"></span>',
    replace: true,
    scope: true,

    link: function(scope, element, attrs, modelCtrl) {
      
      element.find('.time-input').inputmask("99:99:99");

      scope.$watch(function() {
        return attrs.disabled;
      }, function(newData) {
        element.find('input').prop('disabled', newData);
      });

      scope.format = function() {
        modelCtrl.$setViewValue(scope.time);
      };

      scope.$watch(function() {
        return modelCtrl.$viewValue;
      }, function(newData) {
        if (!newData)
          scope.time = null;
        else
          scope.time = modelCtrl.$modelValue;
      });
    }
  };
});

 gtsApp.directive('gtsDispatcher', function() {
  return {
    restrict: 'E',
    scope: {
      leftList: '=',
      rightList: '=',
      leftListName: '@',
      rightListName: '@'
    },
    templateUrl: '/static/angular/gts-dispatcher.html',
    link: function(scope, element, attrs) {}
  };
});

 gtsApp.directive('gtsDebug', function() {
  return {
    restrict: 'E',
    scope: {
      debug: '=',
    },
    templateUrl: '/static/angular/gts-debug.html',
    link: function(scope, element, attrs) {}
  };
});


/*
 * service to preprocess values of a scope. 
 */

 gtsApp.service('preprocessService', function() {
  
    // force to null unclear variable values. Useful before sending a
    // form for example.
    this.preprocessValues = function(scopeVariable) {
      _.each(_.keys(scopeVariable), function(k) {
        if (_.contains(['', undefined, null], scopeVariable[k])) {
          scopeVariable[k] = null;
        }
      });
    };
  });

 gts_utils = {};


 $(document).ready(function() {
  $('#menu').superfish({
    delay: 300
  });
  $('input').on('focus', function() {
    $(this).addClass('input-on-focus');
  }).on('blur', function() {
    $(this).removeClass('input-on-focus');
  });
});




 gtsApp.directive('removeOnClick', function() {
  return {
    scope: {
      removeElts: '='
    },
    link: function(scope, elt, attrs) {
      elt.on('click', function(event) {
        console.log('foo');
        scope.removeElts.push(angular.element(event.target).html());
        angular.element(event.target).closest('li').empty();
      });
    }
  }
});

 gtsApp.directive('somethingEnd', function() {
  return {
    transclude: true,
    require: 'ngModel',
    scope: {
      somethingEnd: '@'
    },

    link: function(scope, elem, attrs, ctrl) {

      var input = elem.find('input').eq(0);
      input=$("#"+input.context.id)
      input.on('blur', function(){

        if ( input.val().charAt( input.val().length - 1) !== scope.somethingEnd && input.val().length  ){
          input.val(input.val()+scope.somethingEnd);
        }

      });
    }

  };
});

 gtsApp.directive('capitalizefirstletter', function() {

  return {
    require: '^ngModel',
    link: function(scope, element, attrs, modelCtrl) {

      var capitalize = function(inputValue) {

        if (inputValue == undefined)
          inputValue = '';

        var capitalized = inputValue.charAt(0).toUpperCase() + inputValue.substring(1).toLowerCase();

        if (capitalized !== inputValue) {

          modelCtrl.$setViewValue(capitalized);
          modelCtrl.$render();
        }

        return capitalized;
      };

      modelCtrl.$parsers.push(capitalize);
            capitalize(scope[attrs.ngModel]); // capitalize initial value
          }
        };
      });
 

 gtsApp.directive('puElasticInput', [
  '$document',
  '$window',
  function ($document, $window) {
    var wrapper = angular.element('<div style="position:fixed; top:-999px; left:0;"></div>');
    angular.element($document[0].body).append(wrapper);
    function setMirrorStyle(mirror, element, attrs) {
      var style = $window.getComputedStyle(element[0]);
      var defaultMaxWidth = style.maxWidth === 'none' ? element.parent().prop('clientWidth') : style.maxWidth;
      element.css('minWidth', attrs.puElasticInputMinwidth || style.minWidth);
      element.css('maxWidth', attrs.puElasticInputMaxwidth || defaultMaxWidth);
      angular.forEach([
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'letterSpacing',
        'textTransform',
        'wordSpacing'
        ], function (value) {
          mirror.css(value, style[value]);
        });
      mirror.css('paddingLeft', style.textIndent);
      if (style.boxSizing === 'border-box') {
        angular.forEach([
          'paddingLeft',
          'paddingRight',
          'borderLeftStyle',
          'borderLeftWidth',
          'borderRightStyle',
          'borderRightWidth'
          ], function (value) {
            mirror.css(value, style[value]);
          });
      } else if (style.boxSizing === 'padding-box') {
        angular.forEach([
          'paddingLeft',
          'paddingRight'
          ], function (value) {
            mirror.css(value, style[value]);
          });
      }
    }
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        // Disable trimming inputs by default
        attrs.$set('ngTrim', attrs.ngTrim === 'true' ? 'true' : 'false');
        var mirror = angular.element('<span style="white-space:pre;"></span>');
        setMirrorStyle(mirror, element, attrs);
        wrapper.append(mirror);
        function update() {
          mirror.text(element.val() || attrs.placeholder || '');
          var delta = parseInt(attrs.puElasticInputWidthDelta) || 1;
          element.css('width', mirror.prop('offsetWidth') + delta + 'px');
        }
        update();
        if (attrs.ngModel) {
          scope.$watch(attrs.ngModel, update);
        } else {
          element.on('keydown keyup focus input propertychange change', update);
        }
        scope.$on('$destroy', function () {
          mirror.remove();
        });
      }
    };
  }
  ]);


gtsApp.directive('passwordMatch', function() {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      var checkMatch, firstPasswordElement, theElement, _i, _len, _ref, _results;
      firstPasswordElement = angular.element(document.getElementById('password-to-verify'));
      checkMatch = function() {
        return scope.$apply(function() {
          var valid;
          var elem_val = elem.val();
          if( elem_val.length === 0 ) {
            valid = true; 
          } else {
            valid = elem.val() === firstPasswordElement.val();
          }               
          return ctrl.$setValidity('passwordMatch', valid);
        });
      };
      _ref = [firstPasswordElement, elem];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        theElement = _ref[_i];
        _results.push(theElement.bind('keyup', function() {
          return checkMatch();
        }));
      }
      return _results;
    }
  };
});



