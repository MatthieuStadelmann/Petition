// REQUIRE MODULES =============================================================
const express = require('express');
const app = express();
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./Database/db');
const csrfProtection = require('csurf')
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const auth = require('./auth');

var city;
var password;


//Tell express to use handlebars engine=========================================
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//USE COOKIE, COOKIE-SESSION, AND BODY PARSERS=================================
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(bodyParser.json());

app.use(cookieSession({
  name: `session`,
  secret: require('./secrets.json').key,
  maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(csrfProtection());

//Serve Static directory========================================================
app.use('/public', express.static(__dirname + '/public'));

//Go to registration if the petition hasn't been signed else thank  you=========

app.get('/', function(req, res) {

  if (req.session.user && req.session.user.signatureId) {
    res.redirect('/thank-you');

  } else if (req.session.user && !req.session.user.signatureId) {
    res.redirect('/login');

  } else {

    res.redirect('/register');
  }
});

// Registration ================================================================
const hashPassword = auth.hashPassword;
const insertNewUser = db.insertNewUser;

app.get('/register', (req, res) => {
  res.render('register', {
    layout: 'main',
    csrfToken: req.csrfToken()
  })
});

app.post('/registered', (req, res) => {
  var first = req.body.first;
  var last = req.body.last;
  var email = req.body.email;
  var password = req.body.password;

  if (!first || !last || !email || !password) {

    res.redirect('/register');

  } else {

    hashPassword(req.body.password).then((hashedPassword) => {
      insertNewUser(req.body.first, req.body.last, req.body.email, hashedPassword).then((id) => {
        req.session.user = {
          first: req.body.first,
          last: req.body.last,
          email: req.body.email,
          id: id
        };

        return res.redirect('/user_profile')

      }).catch((err) => {
        res.render('register', {
          layout: 'main',
          error: 'error'
        });
        console.log(err);
      })

    }).catch((err) => {
      console.log(err);

    });
  };
});

//Features======================================================================
const getUserInfos = db.getUserInfos;

app.get('/user_profile', (req, res) => {
  console.log("inside GET /features");
  res.render('user_profile', {
    layout: 'main',
    csrfToken: req.csrfToken()
  });
});

app.post('/continue', (req, res) => {
  console.log("inside POST /continue")
  var age = req.body.age;
  var city = req.body.city;
  var url = req.body.url;
  var user_id = req.session.user.id; // a voir

  getUserInfos(user_id, age, city, url).then(() => {
    res.redirect('/index');

  }).catch((err) => {
    console.log(err)
  })
})

//Log In =======================================================================

const checkPassword = auth.checkPassword;
const getHashed = db.getHashed;
const searchInfos = db.searchInfos;

app.get('/login', (req, res) => {
  res.render('login', {
    layout: 'main',
    csrfToken: req.csrfToken()
  })
});

app.post('/logedIn', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  if (!email || !password) {

    res.redirect('/login')

  } else {

    getHashed(email).then((hashedPassword) => {
      checkPassword(password, hashedPassword).then((doesMatch) => {

        if (doesMatch) {

          searchInfos(email).then((results) => {
            req.session.user = {
              first: results.first,
              last: results.last,
              email: results.email,
              id: results.id,
              signatureId: results.signatureid
            };
            console.log("here req.session.user", req.session.user)
            res.redirect('/thank-you')
          });

        } else {

          res.redirect('/login')
          console.log("that password did not match");
        }
      }).catch((err) => {
        console.log(err);
      })

    }).catch((err) => {
      res.render('login', {
        layout: 'main',
        error: 'error'
      })
      console.log(err);
    });
  }
});

//sign petition ================================================================

const signPetition = db.signPetition;

app.get('/index', (req, res) => {
  res.render('index', {
    layout: 'main',
    csrfToken: req.csrfToken()

  })
});

app.post('/signed', (req, res) => {

  signPetition(req.body.signature, req.session.user.id).then((results) => {
    req.session.user.signatureId = results.id;
    return res.redirect('/thank-you');

  }).catch((err) => {
    res.render('index', {
      layout: 'main',
      error: 'error',
      csrfToken: req.csrfToken()
    })
    console.log(err)
  });

});

// submit button, thank you page================================================
const getSig = db.getSig;

app.get('/thank-you', (req, res) => {

  getSig(req.session.user.signatureId).then((results) => {

    res.render('thank-you', {
      layout: 'main',
      signature: results.rows[0].signature,
      csrfToken: req.csrfToken()
    })
  }).catch(function(err) {
    console.log(err)
  })
});

// Signature list + user_profiles===============================================

const showInfos = db.showInfos;

app.get('/sig-page', (req, res) => {
  console.log("inside get /sig-page")

  showInfos().then((results) => {
    console.log(results)
    res.render('sig-page', {
      layout: 'main',
      infos: results,
      csrfToken: req.csrfToken()

    })
  }).catch(function(err) {
    console.log(err)
  })
});

// get city route===============================================================
const getUsersByCity = db.getUsersByCity;

app.get('/sig-page/:city', (req, res) => {

  city = req.params.city;
  getUsersByCity(city).then((results) => {
    res.render('city', {
      layout: 'main',
      infos: results,
      city: req.params.city,
      csrfToken: req.csrfToken()
    })
  }).catch(function(err) {
    console.log(err)
  })
});

//route to edit_profile=========================================================
const checkUserInfos = db.checkUserInfos;

app.get('/edit_profile/', (req, res) => {
  id = req.session.user.id;

  checkUserInfos(id).then((results) => {
    res.render('edit_profile', {
      layout: 'main',
      infos: results,
      csrfToken: req.csrfToken(),
    });

  }).catch(function(err) {
    console.log(err)
  })
});

// update user===============================================================

const updateUser = db.updateUser;
const updateProfile = db.updateProfile;

app.post('/update', (req, res) => {
  id = req.session.user.id;
  password = req.body.password;
  first = req.body.first;
  last = req.body.last;
  email = req.body.email;
  age = req.body.age;
  city = req.body.city;
  url = req.body.url;

  if (password.length > 0) {
    hashPassword(password).then((hashedPassword) => {
      updateUser(hashedPassword, first, last, email, id).then(() => {
        updateProfile(age, city, url, id).then(() => {
          checkUserInfos(id).then((results) => {
            res.render('edit_profile', {
              layout: 'main',
              infos: results,
              csrfToken: req.csrfToken(),
            });
          }).catch(function(err) {
            console.log(err)
          })
        }).catch(function(err) {
          console.log(err)
        })
      }).catch(function(err) {
        console.log(err)
      })
    }).catch(function(err) {
      console.log(err)
    });

  } else {
    updateUser(password, first, last, email, id).then(() => {
      updateProfile(age, city, url, id).then(() => {
        checkUserInfos(id).then((results) => {
          res.render('edit_profile', {
            layout: 'main',
            infos: results,
            csrfToken: req.csrfToken(),
          });
        }).catch(function(err) {
          console.log(err)
        })
      }).catch(function(err) {
        console.log(err)
      })
    }).catch(function(err) {
      console.log(err)
    })
  }
  return res.redirect('/edit_profile');
});

//delete signature =============================================================
const deleteSig = db.deleteSig;

app.get('/delete-sig', (req, res) => {
  id = req.session.user.id;
  deleteSig(id).then(() => {
    res.redirect('/index')
  }).catch(function(err) {
    console.log(err)
  });
});
// BACK button==================================================================
app.post('/back', (req, res) => {
  res.redirect('/thank-you')
});
//logout & redirect to register ================================================

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/register')
});

app.listen(process.env.PORT || 8080, () => console.log(`I'm listening.`))
