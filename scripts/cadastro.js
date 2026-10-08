import { auth, database } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const formulario = document.getElementById("cadastroForm");
const mensagem = document.getElementById("mensagemCadastro");
const botao = document.getElementById("btnCadastrar");
const voltar = document.getElementById("btnVoltarLogin");

const popupSucesso = document.getElementById("popupSucesso");
const popupTitulo = document.getElementById("popupTitulo");
const popupTexto = document.getElementById("popupTexto");
const popupBotao = document.getElementById("popupBotao");

function exibirMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem-sistema " + tipo;
}

function abrirPopup(titulo, texto) {
    popupTitulo.textContent = titulo;
    popupTexto.textContent = texto;
    popupSucesso.classList.add("ativo");
}

function fecharPopup() {
    popupSucesso.classList.remove("ativo");
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmarSenha").value;

    exibirMensagem("", "");

    if (senha !== confirmar) {
        exibirMensagem("As senhas não são iguais.", "erro");
        return;
    }

    if (senha.length < 6) {
        exibirMensagem(
            "A senha precisa ter pelo menos 6 caracteres.",
            "erro"
        );
        return;
    }

    botao.disabled = true;
    botao.textContent = "Criando sua conta...";

    let usuarioCriado = null;
    let perfilSalvo = false;

    try {
        const resultado = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        usuarioCriado = resultado.user;

        await set(ref(database, "usuarios/" + usuarioCriado.uid), {
            email: usuarioCriado.email,
            dataCadastro: new Date().toISOString()
        });

        perfilSalvo = true;

        await signOut(auth);

        formulario.reset();
        exibirMensagem("", "");

        abrirPopup(
            "Conta criada com sucesso!",
            "Agora você já pode entrar no NinaPets com seu e-mail e sua senha."
        );

    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        if (usuarioCriado && !perfilSalvo) {
            exibirMensagem(
                "Sua conta foi criada, mas não foi possível salvar o perfil.",
                "erro"
            );
        } else if (usuarioCriado) {
            exibirMensagem(
                "Sua conta foi criada, mas houve um problema ao finalizar a sessão.",
                "erro"
            );
        } else {
            const mensagens = {
                "auth/email-already-in-use":
                    "Este e-mail já possui uma conta.",
                "auth/invalid-email":
                    "Digite um e-mail válido.",
                "auth/weak-password":
                    "Escolha uma senha mais forte.",
                "auth/operation-not-allowed":
                    "O cadastro por e-mail ainda não está habilitado.",
                "auth/network-request-failed":
                    "Falha de conexão. Verifique sua internet."
            };

            exibirMensagem(
                mensagens[erro.code] ||
                "Não foi possível criar a conta. Tente novamente.",
                "erro"
            );
        }
    } finally {
        botao.disabled = false;
        botao.innerHTML = 'Criar conta <span>→</span>';
    }
});

popupBotao.addEventListener("click", () => {
    fecharPopup();
    window.location.href = "login.html";
});

voltar.addEventListener("click", () => {
    window.location.href = "login.html";
});