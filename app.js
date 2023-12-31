const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const nocache = require('nocache')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
require('dotenv').config()


const port = normalizePort(process.env.PORT || '4000');
app.set('port', port);
console.log(`http://localhost:${port}`);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "key",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 }
}))

// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new LocalStrategy)



app.use('/', userRouter);
app.use('/admin', adminRouter);


// Error rendering route for 'ERROR' page
app.get('/ERROR', (req, res) => {
  res.render('ERROR');
});

// Error handling middleware for 404 Not Found
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handling middleware
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});



const debug = require('debug')('av-project-week-8:server');
const http = require('http');
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) { return val; }
  if (port >= 0) { return port; }
  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;


  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}


function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


module.exports = app;
