import API_URL from "../config";
import {
  FileText,
  Wallet,
  Newspaper,
  Users,
  ShieldCheck,
  Search,
  X,
  History,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  MinusCircle
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Toast from "../Components/Toast";
import "../Tela2.css";
import "./Logs.css";
import "./LogRPI.css";
const API = API_URL;
const PAGE_SIZE = 15;
const TIPOS = [
  { value: "pi", label: "PI", icon: FileText },
  { value: "pagamento", label: "Pagamento", icon: Wallet },
  { value: "rpi", label: "RPI", icon: Newspaper },
  { value: "autor", label: "Autor", icon: Users },
  { value: "usuario", label: "Usu\xE1rio", icon: ShieldCheck }
];
const ACES = [
  { value: "criacao", label: "Cria\xE7\xE3o" },
  { value: "atualizacao", label: "Atualiza\xE7\xE3o" },
  { value: "exclusao", label: "Exclus\xE3o" }
];
const ACES_LABEL = Object.fromEntries(ACES.map((a) => [a.value, a.label]));
const ICONES_TIPO = Object.fromEntries(TIPOS.map((t) => [t.value, t.icon]));
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 6e4);
  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `H\xE1 ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `H\xE1 ${hours} hora${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `H\xE1 ${days} dia${days !== 1 ? "s" : ""}`;
  return date.toLocaleDateString("pt-BR");
}
function dataCompleta(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}
function Logs() {
  document.title = "GPI - Logs";
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState("");
  const [acao, setAcao] = useState("");
  const [usuario, setUsuario] = useState("");
  const [q, setQ] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const navigate = useNavigate();
  const [qDebounced, setQDebounced] = useState("");
  const timerRef = useRef(null);
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(timerRef.current);
  }, [q]);
  const [aba, setAba] = useState("eventos");
  const carregar = useCallback(async (pag) => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (pag - 1) * PAGE_SIZE,
        ...tipo && { tipo },
        ...acao && { acao },
        ...usuario && { usuario },
        ...qDebounced && { q: qDebounced },
        ...inicio && { inicio },
        ...fim && { fim }
      };
      const res = await axios.get(`${API}/api/historico`, { params });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setError("");
    } catch (err) {
      setError(err.response?.status === 403 ? "Acesso restrito a administradores." : "Erro ao carregar o hist\xF3rico.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tipo, acao, usuario, qDebounced, inicio, fim]);
  useEffect(() => {
    setPage(1);
    carregar(1);
  }, [carregar]);
  const irParaPagina = (pag) => {
    const p = Math.min(Math.max(pag, 1), totalPages);
    setPage(p);
    carregar(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const paginasVisiveis = () => {
    const janela = 2;
    const nums = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || p >= page - janela && p <= page + janela) {
        nums.push(p);
      }
    }
    const resultado = [];
    let prev = 0;
    nums.forEach((p) => {
      if (prev && p - prev > 1) resultado.push("...");
      resultado.push(p);
      prev = p;
    });
    return resultado;
  };
  useEffect(() => {
    axios.get(`${API}/api/historico/usuarios`).then((res) => setUsuarios(res.data.data || [])).catch(() => {
    });
  }, []);
  const temFiltros = tipo || acao || usuario || qDebounced || inicio || fim;
  const limparFiltros = () => {
    setTipo("");
    setAcao("");
    setUsuario("");
    setQ("");
    setInicio("");
    setFim("");
  };
  const abrirDestino = (item) => {
    if (item.pi_id) navigate(`/detalhes/${item.pi_id}`);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "container" }, /* @__PURE__ */ React.createElement(Sidebar, null), /* @__PURE__ */ React.createElement("div", { className: "main anim-fade" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("h2", null, "Logs")), /* @__PURE__ */ React.createElement("div", { className: "logs-tabs" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `logs-tab${aba === "eventos" ? " logs-tab--ativo" : ""}`,
      onClick: () => setAba("eventos")
    },
    "Eventos"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `logs-tab${aba === "rpi" ? " logs-tab--ativo" : ""}`,
      onClick: () => setAba("rpi")
    },
    "Edi\xE7\xF5es da RPI"
  )), aba === "eventos" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "logs-header" }, /* @__PURE__ */ React.createElement("p", { className: "logs-subtitle" }, total > 0 ? `${total} evento${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}` : "Hist\xF3rico de a\xE7\xF5es do sistema")), /* @__PURE__ */ React.createElement("div", { className: "logs-filtros" }, /* @__PURE__ */ React.createElement("div", { className: "logs-filtro" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "log-tipo" }, "Tipo"), /* @__PURE__ */ React.createElement("select", { id: "log-tipo", value: tipo, onChange: (e) => setTipo(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Todos"), TIPOS.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.value, value: t.value }, t.label)))), /* @__PURE__ */ React.createElement("div", { className: "logs-filtro" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "log-acao" }, "A\xE7\xE3o"), /* @__PURE__ */ React.createElement("select", { id: "log-acao", value: acao, onChange: (e) => setAcao(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Todas"), ACES.map((a) => /* @__PURE__ */ React.createElement("option", { key: a.value, value: a.value }, a.label)))), /* @__PURE__ */ React.createElement("div", { className: "logs-filtro" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "log-usuario" }, "Usu\xE1rio"), /* @__PURE__ */ React.createElement("select", { id: "log-usuario", value: usuario, onChange: (e) => setUsuario(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Todos"), usuarios.map((u) => /* @__PURE__ */ React.createElement("option", { key: u, value: u }, u === "Sistema" ? "Sistema (autom\xE1tico)" : u)))), /* @__PURE__ */ React.createElement("div", { className: "logs-filtro" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "log-q" }, "Busca"), /* @__PURE__ */ React.createElement("div", { className: "logs-busca" }, /* @__PURE__ */ React.createElement(Search, { size: 14 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "log-q",
      type: "text",
      placeholder: "Buscar na descri\xE7\xE3o...",
      value: q,
      onChange: (e) => setQ(e.target.value)
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "logs-filtro" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "log-inicio" }, "De"), /* @__PURE__ */ React.createElement("input", { id: "log-inicio", type: "date", value: inicio, onChange: (e) => setInicio(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "logs-filtro" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "log-fim" }, "At\xE9"), /* @__PURE__ */ React.createElement("input", { id: "log-fim", type: "date", value: fim, onChange: (e) => setFim(e.target.value) })), temFiltros && /* @__PURE__ */ React.createElement("button", { className: "logs-limpar", onClick: limparFiltros }, /* @__PURE__ */ React.createElement(X, { size: 14 }), " Limpar")), error && /* @__PURE__ */ React.createElement("p", { className: "logs-error" }, error), loading && items.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "logs-empty" }, "Carregando...") : items.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "logs-empty" }, /* @__PURE__ */ React.createElement(History, { size: 40 }), /* @__PURE__ */ React.createElement("p", null, "Nenhum evento encontrado", temFiltros ? " com os filtros atuais." : ".")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "logs-list" }, items.map((item) => {
    const Icone = ICONES_TIPO[item.tipo] || History;
    const autorEvento = item.usuario_nome || "Sistema";
    return /* @__PURE__ */ React.createElement("div", { key: item.id, className: `log-item log-item--${item.tipo}` }, /* @__PURE__ */ React.createElement("span", { className: "log-icone" }, /* @__PURE__ */ React.createElement(Icone, { size: 16 })), /* @__PURE__ */ React.createElement("div", { className: "log-conteudo" }, /* @__PURE__ */ React.createElement("div", { className: "log-topo" }, /* @__PURE__ */ React.createElement("span", { className: `log-badge log-badge--${item.acao}` }, ACES_LABEL[item.acao] || item.acao), (item.pi_titulo || item.pi_id) && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "log-pi-titulo",
        onClick: () => abrirDestino(item),
        style: { background: "none", border: "none", cursor: item.pi_id ? "pointer" : "default", padding: 0 }
      },
      item.pi_titulo || `PI ${item.pi_id}`
    )), /* @__PURE__ */ React.createElement("p", { className: "log-descricao" }, item.descricao), /* @__PURE__ */ React.createElement("div", { className: "log-meta" }, /* @__PURE__ */ React.createElement("span", null, "por ", /* @__PURE__ */ React.createElement("span", { className: "log-quem" }, autorEvento)), /* @__PURE__ */ React.createElement("span", { title: dataCompleta(item.createdAt) }, timeAgo(item.createdAt)))));
  })), loading && items.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "logs-loading-mini" }, "Carregando..."), totalPages > 1 && /* @__PURE__ */ React.createElement("div", { className: "logs-paginacao" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "logs-pag-btn",
      onClick: () => irParaPagina(page - 1),
      disabled: page <= 1 || loading
    },
    /* @__PURE__ */ React.createElement(ChevronLeft, { size: 16 }),
    " Anterior"
  ), paginasVisiveis().map((p, i) => p === "..." ? /* @__PURE__ */ React.createElement("span", { key: `e${i}`, className: "logs-pag-ellipsis" }, "\u2026") : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      key: p,
      className: `logs-pag-btn${p === page ? " logs-pag-btn--ativo" : ""}`,
      onClick: () => irParaPagina(p),
      disabled: loading
    },
    p
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "logs-pag-btn",
      onClick: () => irParaPagina(page + 1),
      disabled: page >= totalPages || loading
    },
    "Pr\xF3xima ",
    /* @__PURE__ */ React.createElement(ChevronRight, { size: 16 })
  )))) : /* @__PURE__ */ React.createElement(RpiEdicoes, null)));
}
function RpiEdicoes() {
  const [edicoes, setEdicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandidas, setExpandidas] = useState({});
  const [verificando, setVerificando] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/rpi-monitor/log`);
      setEdicoes(res.data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.status === 403 ? "Acesso restrito a administradores." : "Erro ao carregar o log de edi\xE7\xF5es.");
      setEdicoes([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);
  const toggleExpandida = (numero) => {
    setExpandidas((prev) => ({ ...prev, [numero]: !prev[numero] }));
  };
  const handleVerificar = async () => {
    if (verificando) return;
    setVerificando(true);
    setToast(null);
    try {
      const res = await axios.post(`${API}/api/rpi-monitor/verificar`);
      const r = res.data;
      const processadas = (r.resultados || []).filter((x) => x.status === "processada");
      if (processadas.length > 0) {
        await carregar();
        const totalRpis = processadas.reduce((s, p) => s + (p.criadas?.rpis || 0), 0);
        const totalNotifs = processadas.reduce((s, p) => s + (p.criadas?.notificacoes || 0), 0);
        setToast({
          type: "success",
          message: totalRpis > 0 ? `${processadas.length} edi\xE7\xE3o(\xF5es) processada(s): ${totalRpis} RPI(s) e ${totalNotifs} notifica\xE7\xE3o(\xF5es).` : `${processadas.length} edi\xE7\xE3o(\xF5es) processada(s), sem altera\xE7\xF5es nas PIs monitoradas.`
        });
      } else if (r.status === "ja_em_execucao") {
        setToast({ type: "success", message: "Uma verifica\xE7\xE3o j\xE1 est\xE1 em andamento." });
      } else {
        setToast({ type: "success", message: "Nenhuma edi\xE7\xE3o nova publicada no INPI." });
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.status === 403 ? "Acesso restrito a administradores." : err.response?.data?.error || "Erro ao verificar edi\xE7\xF5es da RPI."
      });
    } finally {
      setVerificando(false);
    }
  };
  const totalMudancas = edicoes.reduce((s, e) => s + (e.total_mudancas || 0), 0);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "logs-header" }, /* @__PURE__ */ React.createElement("p", { className: "logs-subtitle" }, edicoes.length > 0 ? `${edicoes.length} edi\xE7\xE3o(\xF5es) monitorada(s) \xB7 ${totalMudancas} altera\xE7\xE3o(\xF5es) registrada(s)` : "Publica\xE7\xF5es da Revista da Propriedade Industrial verificadas pelo sistema"), /* @__PURE__ */ React.createElement("button", { className: "logs-verificar", onClick: handleVerificar, disabled: verificando }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 16, className: verificando ? "logs-spin" : "" }), verificando ? "Verificando..." : "Verificar RPIs")), toast && /* @__PURE__ */ React.createElement(Toast, { type: toast.type, message: toast.message, onClose: () => setToast(null) }), error && /* @__PURE__ */ React.createElement("p", { className: "logs-error" }, error), loading ? /* @__PURE__ */ React.createElement("p", { className: "logs-empty" }, "Carregando...") : edicoes.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "logs-empty" }, /* @__PURE__ */ React.createElement(Newspaper, { size: 40 }), /* @__PURE__ */ React.createElement("p", null, "O monitor ainda n\xE3o processou nenhuma edi\xE7\xE3o da RPI.")) : /* @__PURE__ */ React.createElement("div", { className: "logrpi-list" }, edicoes.map((e) => {
    const aberta = expandidas[e.numero];
    const temMudancas = (e.total_mudancas || 0) > 0;
    return /* @__PURE__ */ React.createElement("div", { key: e.numero, className: `logrpi-edicao${temMudancas ? "" : " logrpi-edicao--vazia"}` }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "logrpi-cabecalho",
        onClick: () => temMudancas && toggleExpandida(e.numero),
        disabled: !temMudancas,
        title: temMudancas ? void 0 : "Edi\xE7\xE3o sem altera\xE7\xF5es nas PIs monitoradas"
      },
      temMudancas ? aberta ? /* @__PURE__ */ React.createElement(ChevronDown, { size: 18 }) : /* @__PURE__ */ React.createElement(ChevronRight, { size: 18 }) : /* @__PURE__ */ React.createElement(MinusCircle, { size: 18 }),
      /* @__PURE__ */ React.createElement("span", { className: "logrpi-numero" }, "RPI ", e.numero),
      /* @__PURE__ */ React.createElement("span", { className: "logrpi-datas" }, "publicada ", formatarData(e.data_publicacao)),
      /* @__PURE__ */ React.createElement("span", { className: `logrpi-badge${temMudancas ? "" : " logrpi-badge--vazia"}` }, temMudancas ? `${e.total_mudancas} altera\xE7\xE3o${e.total_mudancas !== 1 ? "\xF5es" : ""}` : "Sem altera\xE7\xF5es"),
      /* @__PURE__ */ React.createElement("span", { className: "logrpi-processada" }, "processada em ", formatarMomento(e.processada_em))
    ), temMudancas && aberta && /* @__PURE__ */ React.createElement("div", { className: "logrpi-mudancas" }, e.mudancas.map((m) => /* @__PURE__ */ React.createElement("button", { key: m.historico_id, className: "logrpi-mudanca", onClick: () => navigate(`/detalhes/${m.pi_id}`) }, /* @__PURE__ */ React.createElement(CheckCircle2, { size: 15 }), /* @__PURE__ */ React.createElement("div", { className: "logrpi-mudanca-conteudo" }, /* @__PURE__ */ React.createElement("span", { className: "logrpi-pi-titulo" }, m.pi_titulo || `PI ${m.pi_id}`), /* @__PURE__ */ React.createElement("p", { className: "logrpi-pi-descricao" }, m.descricao)), /* @__PURE__ */ React.createElement("span", { className: "logrpi-mudanca-hora" }, formatarMomento(m.createdAt))))));
  })));
}
function formatarData(dataStr) {
  if (!dataStr) return "-";
  const d = /* @__PURE__ */ new Date(String(dataStr).slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}
function formatarMomento(dataStr) {
  if (!dataStr) return "-";
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export default Logs;
