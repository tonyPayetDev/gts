


gtsApp.controller('changepassword', function($scope, $http, $timeout, $compile, $window, preprocessService ) {
  $scope.shared = {};

  $scope.shared.passwordold=null;
  $scope.shared.alluser = [];
  $scope.shared.errors= false;
  $scope.passwordolderror=false

  $scope.getuser = function(){
    $http.get('/api/user/changePassword/'+angular.element('#userid').text())
    .success( function( data ){
      $scope.shared.alluser = data;

    })
    .error(function(){})
  }


  $scope.getuser();

  $scope.$watch( 'shared.alluser.usr_userid', function() {
        // gére le changement de mot de passe tout les 30 jours 
        var firstlogin = new Date($scope.shared.alluser.usr_first_login);
        var lastlogin= new Date($scope.shared.alluser.usr_last_login)
        nbjours=(lastlogin.getTime()-firstlogin.getTime())/86400000
        console.log(nbjours)
        if(nbjours>=30){
          $scope.mandatory="mandatory";      
          $('.close').hide()
          $('#myModal').modal({
            backdrop: 'static',
            keyboard: true
          })

        }

      });



  $scope.$watch( function() {

        // envoie erreur si date inferieur a la date de connexion 

        if( $scope.shared.passwordold===$scope.shared.passwordnew){
         //$scope.shared.passworderror=true
         $scope.passwordnewerror=true

         console.log("mot de passe ne peut pas étre le méme que l'ancien ")
       }else{

        $scope.passwordnewerror= false;
      }


    });



  $scope.isRequired=false;

  $scope.shared.ok = function() {
    console.log($scope.shared.passwordold)
    if ($scope.shared.passwordold==null ) {
      $scope.isRequired = true;
    }
    else {
      $scope.isRequired = false;
    }
    $scope.shared.alluser.passwordold=$scope.shared.passwordold
    $scope.shared.alluser.usr_password=$scope.shared.passwordnew
    $scope.shared.alluser.usr_first_login=$scope.shared.alluser.usr_last_login
    $http.post('/api/user/changePassword/' + $scope.shared.alluser.usr_userid + '/', $scope.shared.alluser)
    .success(function( data ) {
      $scope.shared.errors = null;
      $('#myModal').modal('hide')

      $scope.shared.passwordold=null;
    })
    .error(function(errors) {
      $scope.shared.errors = errors;
    });
  };



});
