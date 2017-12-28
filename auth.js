const bcrypt = require('bcryptjs');

// check password===============================================================
function checkPassword(password, hashedPassword) {

  return new Promise((resolve, reject) => {


    bcrypt.compare(password, hashedPassword, (err, doesMatch) => {


      if (err) {

         reject(err);

      } else {

        resolve(doesMatch);

      }
    });
  });
};
exports.checkPassword = checkPassword;

// hash Password================================================================

function hashPassword(plainTextPassword) {

  return new Promise((resolve, reject) => {

    bcrypt.genSalt((err, salt) => {

      if (err) {
         reject(err)

      } else {

        bcrypt.hash(plainTextPassword, salt, (err, hash) => {

          if (err) {
            return reject(err);
          }
          resolve(hash);

        });
      }
    });
  })
};
exports.hashPassword = hashPassword;
