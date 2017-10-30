
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
//var MongoClient = require('mongodb').MongoClient; -> mongoose를 사용함 MVC를 사용한다. -> MySql을 사용한다.
var mysql = require('mysql');
// ===end==

//===express 모듈을 사용하기 위한 선언===
var app = express();
//=== end ===
//=== MYsql 데이터베이스 연결을 사용하기 위한 설정 ===
var pool = mysql.createPool({
  connectionLimit:10,
  host:'localhost',
  user:'root',
  password:'root!@#$',
  database:'test',
  debug:false
});
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

  authUser(userId, userPw, function(err, rows){
    if(err){
      console.log('Error at /process/login1');
      res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
      res.write('<h1>에러발생</h1>');
      res.write('<br><br><a href="/public/adduser.html">Go to adduser</a>');
      res.end();
    }else{
      if(rows){
        console.dir(rows);
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>로그인 성공</h1>');
        res.write('<div><p>사용자 : ' +rows[0].name+'</p></div>');
        res.write('<br><br><a href="/public/login.html">되돌아가기</a>');
        res.write('<br><br><a href="/process/listuser">목록보기</a>');
        res.end();
      }else{
        console.log('Error at /process/login2');
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>에러발생</h1>');
        res.write('<br><br><a href="/public/adduser.html">Go to adduser</a>');
        res.end();
      }
    }
  })//authUser end
}); //process/login end
//데이터 베이스를 사용하여 로그인을 해보기 위한 라우트.END

//데이터 베이스를 사용하여 사용자 추가 해보기 위한 라우트.
router.route('/process/adduser').post(function(req, res){
  console.log('START /process/adduser');

	var userId = req.body.id ||  req.query.id;
	var userPw = req.body.password || req.query.password;
	var userName = req.body.name || req.query.name;
  var userAge = req.body.age || req.query.age;
	console.log('Got the datas ID: '+userId+", Password: "+userPw+", Name: "+userName+", Age: "+userAge);

  addUser(userId, userPw, userName, userAge, function(err, addedUser){
    if(err){
      console.log('Error at /process/addUser1');
      res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
      res.write('<h1>에러발생</h1>');
      res.write('<br><br><a href="/public/adduser2.html">Go to adduser</a>');
      res.end();
      return;
    }else{
      if(addedUser){
        console.dir(addedUser);
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>사용자 추가 성공</h1>');
        res.write('<br><br><a href="/public/login.html">Go to Login</a>');
        res.end();
      }else{
        console.log('Error at /process/addUser2');
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>사용자 추가 안됨.</h1>');
        res.write('<br><br><a href="/public/adduser2.html">Go to adduser</a>');
        res.end();
        return;
      }
    }
  })
}); //process/adduser end

router.route('/process/listuser').get(function(req, res){
  console.log('START /process/listuser');

  listUser(function(err, rows){
      if(err){
        console.log('에러발생');
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>에러발생</h1>');
        res.write('<br><br><a href="/public/adduser2.html">Go to adduser</a>');
        res.end();
        return;
      }
      if(rows){
        console.dir(rows);
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>로그인 성공</h1>');
        res.write('<table border="1px">');
        res.write('<tr><th>이름</th><th>나이</th><th>아이디</th></tr>');
        for (var i = 0; i < rows.length; i++) {
          var id = rows[i].id;
          var name = rows[i].name;
          var age = rows[i].age;
          res.write('<tr>');
          res.write('<td>'+name+'</td>'+'<td>'+age+'</td>'+'<td>'+id+'</td>');
          res.write('</tr>');
        }
        res.write('</table>');
        res.write('<br><br><a href="/public/adduser2.html">Go to adduser</a>');
        res.end();
      }else{
        console.log('에러발생');
        res.writeHead(200, { "Content-Type":"text/html;charset=utf8"});
        res.write('<h1>사용자 데이터 조회안됨</h1>');
        res.end();
      }
    });
}) ///process/listuser end


//데이터 베이스를 사용하여 사용자 추가 해보기 위한 라우트.END
app.use('/',router);
// +++  라우팅 시작 END+++

// +++ 함수들 정의 하는 부분 +++
var authUser = function(id, pw, callback){
	console.log('Call authUser : '+id+", "+pw);

	pool.getConnection(function(err, conn){
    if(err){
      if(conn){
        conn.release();
      }
      callback(err, null);
      return;
    }else{
      console.log('Connected a database ID : '+conn.thredId);

      var tablename = "users";
      var colums = ['id','name','age'];
      var exec = conn.query("select ?? from ?? where id=? and password =?", [colums, tablename, id, pw], function(err, rows){
        conn.release();
        console.log('Used SQL : '+exec.sql);
        if(err){
          callback(err, null);
          return;
        }else{
          if(rows.length > 0){
            console.log('Found a User');
            callback(null, rows);
          }else{
            console.log('Not Found a User');
            callback(null, null);
          }
        }
      })
    }
  });//pool.getConnection end
}//authUser end

var addUser = function(id, pw, name, age, callback){
	console.log('Call addUer : '+id+", "+pw+","+name+", "+age);

  pool.getConnection(function(err, conn){
    if(err){
      if(conn){
        conn.release();
      }
      callback(err, null);
      return;
    }else{
      console.log('Connected a database ID : '+conn.thredId);
      var data = {id:id, name:name, age:age, password:pw};
      var exec = conn.query('insert into users set ?', data, function(err, result){
          conn.release();
          console.log('Used SQL : '+exec.sql);
          if(err){
            console.log('Error Using sql');
            callback(err, null);
          }else{
            callback(null, result);
          }
      });
    }
  });
}//addUser end

var listUser = function(callback){
  console.log('Call listuser');
  pool.getConnection(function(err, conn){
    if(err){
      if(conn){
        conn.release();
      }
      callback(err, null);
      return;
    }else{
      console.log('Connected a database ID : '+conn.thredId);
      var exec = conn.query("select * from users", function(err, rows){
        conn.release();
        console.log('Used SQL : '+exec.sql);
        if(err){
          callback(err, null);
          return;
        }else{
          if(rows.length > 0){
            console.log('Fonud A User');
            callback(null, rows);
          }else{
            console.log('Not Found A User');
            callback(null, null);
          }
        }
      })
    }
  })
}// listuser end
// +++ 함수들 정의 하는 부분 +++ end
