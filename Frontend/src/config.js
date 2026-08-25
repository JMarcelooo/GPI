// URL base da API do backend.
// No CRA a variável de ambiente precisa do prefixo REACT_APP_ e é embutida
// em tempo de BUILD (configure REACT_APP_API_URL na Vercel antes do deploy).
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default API_URL;
