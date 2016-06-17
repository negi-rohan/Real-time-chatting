var app = angular.module('home',['ngAnimate', 'toaster']);


/* 
	Making factory method for socket 
*/
app.factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
			  		callback.apply(socket, args);
				});
		  	});
		},
		emit: function (eventName, data, callback) {
		  	socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
			  		if (callback) {
						callback.apply(socket, args);
			  		}
				});
		  	})
		}
  	};
});

/* 
	Making service to run ajax 
*/
app.service('runajax', ['$http', function ($http) {
  this.runajax_function = function(request,callback){
	var url=request.url;
	var data_server=request.data_server;
	$http.post(url,data_server).success(function(data, status, headers, config) {
	  callback(data);
	})
	.error(function(){
	  callback("data");
	});
  }
}]);


/* 
	Making directive to send is Typing Notification 
*/
app.directive('sendTypingNotification', function () {
  return{
	require: 'ngModel',
	restrict: 'A',
	link:function (scope, element, attrs,ctrl) {
	  element.bind("keydown keypress", function (event) {
		scope.self.sendTypingNotification(event.type);
		scope.send_text=element.val();
	  });
	  scope.$watch(attrs.updateModel, function(value) {
		ctrl.$setViewValue(value);
		ctrl.$render();
	  });
	}
  }      
});

app.controller('home', function ($scope,$location,$window,$sce,$timeout,toaster,socket,runajax) {
    
    var vm = this;
    var selected_room;
  
	$scope.show_userinfo=""; //To contain user information.
  	$scope.userlist=""; //To contain list of users.
  	$scope.RecentUserList=""; //To contain list of users.
  	$scope.uid="";
	$scope.hightlight_id="";
  	$scope.hightlight_socket_id="";
  	$scope.send_to_userinfo="";
  	$scope.send_to_user_name="";
  	$scope.send_text;
  	$scope.msgs=[];
    vm.categories = [];



  

	/* Making Usefull function*/
	$scope.self={
		getUserInfo: function(callback){
			var uid=$location.search()['id'];
			$scope.uid=uid;
			var data={
				url:'/get_userinfo',
				data_server:{
					uid:uid
				}
			};
			runajax.runajax_function(data,function(userdata){        
				$scope.show_userinfo=userdata;        
				callback(userdata);
			});
		},
        getChatRooms: function(callback){
            var uid=$location.search()['id'];
			var data={
				url:'/get_chats_rooms',
                data_server:{
					uid:uid
				}
			};
			runajax.runajax_function(data,function(userdata){
                callback(userdata);
			});
		},
        getRoomMsg:function(roomId,callback){
		  var data={
			url:'/get_room_msgs',
			data_server:{
                room_id: roomId
			}
		  }
		  runajax.runajax_function(data,function(userdata){        
			callback(userdata);
		  });
		},
		scrollDiv:function(){
		  var scrollDiv = angular.element( document.querySelector( '.msg-container' ) );
		  $(scrollDiv).animate({scrollTop: scrollDiv[0].scrollHeight}, 900);
		},
		sendTypingNotification:function(eventName){
		  var TypeTimer;                
		  var TypingInterval = 2000;
		  var data_server={
			  data_uid:$scope.uid,
			  data_fromid:$scope.hightlight_id,
			  data_socket_fromid:$scope.hightlight_socket_id
			}; 
		  if ( eventName=="keypress" ) {
			$timeout.cancel(TypeTimer);
			data_server.event_name='keypress';
			socket.emit('setTypingNotification',data_server);
		  }else {
			TypeTimer=$timeout( function(){
			  data_server.event_name='keydown';
			  socket.emit('setTypingNotification',data_server);
			}, TypingInterval);
		  }
		}
	};

	/*
		Function To get 'user information as well as invokes to get Chat list' 
	*/
	$scope.self.getUserInfo(function(userinfo){
		socket.emit('userInfo',userinfo.data); // sending user info to the server  
	});
    
    $scope.self.getChatRooms(function(data){
        vm.rooms = data;
    });
  
    vm.hightlight_room = function(room){
        selected_room = room;
        $scope.self.getRoomMsg(room.id, function(result){
            $scope.msgs=[];
            if(result != 'null'){
			 $scope.msgs=result;
            }
        });
    };

    $scope.send_msg_to_room=function(){
        if(selected_room != ''){
            if($scope.send_text == ""){
                alert("Message can't be empty");
            } else {
                var data={
                    room_id:selected_room.id,
                    from_id:$scope.uid,
                    msg:$scope.send_text
                };

                // sending user info to the server starts
                socket.emit('sendMsgToRoom',data);

                $scope.msgs.push({
                    msg:$scope.send_text,
                    from_id:$scope.uid,
                    room_id: selected_room.id,
                    timestamp:Math.floor(new Date() / 1000)
                });
                $scope.send_text="";
                $scope.self.scrollDiv();
            }
        }
	};

	
	/*---------------------------------------------------------------------------------
		Socket on event starts
  	---------------------------------------------------------------------------------*/


  	/*
		Function to show messages.
  	*/
    
    socket.on('getRoomMsg',function(data){
		if(data != ""){
	  		$scope.self.getRoomMsg(data,function(result){
				$scope.msgs="";
				$scope.msgs=result;
				$scope.self.scrollDiv();
	  		});    
		}

		/*
	  		Using Toaster to show notifications
		*/
		toaster.pop('success',data.name+" sent you a message", data.msg,5000);
  	});

	/*
		Function to update user list when one user goes offline.
	*/
  	socket.on('getTypingNotification',function(data){
		if(data.event_name=="keypress"){
	  		angular.element('#isTyping_'+data.data_uid).css('display','block');
		}else{
	  		angular.element('#isTyping_'+data.data_uid).css('display','none');      
		}
  	});

  	socket.on('exit',function(data){
  		$scope.self.getUserInfo(function(userinfo){
			socket.emit('userInfo',userinfo.data); // sending user info to the server  
		});
  	});

 
  	/*---------------------------------------------------------------------------------
		Socket on event Ends
  	---------------------------------------------------------------------------------*/
});