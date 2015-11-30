


var User = function(userData) {
    if (userData)
        angular.extend(this, userData);
    else {
        this.usr_userid = null;
        this.usr_username = null;
        this.usr_description = null;
        this.usr_entity = null;
        this.usr_device_access = null;
        this.usr_ready= null;
        this.usr_password= null;
        this.groups = [];
    }
};


var Group = function(groupData) {
    if (groupData)
        angular.extend(this, groupData);
    else {
        this.usr_group = null;
    }
};

gtsApp.controller('mainCtrl', function($scope, $http) {
    $scope.shared = {};
    $scope.shared.inAction = false;
    $scope.shared.typeAction = null;

    $scope.shared.allGroups = [];
    $scope.shared.userid = [];

    $scope.entitys = ['','SAV','IMPORT','TRAITDOCS','FAP'];
    
    $scope.getAllGroups = function(){
        $http.get('/api/user/group/')
        .success( function( data ){
            $scope.shared.allGroups = data;
        })
        .error(function(){})
    }

    $scope.getAllGroups();


    urlApi = '/api/user/user/';

    $scope.shared.getuser = function() {
        $http.get(urlApi)
        .success(function(data) {
            $scope.shared.user = [];
            _.each(data, function(s) {
                $scope.shared.user.push(new User(s));
            });
        })
        .error(function(errors) {
            $scope.shared.errors = errors;
        });
    };


    $scope.shared.getuserid = function(id) {
      $http.get(urlApi+id)
      .success(function(data) {
        $scope.shared.userid=[];
        $scope.shared.userid=data
    })
      .error(function(errors) {
        $scope.shared.errors = errors;
    });
  };

});



