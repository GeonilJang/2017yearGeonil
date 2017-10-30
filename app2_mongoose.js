
/*
2017-10-27 Geonil Jang
*/

//===모듈을 사용하기 위한 객체선언====
var express = require('express');
var http =require('http');
var bodyParser = require('body-parser');
var static = require('serve-static');
var path = require('path');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var multer = require('multer');
var fs = require('fs');
var cors = require('cors');
var errorHandler = require('errorhandler');
var expressErrorHandler = require('express-error-handler');
//var MongoClient = require('mongodb').MongoClient; -> mongoose를 사용함 MVC를 사용한다.
var mongoose = require('mongoose');
// ===end==

//===express 모듈을 사용하기 위한 선언===
var app = express();
//=== end ===
//=== 데이터베이스 연결을 사용하기 위한 설정 ===
var database;
var UserSchema;
var UserModel;
//mongoose를 사용함 MVC를 사용한다.
function connectDB(){
	var databaseUrl = 'mongodb://localhost:27017/local';

  mongoose.Promise = global.Promise // mongoose 를 사용하기 위해서 기본 적으로 설정하는 부분 입니다.
  mongoose.connect(databaseUrl);
  database = mongoose.connection; // mongoose 커넥션을 담는다.


  database.on('open', function(){
    //데이터 베이스 테이블 정보를 만든다.
    UserSchema = mongoose.Schema({
      id: String,
      name: String,
      password: String
    });
    console.log('defined UserSchema');
    //데이터 베이스 테이블을 위에 정의데 테이블 정의 대로 만든다.
    UserModel = mongoose.model('users', UserSchema);
    console.log('defined UserModel');
  });

  database.on('disconnected', function(){
    console.log('disconnected Database');
  });

  database.on('error', console.error.bind(console, 'mongoose connection error'));
}

//===서버 시작 코드===
//==1번 방법==
/*
app.listen(3000,function(){
  console.log("Server Start at Port 3000");
})
*/
//==2번 방법
app.set('port', process.env.PORT || 3000);
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Server Start at Port 3000");
	connectDB();
});
//=== 서버 시작end ===

//===모듈을 사용하기위한 미들웨어 설정 app.use로 해준다.===
//정적인 파일들을 모아두기 위해서 사용한다.
app.use('/public', static(path.join(__dirname,'public')));
app.use('/upload', static(path.join( __dirname, 'upload')));
//POST 방식으로 들어 오는 값을 받기 위해서 사용한다.
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
//cookie를 사용하기 위해서.
app.use(cookieParser());
//session을 사용하기 위해서.
app.use(expressSession({
  secret:'my key',
  resave:true,
  saveUninitialized:true
}))
//파일 시스템을 사용하기 위한 설정
app.use(cors());
var storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, 'upload'); // 'uplod' 폴더를 사용한다는 뜻으로 upload 폴더가 있어야한다.-> 어떤 폴더로 업로드 할지 설정 하기 위해서
  },
  filename: function(req, file, callback){
    var extension = path.extname(file.originalname); // 파일이 업로드 될 때 동일한 이름이 있다면, 어떻게 바꿀것인지
    var basename = path.basename(file.originalname, extension);
    callback(null, basename + Date.now() + extension);
  }
});
var upload = multer({
  storage : storage,
  limits:{
    files:10,
    fileSize:1024*1024*1024
  }
});
//===모듈을 사용하기위한 미들웨어 설정 app.use로 해준다. end===

// +++  라우팅 시작 +++
//router.route('라우트').post(function(req, res){ }) 를 기본으로 사용함

var router = express.Router();
//파일 저장해 보는 라우트
router.route('/process/photo').post(upload.array('photo', 1), function(req, res){
  console.log('START /process/photo');

  var files = req.files;
  console.log('==== 업로드된 파일 ====');
  if(files.length > 0){
      console.log(files[0]);
  }else{
    console.log('THER IS NO FILE');
  }

  var originalname;
  var filename;
  var mimetype;
  var size;
  if(Array.isArray(files)){
    for (var i = 0; i < files.length; i++) {
        originalname = files[i].originalname;
        filename = files[i].filename;
        mimetype = files[i].mimetype;
        size = files[i].size;
    }
  }
  res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
	res.write("<h1>파일업로드성공</h1>");
	res.write("<div><p>원본파일 : "+originalname+"</p></div>");
	res.write("<div><p>저장파일 : "+filename+"</p></div>");
	res.end();
})
//파일 저장해 보는 라우트 end

