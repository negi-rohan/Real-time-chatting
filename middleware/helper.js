var self={
	queryRunner:function(data,callback){
		/*
			Function required to run all the queries.
		*/
		var db_conncetion=data.connection;
		var query=data.query;
		var insert_data=data.insert_data;
		db_conncetion.getConnection(function(err,con){
			if(err){
			  con.release();
			}else{
				db_conncetion.query(String(query),insert_data,function(err,rows){
			    con.release();
			    if(!err) {
			    	callback(rows);
			    } else {
			      console.log(err);  
			      console.log("Query failed");  
			    }        
			  });
			}
		});
	},
	insertMsg:function(data,connection,callback){
		/*
			Function to insert messages.
		*/
		var data_insert={
			query:"INSERT INTO conversation_reply SET ?",
			connection:connection,
			insert_data:{
				reply:data.msg,
				from_id:data.from_id,
				to_id:data.to_id,
				timestamp:Math.floor(new Date() / 1000),
				con_id:data.con_id,
                room_id: data.room_id
			}
		};	
		self.queryRunner(data_insert,function(result){
			console.log("msg inserted");
			callback(data_insert.insert_data)
		});
	},
    getRoomMsgs:function(data,connection,callback){
		/*
			Function to get messages.
		*/
		var data={
			query:"select reply as msg,from_id, name, p_photo, to_id, c.timestamp, room_id from conversation_reply c join user u on c.from_id = u.id where c.room_id='"+data.room_id+"' order by timestamp asc",
			connection:connection
		}
		self.queryRunner(data,function(result){
			if(result.length > 0){
				callback(result)
			} else{
				callback(null);
			}
		});
	},
    getChatRooms:function(uid, connection,callback){
		/*
			Function to get messages.
		*/
		var data={
			query:"select * from rooms",
			connection:connection
		}
		self.queryRunner(data,function(result){
			if(result.length > 0){
				callback(result)
			} else{
				callback(null);
			}
		});
	},
	getUserInfo:function(uid,connection,callback){
		/*
			Function to get user information.
		*/
		var data={
			query:"select id,name,p_photo,online from user where id='"+uid+"'",
			connection:connection
		}
		self.queryRunner(data,function(result){
			if(result.length>0) {
				var user_info="";			
				result.forEach(function(element, index, array){
					user_info={
						name:element.name,
						p_photo:element.p_photo,
						online:element.online
					};	
				});
		    	result_send={
		    		data:user_info,
		    		msg:"OK"
		    	};
		    } else {
		    	result_send={
		    		data:null,
		    		msg:"BAD"
		    	};
		    }
		    callback(result_send);
		});
	}
}
module.exports = self;