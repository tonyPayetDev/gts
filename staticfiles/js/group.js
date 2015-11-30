


var Group = function(groupData) {
  if (groupData)
    angular.extend(this, groupData);
  else {
    this.grp_groupname = null;
    this.grp_description = null;

    this.functions = [];
  }
};



gtsApp.controller('mainCtrl', function($scope, $http) {
  $scope.shared = {};
  $scope.shared.inAction = false;
  $scope.shared.typeAction = null;
  $scope.shared.allFunctions = [];

    // get all functions 
    $scope.getAllfunctions = function(){
      $http.get('/api/user/function/')
      .success( function( data ){
        $scope.shared.allFunctions = data;
      })
      .error(function(errors){

       $scope.shared.errors = errors;
     })
    }

    $scope.getAllfunctions();
    urlApi = '/api/user/group/';

    $scope.shared.getgroup = function() {
      $http.get(urlApi)
      .success(function(data) {
        $scope.shared.group = [];
        _.each(data, function(s) {
          $scope.shared.group.push(new Group(s));

        });
      })
      .error(function(errors) {
        $scope.shared.errors = errors;
      });


    };



    $scope.shared.getgroupid = function(id) {
      $http.get(urlApi+id)
      .success(function(data) {
        $scope.shared.groupid=[];
        $scope.shared.groupid=data
      })
      .error(function(errors) {
        $scope.shared.errors = errors;
      });
    };
  });


gtsApp.controller('refgroupCtrl', function($scope, $http, $timeout, $compile, $window, preprocessService) {


  // focus sur grp_groupname
  angular.element('.modal').on('shown.bs.modal', function () {
    angular.element("input#grp_groupname").focus();
  })

  $scope.shared.group = [];

  $scope.shared.groupid = [];
  // $scope.shared.activegroup = new Group();


  $scope.tableOptions = {

    columns: [{
      data: 'grp_groupname',

      render: function( data ){
        return '<span id='+data+' >' + data + '</span>';
      }   
    }, {
      data: 'grp_description'
    }, ],

    scrollY: '600px',

    order: [[ 0, "asc" ]]

  };


  $scope.shared.actionsToProceedWhenClickOnTable = function(event) {

    if (!$scope.shared.inAction ) {
      $scope.highlightRow(event);
      $scope.selectRow(event);
    }
  };

  $scope.shared.actionsToProceedWhenDblClickOnTable = function(event) {
    $('#group-list_wrapper .dataTables_scrollBody').eq(0).scrollTop(0);

    $('#myModalgroup').modal({
      backdrop: 'static',
      keyboard: true
    })
    $('#myModalgroup').modal('show')

    $scope.shared.getgroupid($scope.shared.activegroup.grp_groupname);

    $scope.shared.actionsToProceedWhenClickOnTable(event);

    if (!$scope.shared.inAction){
      $scope.shared.alter(event);

    }
  };

  $scope.highlightRow = function(event) {
    angular.element(event.target).closest('table').find('.selected').removeClass('selected');
    angular.element(event.target).closest('tr').addClass('selected');
  };

  $scope.selectRow = function(event) {

    $scope.shared.activegroup =$scope.dataTable.row(angular.element( event.target ).closest('tr')).data();

  };
  $scope.shared.addfunction = function(event) {
    $scope.shared.getgroupid($scope.shared.activegroup.grp_groupname);

    var uniqueList = _.uniq( _.pluck($scope.shared.allFunctions, 'functionid'));


    $scope.shared.functionsWithoutFunctionsOfSelectedGroup = _.difference(
      uniqueList,
      $scope.shared.activegroup.functions

      );

  };

  $scope.shared.add = function(event) {

   $scope.shared.inAction = true;
   $scope.shared.typeAction = 'new';
   $scope.shared.group.push(new Group());
   $scope.shared.activegroup = $scope.shared.group[$scope.shared.group.length - 1];
   $scope.shared.functionsWithoutFunctionsOfSelectedGroup =  _.uniq( _.pluck($scope.shared.allFunctions, 'functionid'));
   $('#group-list_wrapper .dataTables_scrollBody').eq(0).scrollTop(0);

 };

 $scope.shared.cancelfunctions = function(event) {
  $scope.shared.errors = null;

  if ( $scope.shared.typeAction == 'alter' ){
    $scope.shared.activegroup.functions=$scope.shared.groupid.functions 
  }
  if ( $scope.shared.typeAction == 'new' ){
   $scope.shared.activegroup.functions = [];

 }
};
$scope.shared.cancel = function(event) {
 $scope.shared.inAction = false;
 $scope.shared.getgroup();
 $scope.shared.errors = null;

};


$scope.shared.ok = function() {
  $('.dataTables_scrollBody').eq(0)[0].style.height= $scope.tableOptions.scrollY
  preprocessService.preprocessValues($scope.shared.activegroup);
  switch ($scope.shared.typeAction) {

    case 'alter':
    $scope.shared.activegroup.oldgroups=$scope.shared.groupid.grp_groupname

    $http.post(urlApi + encodeURIComponent($scope.shared.activegroup.grp_groupname )+ '/', $scope.shared.activegroup)
    .success(function( data ) {
      $scope.shared.errors = null;
      $scope.shared.inAction = false;
      $scope.shared.typeAction = null;
      $('#myModalgroup').modal('hide')

      $timeout(function() {
       $scope.dataTable.clear();
       $scope.dataTable.rows.add($scope.shared.group).draw();
       var container =  $('#group-list_wrapper  .dataTables_scrollBody'),

       scrollTo = $('#'+data.grp_groupname).closest('tr').addClass('selected');

       container.animate({
        scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
      },'slow');

     });
    })
    .error(function(errors) {

     $scope.shared.errors = errors;
   });
    break;
    case 'new':
    $http.post(urlApi, $scope.shared.activegroup)
    .success(function(data) {

      $('#myModalgroup').modal('hide')
      $scope.shared.errors = null;
      $scope.shared.inAction = false;
      $scope.shared.typeAction = null;

      $timeout( function(){
        $scope.dataTable.clear();
        $scope.dataTable.rows.add($scope.shared.group).draw();

        var container =  $('#group-list_wrapper  .dataTables_scrollBody');
        scrollTo = $('#'+data.grp_groupname).closest('tr').addClass('selected');

        container.animate({
          scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
        },'slow');

      });
    })
    .error(function(errors) {

     $scope.shared.errors = errors;
   });
    break;
  }
};

$scope.shared.alter = function(event) {
  $scope.shared.inAction = true;
  $scope.shared.typeAction = 'alter';

  $timeout(function() {
    angular.element('#grp_groupname').focus();
  });
};



$(window).on('keydown', function(event) {
  if (event.keyCode == 46)
    if ($window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
      var index = $scope.dataTable.row($('.selected')).index();
      var codegroup = $scope.dataTable.row($('.selected')).data().grp_groupname;
      $http.delete(urlApi + codegroup + '/')
      .success(function(data) {
        $scope.shared.group.splice(index, 1);
        $scope.shared.activegroup = new Group();

        var scrollLevel = $('#group-list_wrapper .dataTables_scrollBody').eq(0).scrollTop()
        $scope.dataTable.clear();
        $scope.dataTable.rows.add($scope.shared.group).draw();
        $('#group-list_wrapper .dataTables_scrollBody').eq(0).scrollTop(scrollLevel);
      })
      .error(function(errors) {
        $('Something happend with the deletion. Contact the administrator with the code ' + codegroup +
          'and the name group_code');
      });
    }
  });

$scope.shared.getgroup();


});