//데이터 베이스를 사용하여 유저 정보와 로그인을 해보기 위한 라우트.
router.route('/process/login').post(function(req, res){
	console.log('START /process/login');

	var userId = req.body.id || req.query.id;
	var userPw = req.body.password || req.body.password;
	console.log('User ID : '+userId+", "+'UserPw : '+userPw);

	if(database){
		authUser(database, userId, userPw, function(err, docs){
			if(err){
				console.log('Error at /process/login');
				res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>에러발생</h1>');
        res.end();
        return;
			}else{
				if(docs){
	        console.dir(docs);
	        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
	        res.write('<h1>로그인 성공</h1>');
	        res.write('<div><p>사용자 : ' +docs[0].name+'</p></div>');
	        res.write('<br><br><a href="/public/adduser.html">Go to adduser</a>');
	        res.end();
	      }else{
	        console.log('에러발생');
	        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
	        res.write('<h1>사용자 데이터 조회안됨</h1>');
	        res.end();
	      }//else end 1
			}//else end 0
		});
	}//if(database) end
}); //process/login end
//데이터 베이스를 사용하여 로그인을 해보기 위한 라우트.END

//데이터 베이스를 사용하여 사용자 추가 해보기 위한 라우트.
router.route('/process/adduser').post(function(req, res){
	var id = req.body.id ||  req.query.id;
	var pw = req.body.password || req.query.password;
	var name = req.body.name || req.query.name;
	console.log('Got the datas ID: '+id+", Password: "+pw+", Name: "+name);

	if(database){
		addUser(database, id, pw, name, function(err, result){
			if(err){
				console.log('Error at /process/adduser0');
				console.log('에러발생');
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>에러발생</h1>');
				res.write('<br><br><a href="/public/adduser.html">Go to adduser</a>');
        res.end();
				return;
			}else{
				if(result){
					console.dir(result);
					res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
					res.write('<h1>사용자 추가성공</h1>');
					res.write('<div><p>사용자 : ' +name+'</p></div>');
					res.write('<br><br><a href="/public/login.html">Go to login</a>');
					res.end();
				}else{
					console.log('Error at /process/adduser1');
					res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
				 res.write('<h1>사용자 추가안됨</h1>');
				 res.end();
				}//else 1
			}//else 0
		})//adduser end
	}else{
		res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
		res.write('<h1>데이터 베이스 연결안됨</h1>');
		res.write('<br><br><a href="/public/adduser.html">Go to adduser</a>');
		res.end();
	}//if(database) end
}); //process/adduser end




//데이터 베이스를 사용하여 사용자 추가 해보기 위한 라우트.END
app.use('/',router);
// +++  라우팅 시작 END+++

// +++ 함수들 정의 하는 부분 +++
var authUser = function(db, id, pw, callback){
	console.log('Call authUser : '+id+", "+pw);

	var users = db.collection('users'); //데이터 베이스에서 테이블 정보를 가져온다.
	users.find({"id":id, "password":pw}).toArray(function(err, docs){
		if(err){
			callback(err, null);
			return;
		}else{
			if(docs.length > 0){
				console.log('There is one who is the same.');
				callback(null, docs);
			}else{
				console.log('There is no one who is the same in the database.');
				callback(null, null);
			}//else end 1
		}//else end 0
	})
}//authUser end

var addUser = function(db , id, pw, name, callback){
	console.log('Call addUer : '+id+", "+pw+","+name);

	var users = db.collection('users');

	users.insertMany([{"id":id, "password":pw, "name":name}], function(err, result){
		if(err){
			callback(err, result);
			return;
		}else{
			if(result.insertedCount > 0){
				console.log('Success Adding User : '+ result.insertedCount);
				callback(null, result);
			}else{
				console.log('Fail Adding User');
				callback(null, null);
			}
		}
	});
}//addUser end
// +++ 함수들 정의 하는 부분 +++ end
