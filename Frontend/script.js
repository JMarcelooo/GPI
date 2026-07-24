function openAuthorModal() {
    document.getElementById('authorModal').style.display = 'flex';
}

function closeAuthorModal() {
    document.getElementById('authorModal').style.display = 'none';
}

function openEditModal() {
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}
// Função para enviar os dados do autor para o backend
async function submitAuthorForm(event) {
    event.preventDefault(); // Impede o envio normal do formulário

    // Coletando os dados do formulário
    const autor = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        vinculo: document.getElementById('vinculo').value,
        departamento: document.getElementById('departamento').value,
        campus: document.getElementById('campus').value,
        universidade: document.getElementById('universidade').value
    };

    try {
        // Enviar dados para o backend via POST
        const response = await fetch('http://localhost:3001/api/autores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(autor),
        });

        if (!response.ok) {
            throw new Error('Erro ao criar autor');
        }

        const data = await response.json();
        console.log('Autor criado com sucesso:', data);

        // Fechar o modal após o envio
        closeAuthorModal();

    } catch (error) {
        console.error('Erro ao enviar dados:', error);
    }
}

// Adicionar evento de submit ao formulário
document.getElementById('authorForm').addEventListener('submit', submitAuthorForm);