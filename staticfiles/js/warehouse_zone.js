var Warehousezone = function( warehousezoneData ){
    if (warehousezoneData)
        angular.extend(this, warehousezoneData);
    else{
        this.zone = null;
        this.description = null;
        this.stop = null;

    }
};

gtsApp.controller('mainCtrl', function( $scope ){
    $scope.shared = {};
    $scope.shared.inAction = false;
    $scope.shared.typeAction = null;

    $scope.resetAll = function(){
        $scope.name = '';
        console.log('ouaosi');
    }

});

gtsApp.controller('refWareHousezoneCtrl', function( $scope, $http, $timeout, $compile, $window, preprocessService ){
    $scope.offloadRequired = true;
    $scope.shared.warehousezone = [];
    $scope.shared.activewarehousezone = new Warehousezone();
    console.log(   $scope.shared.description)


    $scope.tableOptions = {
        columns: [
        {
            data: 'zone'
        },
        {
            data: 'description'
        },
        {
            data: 'stop'
        },
        ],

        scrollY: '530px',

        order: []
    };

    urlApi='/api/warehouse_zone/Warehouse/';

    $scope.shared.getwarehousezone = function(){
        $http.get(urlApi)
        .success( function( data ){
            $scope.shared.warehousezone = [];
            _.each( data, function(s){
                $scope.shared.warehousezone.push(new Warehousezone( s ));
            });
        })
        .error( function( errors ){
            $scope.shared.errors = errors;
        });
    };

    $scope.shared.actionsToProceedWhenClickOnTable = function( event ){
        if ( !$scope.shared.inAction ){
            $scope.highlightRow( event );
            $scope.selectRow( event );
        }
    };

    $scope.shared.actionsToProceedWhenDblClickOnTable = function( event ){
        $scope.shared.actionsToProceedWhenClickOnTable( event );

        if ( !$scope.shared.inAction )
            $scope.shared.alter( event );
    };

    $scope.highlightRow = function( event ){
        angular.element(event.target).closest('table').find('.selected').removeClass('selected');
        angular.element(event.target).closest('tr').addClass('selected');
    };

    $scope.selectRow = function( event ){
        $scope.shared.activewarehousezone = $scope.dataTable.row(angular.element( event.target ).closest('tr')).data();
    };

    $scope.shared.add = function( event ){
        $scope.shared.inAction = true;
        $scope.shared.typeAction = 'new';
        $scope.shared.warehousezone.push(new Warehousezone());
        $scope.shared.activewarehousezone = $scope.shared.warehousezone[$scope.shared.warehousezone.length - 1];

        $timeout( function(){
            angular.element('#zone').focus();
        });
    };

    $scope.shared.cancel = function(){
        $scope.shared.inAction = false;
        $scope.shared.activewarehousezone = new Warehousezone();
        $scope.currentRowEdit = null;
        $scope.shared.errors=null;

        if ( $scope.shared.typeAction == 'new' ){
            $scope.shared.warehousezone.splice($scope.shared.warehousezone.length - 1, 1);
            $scope.dataTable.clear();
            $scope.dataTable.rows.add($scope.shared.warehousezone).draw();
            $('#warehousezone-list_wrapper .dataTables_scrollBody').eq(0).scrollTop(99999999999);
        }
        $scope.shared.typeAction = null;
    };

    $scope.shared.ok = function(){
        preprocessService.preprocessValues( $scope.shared.activewarehousezone );
        switch($scope.shared.typeAction){
            case 'alter':
            $http.post(urlApi + $scope.shared.activewarehousezone.zone + '/', $scope.shared.activewarehousezone)
            .success( function(){
                $scope.shared.errors = null;
                $scope.shared.inAction = false;
                $scope.shared.typeAction = null;

                $timeout(function(){
                    $scope.dataTable.row($scope.currentRowEdit).data( $scope.shared.activewarehousezone );
                    $scope.currentRowEdit = null;
                    
                });
            })
            .error( function( errors ){
                $scope.shared.errors = errors;
            });
            break;
            case 'new':
            $http.post(urlApi, $scope.shared.activewarehousezone)
            .success( function( data ){
                $scope.shared.errors = null;
                $scope.shared.inAction = false;
                $scope.shared.typeAction = null;
                $scope.shared.activewarehousezone.zone = data.zone;

                $timeout( function(){
                    $scope.dataTable.clear();
                    $scope.dataTable.rows.add($scope.shared.warehousezone).draw();
                    $('#warehousezone-list_wrapper .dataTables_scrollBody').eq(0).scrollTop(99999999999);
                });
            })
            .error( function( errors ){
                $scope.shared.errors = errors;
            });
            break;
        }
    };

    $scope.shared.alter = function( event ){
        $scope.shared.inAction = true;
        $scope.shared.typeAction = 'alter';
        $scope.staticToEditable( $(event.target).closest('tr') );

        $timeout( function(){
            angular.element('#description').focus();
        });
    };

    var editableInputs = [
    '#zone',
    '#description',
    '#stop',

    ];
    
    $scope.staticToEditable = function( row ){

        $scope.currentRowEdit = row;
        $scope.currentRowEdit.find('td').each(function( k ){
            $(this).find('.static').hide();
            $(this).find('.editable').append( $(editableInputs[k]) );
        });
    };

    $scope.editableToStatic = function(){

        $scope.currentRowEdit.find('td').each(function( k ){
            $(this).find('.static').show();
            $('#unvisible-aera').append( $(editableInputs[k]) );
        });
    };
    
    $(window).on('keydown', function( event ){
        if( event.keyCode == 46 )
            if ( $window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?') ){
                var index = $scope.dataTable.row($('.selected')).index();
                var code = $scope.dataTable.row($('.selected')).data().zone;
                $http.delete(urlApi + code + '/')
                .success(function( data ){
                    $scope.shared.warehousezone.splice(index, 1);
                    $scope.shared.activewarehousezone = new Warehousezone();

                    var scrollLevel = $('#warehousezone-list .dataTables_scrollBody').eq(0).scrollTop();
                    $scope.dataTable.clear();
                    $scope.dataTable.rows.add($scope.shared.warehousezone).draw();
                    $('#warehousezone-list .dataTables_scrollBody').eq(0).scrollTop(scrollLevel);  
                })
                .error( function( errors ){
                    $('Something happend with the deletion. Contact the administrator with the code ' + code +
                      'and the name warehousezone_code');
                });
            }
        });

$scope.shared.getwarehousezone();
});
