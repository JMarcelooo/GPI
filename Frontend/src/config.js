// URL base da API do backend.
// No CRA a variável de ambiente precisa do prefixo REACT_APP_ e é embutida
// em tempo de BUILD (configure REACT_APP_API_URL na Vercel antes do deploy).
// Em desenvolvimento (sem a var), usa URL relativa: o "proxy" do CRA encaminha
// /api/* para o backend (mesma origem → cookie httpOnly funciona em http).
const API_URL = process.env.REACT_APP_API_URL || '';

export default API_URL;
