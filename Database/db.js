//Data base ====================================================================

var spicedPg = require('spiced-pg');
var db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/petition');
// sign petition================================================================

function signPetition(signature, user_id) {
  return db.query(`INSERT INTO signatures (signature, user_id) values ($1, $2) RETURNING id`, [signature, user_id]).then((results) => {
    return results.rows[0]
  })
};

exports.signPetition = signPetition;

// function getUserInfos========================================================

function getUserInfos(user_id, age, city, url) {
  const query = `INSERT INTO user_profiles (user_id, age, city, url) values($1, $2, $3, $4)`
  const params = [user_id, age || null, city, url]
  return db.query(query, params).then((results) => {
    return results.rows[0]
  })
}
exports.getUserInfos = getUserInfos;

// function searchInfos=========================================================

function searchInfos(email) {
  const query = `SELECT first, last, email, users.id, signatures.id AS signatureId FROM users LEFT JOIN signatures ON users.id = signatures.user_id WHERE email = $1`
  const params = [email]
  return db.query(query, params).then((results) => {
    return results.rows[0]
  })
};

exports.searchInfos = searchInfos;

// show user_profile============================================================

function showInfos() {

  const query =
    `SELECT users.first, users.last, users.id, user_profiles.age, user_profiles.city, user_profiles.url
  FROM signatures
  LEFT JOIN users
  ON signatures.user_id = users.id
  LEFT JOIN user_profiles
  ON signatures.user_id = user_profiles.user_id
   `
  return db.query(query).then((results) => {
    return results.rows
  });

};
exports.showInfos = showInfos;

// Get signature================================================================

function getSig(id) {
  const query = `SELECT signature FROM signatures WHERE id = $1`;
  const params = [id];
  return db.query(query, params)
};
exports.getSig = getSig;

//function insertNewUser========================================================

function insertNewUser(first, last, email, password) {
  return db.query('INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id', [first, last, email || null, password || null]).then((results) => {
    return results.rows[0].id
  })
};

exports.insertNewUser = insertNewUser;

//function getHashed============================================================

function getHashed(email) {
  const query = `SELECT password FROM users WHERE email = $1`;
  const params = [email];
  return db.query(query, params).then((results) => {
    return results.rows[0].password
  })
};
exports.getHashed = getHashed;

// function getCities===========================================================

function getUsersByCity(city) {

  const query =
    `SELECT users.first, users.last, user_profiles.age, user_profiles.url, user_profiles.city
  FROM users
  JOIN signatures on users.id = signatures.user_id
  LEFT JOIN user_profiles
  ON users.id = user_profiles.user_id
  WHERE city = $1
  `
  const params = [city]
  return db.query(query, params).then((results) => {
    return results.rows
  });
};
exports.getUsersByCity = getUsersByCity;
// check user infos=============================================================

function checkUserInfos(id) {

  const query = `SELECT users.first, users.last, users.email, users.password,
  user_profiles.age, user_profiles.city, user_profiles.url
  FROM users
  JOIN user_profiles
  ON users.id = user_profiles.user_id
  WHERE users.id = $1
  `
  const params = [id]
  return db.query(query, params).then((results) => {
    return results.rows

  });
};
exports.checkUserInfos = checkUserInfos;
// delete signature ============================================================

function deleteSig(id) {
  const query = 'DELETE FROM signatures WHERE user_id = $1';
  const params = [id]
  return db.query(query, params).then((results) => {});
};

exports.deleteSig = deleteSig;

// update user infos============================================================

function updateUser(password, first, last, email, id) {
  const query = `UPDATE users SET password = $1, first = $2, last = $3, email = $4 WHERE id = $5`;
  const params = [password, first, last, email, id]
  return db.query(query, params).then((results) => {});
};
exports.updateUser = updateUser;

// update profile ==============================================================

function updateProfile(age, city, url, id) {
  const query = `UPDATE user_profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4`;
  const params = [age, city, url, id]
  return db.query(query, params).then((results) => {});
};
exports.updateProfile = updateProfile;
