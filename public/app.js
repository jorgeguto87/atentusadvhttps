let usuarioLogado = false;
let sessionToken = null;

// Páginas que não requerem login
const paginasPublicas = ['login', 'cadastro'];



// Função para verificar se o usuário está logado
function verificarAutenticacao() {
  // Verifica se existe um token de sessão válido
  const token = sessionStorage.getItem('sessionToken');
  const loginStatus = sessionStorage.getItem('usuarioLogado');
  
  if (token && loginStatus === 'true') {
    usuarioLogado = true;
    sessionToken = token;
    return true;
  }
  return false;
}

// Função para fazer login (agora usando API)
async function realizarLogin(username, password) {
  try {
    const response = await fetch('https://atentus.com.br:3040/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: username,
        senha: password
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.sucesso) {
      usuarioLogado = true;
      sessionToken = resultado.token;
      
      // Salvar estado de login na sessão
      sessionStorage.setItem('usuarioLogado', 'true');
      sessionStorage.setItem('sessionToken', sessionToken);
      sessionStorage.setItem('loginUsuario', username);
      
      // Mostrar/esconder elementos baseado no login
      atualizarInterfaceLogin();
      
      return { sucesso: true, mensagem: resultado.mensagem };
    } else {
      return { sucesso: false, mensagem: resultado.mensagem };
    }
    
  } catch (error) {
    console.error('Erro no login:', error);
    return { sucesso: false, mensagem: 'Erro de conexão com o servidor' };
  }
}

// Função para cadastrar usuário (agora usando API)
async function realizarCadastroUsuario(login, senha) {
  try {
    const response = await fetch('https://atentus.com.br:3040/cadastrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: login,
        senha: senha
      })
    });
    
    const resultado = await response.json();
    
    console.log('Resposta do servidor:', resultado);
    
    return {
      sucesso: resultado.sucesso,
      mensagem: resultado.mensagem
    };
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor'
    };
  }
}

// Função para fazer logout
function realizarLogout() {
  usuarioLogado = false;
  sessionToken = null;
  
  // Limpar dados da sessão
  sessionStorage.removeItem('usuarioLogado');
  sessionStorage.removeItem('sessionToken');
  sessionStorage.removeItem('loginUsuario');
  
  // Atualizar interface
  atualizarInterfaceLogin();
  
  // Redirecionar para login
  carregarPagina('login');
}

// Função para atualizar a interface baseada no status de login
function atualizarInterfaceLogin() {
  const navLinks = document.querySelectorAll('[data-page]');
  
  navLinks.forEach(link => {
    const pagina = link.getAttribute('data-page');
    
    if (!paginasPublicas.includes(pagina)) {
      if (usuarioLogado) {
        link.style.display = 'block';
        link.style.pointerEvents = 'auto';
        link.style.opacity = '1';
      } else {
        link.style.display = 'none';
      }
    }
  });
  
  // Mostrar nome do usuário logado se houver elemento para isso
  const userDisplay = document.getElementById('usuarioLogado');
  if (userDisplay) {
    const nomeUsuario = sessionStorage.getItem('loginUsuario');
    if (usuarioLogado && nomeUsuario) {
      userDisplay.textContent = `Bem-vindo, ${nomeUsuario}!`;
      userDisplay.style.display = 'block';
    } else {
      userDisplay.style.display = 'none';
    }
  }
}