gtsApp.controller('refuserCtrl', function($scope, $http, $timeout, $compile, $window, preprocessService) {
    $scope.offloadRequired = true;
    $scope.shared.user = [];
    $scope.shared.activeuser = new User();

    


    $scope.tableOptions = {

        columns: [{
            data: 'usr_userid',

            render: function( data ){
                return '<span id='+data+' >' + data + '</span>';
            }  
        }, {
            data: 'usr_username'
        }, {
            data: 'usr_description'
        }, {
            data: 'usr_entity'
        }, {
            data: 'usr_ready',

        }],

        scrollY: '550px',

        order: [[ 0, "asc" ]]
    };
    
    $scope.$watch('shared.activeuser', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);

    
    $scope.shared.actionsToProceedWhenClickOnTable = function(event) {
        if (!$scope.shared.inAction ) {
            $scope.highlightRow(event);
            $scope.selectRow(event);
        }
    };

    $scope.shared.actionsToProceedWhenDblClickOnTable = function(event) {
      $('#myModalgroup').modal({
        backdrop: 'static',
        keyboard: true
    })
      $('#myModalgroup').modal('show')
    //$scope.shared.userid=$scope.shared.activeuser.groups
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
 $scope.shared.activeuser = $scope.dataTable.row(angular.element( event.target ).closest('tr')).data();
 $scope.shared.activeuser.usr_entity


 // var uniqueList = _.uniq( _.pluck($scope.shared.allFunctions, 'functionid'));

 // $scope.shared.groupsWithoutGroupOfSelectedUser = _.difference(
 //    _.pluck($scope.shared.allGroups, 'grp_groupname'),
 //    $scope.shared.activeuser.groups
 //    );
$timeout(function() {
    angular.element('#usr_password ').focus();
});
};


$scope.shared.addgroups = function(event) {
  if ( $scope.shared.typeAction == 'alter' ){
      $scope.shared.getuserid($scope.shared.activeuser.usr_userid); 

      var uniqueList = _.uniq( _.pluck($scope.shared.allFunctions, 'functionid'));

      $scope.shared.groupsWithoutGroupOfSelectedUser = _.difference(
        _.pluck($scope.shared.allGroups, 'grp_groupname'),
        $scope.shared.activeuser.groups
        );
  }
};

$scope.shared.add = function(event) {

    $scope.shared.inAction = true;
    $scope.shared.typeAction = 'new';
    $scope.shared.user.push(new User());
    console.log($scope.shared.user.length - 1)
    $scope.shared.activeuser = $scope.shared.user[$scope.shared.user.length - 1];
    $scope.shared.groupsWithoutGroupOfSelectedUser = _.pluck($scope.shared.allGroups, 'grp_groupname')


    $timeout(function() {
        angular.element('#usr_userid ').focus();
    });
};

$scope.shared.cancelgroups = function(event) {
  $scope.shared.errors = null;

  if ( $scope.shared.typeAction == 'alter' ){
    console.log($scope.shared.userid.groups )
    $scope.shared.activeuser.groups=$scope.shared.userid.groups 
}
if ( $scope.shared.typeAction == 'new' ){
    $scope.shared.activeuser.groups =[];

}
};
$scope.shared.cancel = function(event) {
   $scope.shared.inAction = false;
   $scope.shared.errors = null;
   $scope.shared.getuser(); 
};

$scope.shared.ok = function() {

    preprocessService.preprocessValues($scope.shared.activeuser);
    switch ($scope.shared.typeAction) {

        case 'alter':
        $http.post(urlApi + $scope.shared.activeuser.usr_userid + '/', $scope.shared.activeuser)
        .success(function( data ) {
            $scope.shared.errors = null;
            $scope.shared.inAction = false;
            $scope.shared.typeAction = null;
            $('#myModalgroup').modal('hide')

            
        })
        .error(function(errors) {
            $scope.shared.errors = errors;
        });
        break;
        case 'new':
        $http.post(urlApi, $scope.shared.activeuser)
        .success(function(data) {
            $('#myModalgroup').modal('hide')

            $scope.shared.errors = null;
            $scope.shared.inAction = false;
            $scope.shared.typeAction = null;
            $scope.shared.activeuser.usr_userid = data.usr_userid;

            $timeout(function() {
               $scope.dataTable.clear();
               $scope.dataTable.rows.add($scope.shared.user).draw();
               var container =  $('#user-list_wrapper  .dataTables_scrollBody'),

               scrollTo = $('#'+data.usr_userid).closest('tr').addClass('selected');

               container.animate({
                scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
            },'slow');

           });
        })
        .error(function(errors) {
            console.log(errors)

            $scope.shared.errors = errors;
        });
        break;
    }
};

$scope.shared.alter = function(event) {
    $scope.shared.inAction = true;
    $scope.shared.typeAction = 'alter';
    $scope.staticToEditable($(event.target).closest('tr'));

    $timeout(function() {
        angular.element('#usr_userid').focus();
    });
};



$scope.staticToEditable = function(row) {

    $scope.currentRowEdit = row;
    $scope.currentRowEdit.find('td').each(function(k) {
        $(this).find('.static').hide();
    });
};


$(window).on('keydown', function(event) {
    if (event.keyCode == 46)
        if ($window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
            var index = $scope.dataTable.row($('.selected')).index();
            var codeuser = $scope.dataTable.row($('.selected')).data().usr_userid;
            $http.delete(urlApi + codeuser + '/')
            .success(function(data) {
                $scope.shared.user.splice(index, 1);
                $scope.shared.activeuser = new User();

                var scrollLevel = $('#user-list_wrapper  .dataTables_scrollBody').eq(0).scrollTop();
                $scope.dataTable.clear();
                $scope.dataTable.rows.add($scope.shared.user).draw();
                $('#user-list_wrapper  .dataTables_scrollBody').eq(0).scrollTop(scrollLevel);
            })
            .error(function(errors) {
                $('Something happend with the deletion. Contact the administrator with the code ' + codeuser +
                    'and the name user_code');
            });
        }
    });

$scope.shared.getuser();


});
