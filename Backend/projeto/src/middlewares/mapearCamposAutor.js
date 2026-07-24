// middlewares/mapearCamposAutor.js

function mapearCamposAutor(req, res, next) {
  const { name, university, bond, campus, email } = req.body;

  req.body = {
    nome: name,
    universidade: university,
    vinculo: bond,
    campus,
    email,
  };

  next();
}

module.exports = mapearCamposAutor;