function carregarPagina(pagina) {
  // Verificar se a página requer autenticação
  if (!paginasPublicas.includes(pagina) && !verificarAutenticacao()) {
    alert('Você precisa fazer login para acessar esta página!');
    carregarPagina('login');
    return;
  }
  
  // Debug: verificar se o arquivo existe
  console.log(`Tentando carregar: pages/${pagina}.html`);
  
  fetch(`https://atentus.com.br:3040/pages/${pagina}.html`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado: pages/${pagina}.html (${response.status})`);
      }
      return response.text();
    })
    .then(html => {
      const main = document.querySelector('main') || document.getElementById('main');
      if (main) {
        main.innerHTML = html;
      }
      
      // Atualizar navegação ativa
      const activeLinks = document.querySelectorAll('.nav-link.active');
      activeLinks.forEach(link => link.classList.remove('active'));
      
      const currentLink = document.querySelector(`[data-page="${pagina}"]`);
      if (currentLink) {
        currentLink.classList.add('active');
      }
      
      // Inicializar funcionalidades específicas da página
      if (pagina === 'login') {
        inicializarLogin();
      } else if (pagina === 'cadastro') {
        botaoLogin();
        inicializarElementosPagina();
        inicializarCadastro();
      } else {
        inicializarElementosPagina();
      }
      
      // Atualizar interface baseada no login
      atualizarInterfaceLogin();
      
      console.log(`Página ${pagina} carregada com sucesso`);
    })
    .catch((error) => {
      console.error('Erro detalhado:', error);
      const main = document.querySelector('main') || document.getElementById('main');
      if (main) {
        if (pagina === 'anuncios') {
          const nomeUsuario = sessionStorage.getItem('loginUsuario') || 'Usuário';
          main.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <h2>Bem-vindo, ${nomeUsuario}!</h2>
              <p>Login realizado com sucesso.</p>
              <p><small>Arquivo pages/anuncios.html não encontrado.</small></p>
              <button onclick="realizarLogout()" style="background: #dc3545; color: white; border: none; border-radius: 4px;">
                Fazer Logout
              </button>
            </div>
          `;
        } else {
          main.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <h2>Erro ao carregar página</h2>
              <p>Não foi possível carregar: <strong>${pagina}.html</strong></p>
              <p><small>${error.message}</small></p>
              <button onclick="carregarPagina('login')">
                Voltar ao Login
              </button>
            </div>
          `;
        }
      }
    });
}

// Função para inicializar o cadastro
function inicializarCadastro() {
  const btncadastrarUser = document.getElementById('btnCadastrar');
  const loginCadastro = document.getElementById('loginCadastro');
  const senhaCadastro = document.getElementById('senhaCadastro');
  const statusCadastro = document.getElementById('statusCadastro');

  if (btncadastrarUser) {
    btncadastrarUser.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!loginCadastro || !senhaCadastro) {
        console.error('Elementos de cadastro não encontrados');
        return;
      }
      
      // Mostrar loading
      btncadastrarUser.disabled = true;
      btncadastrarUser.textContent = 'Cadastrando...';
      
      if (statusCadastro) {
        statusCadastro.textContent = 'Processando...';
        statusCadastro.style.color = 'blue';
      }
      
      const resultado = await realizarCadastroUsuario(
        loginCadastro.value.trim(), 
        senhaCadastro.value
      );
      
      // Restaurar botão
      btncadastrarUser.disabled = false;
      btncadastrarUser.textContent = 'Cadastrar';
      
      if (statusCadastro) {
        statusCadastro.textContent = resultado.mensagem;
        statusCadastro.style.color = resultado.sucesso ? 'green' : 'red';
      }
      
      if (resultado.sucesso) {
        loginCadastro.value = '';
        senhaCadastro.value = '';
        
        // Redirecionar para login após cadastro bem-sucedido
        setTimeout(() => {
          carregarPagina('login');
        }, 1500);
      }
    });
  } else {
    console.error('Botão de cadastro não encontrado');
  }
}

function botaoLogin(){
  const btnLogin = document.getElementById('linkLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      carregarPagina('login');
    });
  }
}

function botaoCadastrar(){
  const btnCadastro = document.getElementById('linkCadastro');
  if (btnCadastro) {
    btnCadastro.addEventListener('click', (e) => {
      e.preventDefault();
      carregarPagina('cadastro');
    });
  }
}

function inicializarLogin() {
  const btnEntrar = document.getElementById('btnEntrar');
  
  if (btnEntrar) {
    btnEntrar.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const login = document.getElementById('login');
      const senha = document.getElementById('senha');
      const statusLogin = document.getElementById('statusLogin');
      
      // Limpar status anterior
      if (statusLogin) {
        statusLogin.textContent = '';
        statusLogin.style.color = '';
      }
      
      if (login && senha) {
        // Mostrar loading
        btnEntrar.disabled = true;
        btnEntrar.textContent = 'Entrando...';
        
        if (statusLogin) {
          statusLogin.textContent = 'Verificando credenciais...';
          statusLogin.style.color = 'blue';
        }
        
        const resultado = await realizarLogin(login.value.trim(), senha.value);
        
        // Restaurar botão
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
        
        if (resultado.sucesso) {
          // Login bem-sucedido
          if (statusLogin) {
            statusLogin.textContent = resultado.mensagem;
            statusLogin.style.color = 'green';
          }
          
          // Redirecionar para página principal após login
          setTimeout(() => {
            carregarPagina('anuncios');
          }, 500);
          
        } else {
          // Login falhou
          if (statusLogin) {
            statusLogin.textContent = resultado.mensagem;
            statusLogin.style.color = 'red';
          }
          login.value = '';
          senha.value = '';
        }
      }
    });
  }
  
  // Inicializar botão de cadastro se estiver na página de login
  botaoCadastrar();
}
function inicializarElementosPagina() {
  const button = document.getElementById('emoji-button');
  const picker = document.getElementById('emoji-picker');
  const textarea = document.getElementById('input_text');

  const emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
    '🙂','🙃','😉','😍','🥰','😘','😗','😙','😚','😎',
    '🤩','🥳','😏','😋','😜','🤪','😝','🤑','🤗','👍',
    '👎','👌','✌️','🤞','🤟','🤘','🤙','👋','👏','🙏','👇',
    '👆','👂','👃','👄','👶','👦','👧','👨','👩','👪',
    '👫','👬','👭','👮','👯','👰','👱','👲','👳','👴',
    '👵','👶','👷','👸','👹','👺','👻','👼','👽','👾',
    '👿','💀','💂','💃','💄','💅','💆','💇','💈','💉',
    '💊','💋','💌','💍','💎','💏','💐','💑','💒','💓',
    '💔','💕','💖','💗','💘','💙','💚','💛','💜','💝',
    '💞','💟','💠','💡','💢','💣','💤','💥','💦','💧',
    '💨','💩','💪','💫','💬','💭','💮','💯','💰','💱',
    '💲','💳','💴','💵','💶','💷','💸','💹','💺','💻',
    '💼','💽','💾','💿','📀','📁','📂','📃','📄','📅',
    '📆','📇','📈','📉','📊','📋','📌','📍','📎','📏',
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
    '🔥','✨','⚡','💥','⭐','🎉','🎊','🎈','🥳','🎂',
    '🍾','🥂','🍻','🍹','🍕','🍔','🍟','🌮','🍩','🍪',
    '💼','📈','📉','📊','💰','💵','💳','🧾','📜','📝',
    '📅','⏰','📢','📞','📱','✔️','❌','⚠️','🚫','✅',
    '❗','❓','💡','🔔','🎯','🚀'
  ];

  if (button && picker && textarea) {
    function criarPicker() {
      picker.innerHTML = '';
      emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.addEventListener('click', () => {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.slice(0, start) + emoji + text.slice(end);
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
          picker.style.display = 'none';
        });
        picker.appendChild(span);
      });
    }

    button.addEventListener('click', () => {
      if (picker.style.display === 'none') {
        criarPicker();
        const rect = button.getBoundingClientRect();
        picker.style.position = 'absolute';
        picker.style.top = (rect.bottom + window.scrollY) + 'px';
        picker.style.left = (rect.left + window.scrollX) + 'px';
        picker.style.display = 'flex';
      } else {
        picker.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!picker.contains(e.target) && e.target !== button) {
        picker.style.display = 'none';
      }
    });
  }

  const uploadButton = document.getElementById('upload-button');
  if (uploadButton) {
    uploadButton.addEventListener('click', async () => {
      const fileInput = document.getElementById('file-input');
      const file = fileInput?.files[0];
      const diaSemana = document.getElementById('diaSemana')?.value;

      function exibirStatus(id, texto) {
        const campo = document.getElementById(id);
        if (campo) campo.innerHTML = texto;
      }

      if (!file) {
        exibirStatus('status_documents', 'Nenhum arquivo selecionado');
        return;
      }

      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('diaSemana', diaSemana);

      const response = await fetch('https://atentus.com.br:3040/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      exibirStatus('status_documents', data.message);
    });
  }

  const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('previewContainer');
if (fileInput && previewContainer) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      // Limpa preview anterior
      previewContainer.innerHTML = '';
      
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'main__preview__imagem';
        const reader = new FileReader();
        reader.onload = () => img.src = reader.result;
        reader.readAsDataURL(file);
        previewContainer.appendChild(img);
      } 
      else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.className = 'main__preview__imagem';
        video.controls = true;
        const reader = new FileReader();
        reader.onload = () => video.src = reader.result;
        reader.readAsDataURL(file);
        previewContainer.appendChild(video);
      }
    }
  });
}

  const campoMensagem = document.getElementById('input_text');
  const uploadText = document.getElementById('upload_text');
  const previewText = document.getElementById('previewText');

  if (campoMensagem && uploadText && previewText) {
    uploadText.addEventListener('click', () => {
      const semanaMensagem = document.getElementById('diaSemana');
      let mensagem;
      if (semanaMensagem) {
        const valor = semanaMensagem.value;
        mensagem = valor;
      }
      const dados = { mensagemSemana: mensagem, mensagem: campoMensagem.value };

      function exibirStatus(id, texto) {
        const campo = document.getElementById(id);
        if (campo) campo.textContent = texto;
      }

      fetch('https://atentus.com.br:3040/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
        .then(res => res.text())
        .then(() => exibirStatus('status_text', 'Dados salvos com sucesso'))
        .catch(err => console.error('Erro:', err));
    });

    campoMensagem.addEventListener('input', () => {
      const textoComQuebras = campoMensagem.value.replace(/\n/g, '<br>');
      previewText.innerHTML = textoComQuebras;
    });
    
  }

  const diaSemanaSelect = document.getElementById('diaSemana');
  if (diaSemanaSelect) {
    diaSemanaSelect.addEventListener('change', () => {
      const statusDocs = document.getElementById('status_documents');
      const statusText = document.getElementById('status_text');
      const previewImagem = document.getElementById('previewContainer');
      const inputText = document.getElementById('input_text');
      const previewText = document.getElementById('previewText');

      if (statusDocs) statusDocs.innerHTML = '';
      if (statusText) statusText.innerHTML = '';
      if (fileInput) fileInput.value = '';
      if (previewImagem) previewImagem.src = 'default_preview.jpg';
      if (inputText) inputText.value = '';
      if (previewText) previewText.innerHTML = '';
    });
  }
  // Gerador de Links do WhatsApp
  const inputNumero = document.getElementById('input_gen_number');
  const inputTexto = document.getElementById('input_gen_text');
  const botaoGerar = document.getElementById('gerar_link');
  const statusLink = document.getElementById('status_link');

  if (inputNumero && inputTexto && botaoGerar && statusLink) {
    botaoGerar.addEventListener('click', () => {
      const numero = inputNumero.value.trim();
      const texto = inputTexto.value.trim();

      if (!numero || !/^55\d{11}$/.test(numero)) {
        statusLink.innerText = '❌ Número inválido. Use o formato 55DD9XXXXXXXX.';
        return;
      }

      const textoCodificado = encodeURIComponent(texto);
      const link = `https://wa.me/${numero}?text=${textoCodificado}`;
      statusLink.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
    });
  }

  // Scripts específicos de páginas futuras podem ir aqui:
    // Scripts específicos de páginas futuras podem ir aqui:
    let isRestarting = false;
