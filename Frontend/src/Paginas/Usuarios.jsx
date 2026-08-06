import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import Toast from '../Components/Toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Autor.css';

const API = process.env.REACT_APP_API_URL;

function Usuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({ nome: '', email: '', role: 'usuario', senhaInicial: '' });
  const [editForm, setEditForm] = useState({ role: 'usuario', ativo: true, novaSenha: '' });
  const [formErro, setFormErro] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/usuarios`);
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u =>
    !searchTerm ||
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setForm({ nome: '', email: '', role: 'usuario', senhaInicial: '' });
    setFormErro(null);
    setShowAdd(true);
  };

  const openEdit = (u) => {
    setSelected(u);
    setEditForm({ role: u.role, ativo: u.ativo, novaSenha: '' });
    setFormErro(null);
    setShowEdit(true);
  };

  const openDelete = (u) => {
    setSelected(u);
    setShowDelete(true);
  };

  const isSelf = (u) => String(u.id) === String(currentUser?.id);

  async function handleCreate(e) {
    e.preventDefault();
    setFormErro(null);
    if (!form.nome || !form.email || !form.senhaInicial) {
      setFormErro('Preencha nome, e-mail e senha inicial.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/api/usuarios`, form);
      setShowAdd(false);
      await loadUsers();
      setToast({ message: 'Usuário criado com sucesso!', type: 'success' });
    } catch (error) {
      const data = error.response?.data;
      if (data?.errors) setFormErro(data.errors.join(' '));
      else if (data?.error) setFormErro(data.error);
      else setFormErro('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setFormErro(null);
    setSaving(true);
    try {
      const body = { role: editForm.role, ativo: editForm.ativo };
      if (editForm.novaSenha) body.novaSenha = editForm.novaSenha;
      await axios.put(`${API}/api/usuarios/${selected.id}`, body);
      setShowEdit(false);
      await loadUsers();
      setToast({ message: 'Usuário atualizado com sucesso!', type: 'success' });
    } catch (error) {
      const data = error.response?.data;
      if (data?.error) setFormErro(data.error);
      else setFormErro('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.delete(`${API}/api/usuarios/${selected.id}`);
      setShowDelete(false);
      setSelected(null);
      await loadUsers();
      setToast({ message: 'Usuário removido com sucesso!', type: 'success' });
    } catch (error) {
      setShowDelete(false);
      const data = error.response?.data;
      const msg = data?.error || 'Erro ao excluir usuário.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const roleLabel = (role) => role === 'admin' ? 'Administrador' : 'Usuário';

  return (
    <div className="authors-container">
      <Sidebar />
      <div className="authors-content">
        <h1 className="authors-title">Usuários</h1>

        <div className="authors-header">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-buttons">
            <button className="filter-button" onClick={openAdd}>
              <UserPlus size={16} className="filter-icon" /> Novo usuário
            </button>
          </div>
        </div>

        <div className="authors-table-wrapper">
          <table className="authors-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>Nenhum usuário encontrado</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.nome}{isSelf(u) && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-primary)' }}>(você)</span>}</td>
                  <td>{u.email}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td>
                    <span style={{ color: u.ativo ? 'var(--color-success, #16a34a)' : 'var(--color-error)' }}>
                      {u.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td>
                    <button className="edit-author-button" onClick={() => openEdit(u)} disabled={isSelf(u)} title={isSelf(u) ? 'Não é possível editar a própria conta' : 'Editar'} style={{ opacity: isSelf(u) ? 0.4 : 1 }}>
                      <Pencil size={16} />
                    </button>
                    <button className="edit-author-button" onClick={() => openEdit(u)} disabled={isSelf(u)} title={isSelf(u) ? 'Não é possível resetar a própria senha' : 'Resetar senha'} style={{ marginLeft: 4, opacity: isSelf(u) ? 0.4 : 1 }}>
                      <RefreshCw size={16} />
                    </button>
                    <button className="delete-author-button" onClick={() => openDelete(u)} disabled={isSelf(u)} title={isSelf(u) ? 'Não é possível excluir a própria conta' : 'Excluir'} style={{ marginLeft: 4, opacity: isSelf(u) ? 0.4 : 1 }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content-author">
            <div className="modal-header-author">
              <h2>Novo usuário</h2>
              <button className="close-button" onClick={() => setShowAdd(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <label className="form-label" htmlFor="u-nome">Nome</label>
              <input id="u-nome" className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              <label className="form-label" htmlFor="u-email">E-mail</label>
              <input id="u-email" className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <label className="form-label" htmlFor="u-role">Papel</label>
              <select id="u-role" className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="usuario">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
              <label className="form-label" htmlFor="u-senha">Senha inicial</label>
              <input id="u-senha" className="form-input" type="password" value={form.senhaInicial} onChange={e => setForm({ ...form, senhaInicial: e.target.value })} placeholder="Mínimo 6 caracteres" />
              {formErro && <p className="form-erro">{formErro}</p>}
              <div className="modal-actions-author">
                <button type="button" className="cancel-button" onClick={() => setShowAdd(false)}>Cancelar</button>
                <button type="submit" className="save-button" disabled={saving}>{saving ? 'Salvando...' : 'Criar usuário'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && selected && (
        <div className="modal-overlay">
          <div className="modal-content-author">
            <div className="modal-header-author">
              <h2>Editar usuário</h2>
              <button className="close-button" onClick={() => setShowEdit(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate}>
              <p style={{ margin: 'var(--space-2) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                <strong>{selected.nome}</strong> ({selected.email})
              </p>
              <label className="form-label" htmlFor="e-role">Papel</label>
              <select id="e-role" className="form-input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="usuario">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
              <label className="form-label" htmlFor="e-ativo">Status</label>
              <select id="e-ativo" className="form-input" value={editForm.ativo} onChange={e => setEditForm({ ...editForm, ativo: e.target.value === 'true' })}>
                <option value="true">Ativo</option>
                <option value="false">Desativado</option>
              </select>
              <label className="form-label" htmlFor="e-senha">Resetar senha (opcional)</label>
              <input id="e-senha" className="form-input" type="password" value={editForm.novaSenha} onChange={e => setEditForm({ ...editForm, novaSenha: e.target.value })} placeholder="Deixe em branco para manter" />
              {formErro && <p className="form-erro">{formErro}</p>}
              <div className="modal-actions-author">
                <button type="button" className="cancel-button" onClick={() => setShowEdit(false)}>Cancelar</button>
                <button type="submit" className="save-button" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && selected && (
        <div className="modal-overlay">
          <div className="modal-content-author">
            <div className="modal-header-author">
              <h2>Excluir usuário</h2>
              <button className="close-button" onClick={() => setShowDelete(false)}>&times;</button>
            </div>
            <div className="modal-subtitle">Confirmação</div>
            <p style={{ margin: 'var(--space-4) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Tem certeza que deseja excluir <strong>{selected.nome}</strong>? O acesso será removido permanentemente.
            </p>
            <div className="modal-actions-author">
              <button className="cancel-button" onClick={() => setShowDelete(false)}>Cancelar</button>
              <button className="save-button" onClick={handleDelete} style={{ background: 'var(--color-error, #dc3545)' }} disabled={saving}>
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

export default Usuarios;
