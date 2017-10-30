var express = require('express');
var http =require('http');
var bodyParser = require('body-parser');
var static = require('serve-static');
var path = require('path');
var cookieParser = require('cookie-parser');
////////////////////////////////////////////////
var expressSession = require('express-session');
var app = express();

app.listen(3000,function(){
	console.log("connected 3000 port");
})
app.use('/public', static(path.join( __dirname, 'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cookieParser());
//////////////////////////
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}))

app.use(function(req, res, next){
	console.log('첫번째 미들웨어 실행됨.');
	next();
})
////////////////////////////////////////////////////////////////////
var rt = express.Router();

rt.route('/process/setUserCookie').get(function(req, res){
	console.log("/process/setUserCookie 라우팅 시작")
	res.cookie('user',{
		name:"Geonil",
		id:"jgi",
		authorized:true
	});
	res.redirect('/process/showCookie');
});

rt.route('/process/showCookie').get(function(req, res){
	console.log('/process/showCookie 라우팅 시작');
	res.send(req.cookies);
});

///////////////////////////////////////////////////////////////////////////////////////////
rt.route('/process/product').get(function(req, res){
	console.log('/process/product 라우팅 시작');

	if(req.session.user){
		res.redirect('/public/product.html');
	}else{
		res.redirect('/public/login2.html');
	}
});

rt.route('/process/login').post(function(req, res){
	console.log('process/login 라우팅 시작');

	var id = req.body.id || req.query.id;
	var pw = req.body.password || req.query.password;
	console.log('Request pramater: '+id+", "+pw);
	if(req.session.user){
		console.log('This id already has been logined.');

		res.redirect('/public/product.html');
	}else{
		req.session.user = {
		id:id,
		name:'Geonil',
		authorized:true;
		};
		res.writeHead(200, {"Content-Type":"text/html; charset=utf8"});
		res.write("<h1>Login Success</h1>");
		res.write("<div><p>"+id+"</p></div>");
		res.write("<div><p><a href='/public/product.html'>Change a page to product</a></p></div>");
		res.end();
		}
});

rt.route('/process/logout').get(function(req, res){
	console.log('/process/logout 라우팅 시작');

	if(req.session.user){
		console.log('Logout');

		req.session.destroy(function(err){
			if(err){
				console.log('error when you try destroy session');
				return;
			}
			console.log('session destroy');
			res.redirect('/public/forSession.html');
		})
	}else{
		console.log('no login');
		res.redirect('/public/forSession.html');
	}
})

//////////////////////////////////////////////////////////////////////////////////////////////////////
app.use('/',rt);
app.all('*', function(req, res){
	res.status(404).send('<h1>요청하신 페이지는 없어요</h1>');
});
