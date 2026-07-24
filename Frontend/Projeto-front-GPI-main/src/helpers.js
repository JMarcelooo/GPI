// utils.js
export const traduzirCampos = (dadosFront) => {
  return {
    nome: dadosFront.name,
    email: dadosFront.email,
    vinculo: dadosFront.bond,
    departamento: dadosFront.department,
    campus: dadosFront.campus,
    universidade: dadosFront.university
  };
};
