// ---------- MENU & UTIL ----------
function toggleMenu() {
  const menu = document.getElementById("menuBox");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}
function toggleDarkMode() {
  document.body.classList.toggle("light-mode");
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener('click', (e) => {
  const menu = document.getElementById("menuBox");
  if (!e.target.closest('.menu-box') && !e.target.closest('.menu-btn')) {
    if (menu) menu.style.display = 'none';
  }
});

// ---------- DATA (localStorage) ----------
const STORAGE_KEY = "escala_app_v2";
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

if (!state) {
  state = {
    colaboradores: [], // {id, nome, telefone}
    grupos: Array.from({length:10}, (_,i) => ({ id: i+1, nome: 'Grupo ' + (i+1), data:'', membros: [] }))
  };
  saveState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(){ return Math.random().toString(36).slice(2,9); }

// ---------- COLABORADORES ----------
function addColaborador() {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  if (!nome) { alert("Digite um nome"); return; }
  if (state.colaboradores.length >= 300) { alert("Limite de 300 colaboradores atingido"); return; }
  const novo = { id: uid(), nome, telefone };
  state.colaboradores.push(novo);
  saveState();
  document.getElementById("nome").value = "";
  document.getElementById("telefone").value = "";
  renderColaboradores();
  renderGrupos();
}

function importExemplo(){
  const exemplos = [
    { nome: "Ana Silva", telefone: "11 98888-0001" },
    { nome: "Carlos Souza", telefone: "11 98888-0002" },
    { nome: "Bruna Lima", telefone: "11 98888-0003" },
    { nome: "Diego Rocha", telefone: "11 98888-0004" },
    { nome: "Mariana Alves", telefone: "11 98888-0005" }
  ];
  exemplos.forEach(e => state.colaboradores.push({ id: uid(), ...e }));
  saveState(); renderColaboradores(); renderGrupos();
}

function editColaborador(id) {
  const c = state.colaboradores.find(x=>x.id===id);
  if(!c) return;
  const nn = prompt("Novo nome:", c.nome);
  if (nn === null) return;
  const nt = prompt("Novo telefone:", c.telefone || "");
  if (nt === null) return;
  c.nome = nn.trim(); c.telefone = nt.trim();
  // update copies in groups
  state.grupos.forEach(g => {
    g.membros = g.membros.map(m => m.id === id ? { ...m, nome: c.nome, telefone: c.telefone } : m);
  });
  saveState(); renderColaboradores(); renderGrupos();
}

function removeColaborador(id) {
  if (!confirm("Remover colaborador?")) return;
  state.colaboradores = state.colaboradores.filter(c => c.id !== id);
  state.grupos.forEach(g => g.membros = g.membros.filter(m => m.id !== id));
  saveState(); renderColaboradores(); renderGrupos();
}

// ---------- GRUPOS ----------
function renderGrupos(){
  const box = document.getElementById("grupos");
  if(!box) return;
  box.innerHTML = "";
  state.grupos.forEach((g, i) => {
    const div = document.createElement("div");
    div.className = "group-card";

    const header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML = `
      <div>
        <strong>${g.nome}</strong><br>
        <small>Data: ${g.data || "Não definida"}</small>
      </div>
      <div>
        <button class="ghost" onclick="renameGroup(${i})">Nome</button>
        <button class="ghost" onclick="editGroupDate(${i})">Data</button>
      </div>
    `;
    div.appendChild(header);

    // select + add button
    const sel = document.createElement("select");
    sel.id = "select-"+i;
    sel.innerHTML = `<option value="">— Selecionar colaborador —</option>` +
      state.colaboradores.map(c => `<option value="${c.id}">${c.nome}${c.telefone ? ' — ' + c.telefone : ''}</option>`).join("");
    div.appendChild(sel);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Adicionar";
    addBtn.style.marginTop = "8px";
    addBtn.onclick = () => {
      const val = sel.value;
      if(!val) { alert("Selecione um colaborador"); return; }
      addToGroup(i, val);
    };
    div.appendChild(addBtn);

    // members list
    const ul = document.createElement("ul");
    ul.style.marginTop = "10px";
    g.membros.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `${m.nome} ${m.telefone ? '— ' + m.telefone : ''} <span style="float:right">
        <button class="ghost" onclick='editMember("${m.id}")'>Editar</button>
        <button style="background:#ff6161;color:#fff;border:none;padding:6px 8px;border-radius:6px;margin-left:6px;" onclick='removeFromGroup(${i},"${m.id}")'>Remover</button>
      </span>`;
      ul.appendChild(li);
    });
    div.appendChild(ul);

    box.appendChild(div);
  });
}

function renameGroup(index){
  const novo = prompt("Novo nome do grupo:", state.grupos[index].nome);
  if(!novo) return;
  state.grupos[index].nome = novo.trim();
  saveState(); renderGrupos();
}

function editGroupDate(index){
  const data = prompt("Data do grupo (ex: 10/02/2025):", state.grupos[index].data || "");
  if(data === null) return;
  state.grupos[index].data = data.trim();
  saveState(); renderGrupos();
}

function addToGroup(index, colaboradorId){
  const col = state.colaboradores.find(c => c.id === colaboradorId);
  if(!col) return;
  const grupo = state.grupos[index];
  if(grupo.membros.some(m => m.id === col.id)) { alert("Já existe no grupo"); return; }
  grupo.membros.push({...col});
  saveState(); renderGrupos();
}

function removeFromGroup(index, colaboradorId){
  if(!confirm("Remover do grupo?")) return;
  state.grupos[index].membros = state.grupos[index].membros.filter(m => m.id !== colaboradorId);
  saveState(); renderGrupos();
}

function editMember(id){
  // edit global collaborator (keeps data consistent)
  editColaborador(id);
}

// ---------- RENDER COLABORADORES ----------
function renderColaboradores(){
  const box = document.getElementById("listaColaboradores");
  if(!box) return;
  box.innerHTML = "";
  if(state.colaboradores.length === 0){
    box.innerHTML = "<div class='small'>Nenhum colaborador. Use Exemplo para adicionar rápido.</div>";
    renderGrupos(); return;
  }
  state.colaboradores.forEach(c => {
    const d = document.createElement("div");
    d.className = "col-item";
    d.innerHTML = `<strong>${c.nome}</strong> <span style="opacity:0.9">— ${c.telefone || ''}</span>
      <div style="float:right">
        <button class="ghost" onclick='editColaborador("${c.id}")'>Editar</button>
        <button style="background:#ff6161;color:#fff;border:none;padding:6px 8px;border-radius:6px;margin-left:8px;" onclick='removeColaborador("${c.id}")'>Excluir</button>
      </div>
    `;
    box.appendChild(d);
  });
}

// ---------- INIT ----------
renderColaboradores();
renderGrupos();
