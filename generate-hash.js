const bcrypt = require('bcrypt');
const saltRounds = 12; // Un valor más seguro
const myPassword = 'osadiaJoyas12$'; // <-- CAMBIA ESTO

bcrypt.hash(myPassword, saltRounds).then(hash => {
    console.log("Tu hash de contraseña es:");
    console.log(hash);
});

//En la terminal ejecutar node generate-hash.js