let isLoggingOut = false;
let intervalId = null;

if (document.getElementById('qrcode')) {
  const qrcodeImg = document.getElementById('qrcode');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const loading = document.getElementById('loading');
  const statusText = document.getElementById('status');

  async function checkStatus() {
    try {
      const res = await fetch('https://atentus.com.br:3040/status');
      const data = await res.json();

      if (data.connected) {
        qrcodeImg.style.display = 'none';
        loading.style.display = 'none';
        title.textContent = '✅ Conectado com Sucesso!';
        subtitle.textContent = 'Você já pode fechar esta página.';

        // Libera exibição normal novamente
        if (isRestarting || isLoggingOut) {
          statusText.textContent = '✅ Conectado com sucesso!';
        } else {
          statusText.textContent = '';
        }

        // Reset flags e reativa o checkStatus se estiver pausado
        isRestarting = false;
        isLoggingOut = false;
        restartCheckStatusInterval();

      } else {
        if (data.qr) {
          qrcodeImg.src = data.qr;
          qrcodeImg.style.display = 'block';
        }
        loading.style.display = 'block';

        if (!isRestarting && !isLoggingOut) {
          statusText.textContent = 'Aguardando conexão com o WhatsApp...';
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  }

  function startCheckStatusInterval() {
    if (!intervalId) {
      intervalId = setInterval(checkStatus, 3000);
    }
  }

  function stopCheckStatusInterval() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function restartCheckStatusInterval() {
    stopCheckStatusInterval();
    startCheckStatusInterval();
  }

  async function restartBot() {
    stopCheckStatusInterval();
    isRestarting = true;
    statusText.textContent = "♻️ Reiniciando, aguarde por favor...";
    loading.style.display = 'block';

    try {
      const res = await fetch('https://atentus.com.br:3040/restart', { method: 'POST' });
      const data = await res.json();

      if (data.message) {
        statusText.textContent = data.message;
        title.textContent = '✅ Reiniciado com sucesso!';
        
      } else {
        statusText.textContent = "Reiniciando, aguarde até a confirmação...";
      }

      // Reativa monitoramento após delay pequeno
      setTimeout(() => startCheckStatusInterval(), 3000);

    } catch (error) {
      statusText.textContent = "Erro ao reiniciar...";
      loading.style.display = 'none';
      console.error(error);
      isRestarting = false;
      startCheckStatusInterval();
    }
  }

  async function logoutBot() {
    stopCheckStatusInterval();
    isLoggingOut = true;
    statusText.textContent = "🚪 Desconectando, aguarde...";
    loading.style.display = 'block';

    try {
      const res = await fetch('https://atentus.com.br:3040/logout', { method: 'POST' });
      const data = await res.json();
      statusText.textContent = data.message;
      title.textContent = '❎ Desconectado!';

      // Reativa verificação depois de um tempo
      setTimeout(() => startCheckStatusInterval(), 3000);

    } catch (error) {
      statusText.textContent = "Erro ao desconectar...";
      loading.style.display = 'none';
      console.error(error);
      isLoggingOut = false;
      startCheckStatusInterval();
    }
  }

  // Botões
  const btnReconnect = document.getElementById('reconnect');
  const btnLogout = document.getElementById('logout');

  if (btnReconnect) btnReconnect.addEventListener('click', restartBot);
  if (btnLogout) btnLogout.addEventListener('click', logoutBot);

  // Inicialização
  checkStatus();
  startCheckStatusInterval();
}

// ⏰ Horários (incluir dentro da função inicializarElementosPagina)
const selects = [
  'chooseHours1', 'chooseHours2', 'chooseHours3',
  'chooseHours4', 'chooseHours5', 'chooseHours6'
];

const statusEl = document.getElementById('statushorarios');
const listaEl = document.getElementById('horarios_escolhidos');
const btnConfirmar = document.getElementById('confirmar_horas');

if (btnConfirmar && listaEl && statusEl) {
  const textoOriginalBotao = btnConfirmar.innerText;

  function carregarHorarios() {
    fetch('https://atentus.com.br:3040/horarios')
      .then(res => res.json())
      .then(data => {
        const lista = data.horarios || [];
        const horariosOriginais = lista.map(h => (h - 3 + 24) % 24);
        listaEl.innerText = horariosOriginais.map(h => `${h}:00`).join(' | ');
      })
      .catch(() => {
        listaEl.innerText = 'Erro ao carregar horários';
      });
  }

  btnConfirmar.addEventListener('click', () => {
    const valores = selects.map(id => {
      const el = document.getElementById(id);
      return el ? el.value : null;
    }).filter(v => v !== 'null' && v !== null);

    const unicos = [...new Set(valores.map(Number))].sort((a, b) => a - b);

    if (unicos.length === 0) {
      statusEl.innerText = '⚠️ Selecione pelo menos um horário';
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.innerText = 'Salvando...';

    fetch('https://atentus.com.br:3040/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horarios: unicos })
    })
      .then(res => res.json())
      .then(data => {
        statusEl.innerText = '✅ Horários salvos com sucesso!';
        listaEl.innerText = data.horarios.map(h => `${h}:00`).join(' | ');
      })
      .catch(() => {
        statusEl.innerText = '❌ Erro ao salvar os horários';
      })
      .finally(() => {
        btnConfirmar.disabled = false;
        btnConfirmar.innerText = textoOriginalBotao;
      });
  });

  carregarHorarios();
}

if (document.getElementById('confirmar_grupos')) {
  const tabelaEsquerda = document.getElementById('tabela_grupos_esquerda');
  const tabelaDireita = document.getElementById('tabela_grupos_direita');
  const btnConfirmarGrupos = document.getElementById('confirmar_grupos');

  // Limpa quaisquer linhas existentes
  tabelaEsquerda.innerHTML = '';
  tabelaDireita.innerHTML = '';

  // Busca os grupos do backend
  fetch('https://atentus.com.br:3040/grupos')
    .then(res => res.json())
    .then(grupos => {
      grupos.forEach(grupo => {
        const tr = document.createElement('tr');

        let idParte = grupo.id;
        let nomeParte = '';

        if (grupo.id.includes(' - ')) {
        [idParte, nomeParte] = grupo.id.split(' - ');
        }

        const tdId = document.createElement('td');
        tdId.textContent = idParte;

        const tdNome = document.createElement('td');
        tdNome.textContent = nomeParte;

        const tdCheck = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', atualizarGruposSelecionados);

        tdCheck.appendChild(checkbox);

        tr.appendChild(tdId);
        tr.appendChild(tdNome);
        tr.appendChild(tdCheck);

        tabelaEsquerda.appendChild(tr);
        
        //setInterval(tr, 3000);
      });
    });

  function atualizarGruposSelecionados() {
    tabelaDireita.innerHTML = '';

    const linhas = tabelaEsquerda.querySelectorAll('tr');
    linhas.forEach(tr => {
      const checkbox = tr.querySelector('input[type="checkbox"]');
      if (checkbox && checkbox.checked) {
        const trNovo = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = tr.children[0].textContent;

        const tdNome = document.createElement('td');
        tdNome.textContent = tr.children[1].textContent;

        trNovo.appendChild(tdId);
        trNovo.appendChild(tdNome);

        tabelaDireita.appendChild(trNovo);
      }
    });
  }

  btnConfirmarGrupos.addEventListener('click', () => {
    const linhasSelecionadas = tabelaDireita.querySelectorAll('tr');
    const status = document.getElementById('status_grupos');
    const gruposSelecionados = Array.from(linhasSelecionadas).map(tr => ({
      id: tr.children[0].textContent,
      nome: tr.children[1].textContent
    }));

    fetch('https://atentus.com.br:3040/grupos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gruposSelecionados)
    })
      .then(res => res.json())
      .then(data => {
        //alert(data.message);
        status.textContent = data.message;
      })
      .catch(err => {
        //alert('Erro ao salvar os grupos');
        status.textContent = 'Erro ao salvar os grupos';
        console.error(err);
      });
  });
}

//meusanuncios
if (document.getElementById('tabela_grupos_check')) {
  fetch('https://atentus.com.br:3040/gruposcheck')
    .then(res => res.json())
    .then(grupos => {
      const tbody = document.getElementById('tabela_grupos_check');
      tbody.innerHTML = ''; // limpa antes de preencher (opcional)

      grupos.forEach(grupo => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = grupo.id;

        const tdNome = document.createElement('td');
        tdNome.textContent = grupo.nome;

        tr.appendChild(tdId);
        tr.appendChild(tdNome);

        tbody.appendChild(tr);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar os grupos:', error);
    });
}
if (document.getElementById('previewContainer_chk')) {
  const selectDia = document.getElementById('diaSemana_chk');
  const previewContainer = document.getElementById('previewContainer_chk');
  const texto = document.getElementById('previewText_chk');

  if (selectDia && previewContainer && texto) {
    // Função para carregar prévia
    const carregarPreview = (dia) => {
      fetch(`https://atentus.com.br:3040/anuncio/${dia}`)
        .then(res => res.json())
        .then(data => {
          // Limpa preview anterior
          previewContainer.innerHTML = '';
          
          if (data.imagemBase64) {
            // Detecta se é imagem ou vídeo pelo início do base64
            if (data.imagemBase64.startsWith('data:image/')) {
              const img = document.createElement('img');
              img.className = 'main__preview__imagem';
              img.src = data.imagemBase64;
              previewContainer.appendChild(img);
            } 
            else if (data.imagemBase64.startsWith('data:video/')) {
              const video = document.createElement('video');
              video.className = 'main__preview__imagem';
              video.controls = true;
              video.src = data.imagemBase64;
              previewContainer.appendChild(video);
            }
            else {
              // Fallback para imagem se não conseguir detectar
              const img = document.createElement('img');
              img.className = 'main__preview__imagem';
              img.src = data.imagemBase64 || 'default_preview.jpg';
              previewContainer.appendChild(img);
            }
          } else {
            // Se não há arquivo, usa imagem default
            const img = document.createElement('img');
            img.className = 'main__preview__imagem';
            img.src = 'default_preview.jpg';
            previewContainer.appendChild(img);
          }
          
          texto.innerHTML = (data.texto || '').replace(/\n/g,'<br>');
        })
        .catch(err => {
          console.error('Erro ao carregar anúncio:', err);
          // Em caso de erro, usa imagem default
          previewContainer.innerHTML = '';
          const img = document.createElement('img');
          img.className = 'main__preview__imagem';
          img.src = 'default_preview.jpg';
          previewContainer.appendChild(img);
          texto.textContent = '';
        });
    };

    // Carrega a primeira vez
    carregarPreview(selectDia.value);

    // Atualiza ao mudar
    selectDia.addEventListener('change', () => {
      carregarPreview(selectDia.value);
    });
  }
}
//duplicar anuncios meusanuncios

//document.addEventListener('DOMContentLoaded', () => {
  
  if (document.getElementById('confirmar_checkbox')) {
    const btnConfirmar = document.getElementById('confirmar_checkbox');
    btnConfirmar.addEventListener('click', () => {
      const selectDia = document.getElementById('diaSemana_chk');
      const diaOrigem = selectDia.value;
      const statuschk = document.getElementById('status_checkbox');

      // Pegar todos os checkboxes marcados
      const checkboxes = document.querySelectorAll('.main__checkbox');
      const diasDestino = [];

      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          // Extrair o dia do id, que está no formato checkbox_segunda, checkbox_terca, etc
          const dia = checkbox.id.replace('checkbox_', '');
          // Evita copiar para o mesmo dia origem
          if (dia !== diaOrigem) diasDestino.push(dia);
        }
      });

      if (diasDestino.length === 0) {
        //alert('Selecione pelo menos um dia diferente para copiar o anúncio.');
        statuschk.textContent = 'Selecione pelo menos um dia diferente para copiar o anúncio.';
        return;
      }

      fetch('https://atentus.com.br:3040/copiar-anuncio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diaOrigem, diasDestino })
      })
      
      .then(res => {
        if (!res.ok) throw new Error('Erro ao copiar anúncio');
        return res.text();
      })
      .then(msg => {
        //alert(msg);
        statuschk.textContent = msg;
        // Opcional: desmarcar checkboxes após confirmação
        checkboxes.forEach(c => c.checked = false);
      })
      .catch(err => {
        console.error(err);
        //alert('Erro ao copiar anúncio. Veja o console.');
        statuschk.textContent = 'Erro ao copiar anúncio. Veja o console.';
      });
    });
  //}
};
//Apagar anuncio
if (document.getElementById('btn-apagar-anuncio')){
  const btnApagarAnuncio = document.getElementById('btn-apagar-anuncio');
  btnApagarAnuncio.addEventListener('click', async () => {
  const diaSelecionado = document.getElementById('diaSemana_chk').value;
  const statuschk = document.getElementById('status_checkbox');


  if (!diaSelecionado) {
    //alert('Por favor, selecione um dia.');
    statuschk.textContent = 'Por favor, selecione um dia.';
    return;
  }

  try {
    const resposta = await fetch('https://atentus.com.br:3040/apagar-anuncio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dia: diaSelecionado })
    });

    const textoResposta = await resposta.text();
    //alert(textoResposta);
    statuschk.textContent = textoResposta;
  } catch (error) {
    console.error('Erro ao apagar anúncio:', error);
    //alert('Erro ao tentar apagar o anúncio.');
    statuschk.textContent = 'Erro ao tentar apagar o anúncio.';
  }

});
};
//Apagar todos
if (document.getElementById('btn-apagar-todos')){
  const btnApagarTodos = document.getElementById('btn-apagar-todos');
  btnApagarTodos.addEventListener('click', async () => {
    const statuschk = document.getElementById('status_checkbox');
  if (!confirm('Tem certeza que deseja apagar todos os anúncios? Esta ação não pode ser desfeita!')) {
    return;
  }

  try {
    const resposta = await fetch('https://atentus.com.br:3040/apagar-todos-anuncios', {
      method: 'POST'
    });

    const textoResposta = await resposta.text();
    //alert(textoResposta);
    statuschk.textContent = textoResposta;
  } catch (error) {
    console.error('Erro ao apagar todos os anúncios:', error);
    //alert('Erro ao tentar apagar todos os anúncios.');
    statuschk.textContent = 'Erro ao tentar apagar todos os anúncios.';
  }
});
};


  // if (main.innerHTML.includes("id_exclusivo_da_nova_pagina")) { ... }
}

// Configura os links do menu
function getCurrentPage() {
  const activeLink = document.querySelector('.nav-link.active');
  return activeLink ? activeLink.getAttribute('data-page') : 'login';
}

// Função para inicializar a aplicação
function inicializarApp() {
  // Verificar se já está logado
  if (verificarAutenticacao()) {
    carregarPagina('anuncios');
  } else {
    carregarPagina('login');
  }
  
  // Configurar event listeners para navegação
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (link) {
      e.preventDefault();
      const pagina = link.getAttribute('data-page');
      carregarPagina(pagina);
    }
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();
});
