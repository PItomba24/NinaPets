import { auth } from "./firebase.js";

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const formulario = document.getElementById("recuperarForm");
const mensagem = document.getElementById("mensagemRecuperacao");
const botao = document.getElementById("btnRecuperarSenha");
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

    exibirMensagem("", "");

    if (!email) {
        exibirMensagem("Digite seu e-mail.", "erro");
        return;
    }

    botao.disabled = true;
    botao.textContent = "Enviando solicitação...";

    try {
        await sendPasswordResetEmail(auth, email);

        formulario.reset();
        exibirMensagem("", "");

        abrirPopup(
            "Solicitação enviada com sucesso!",
            "Se existir uma conta vinculada a esse e-mail, você receberá um link para redefinir sua senha. Verifique também a pasta de spam."
        );

    } catch (erro) {
        console.error("Erro na recuperação de senha:", erro);

        if (erro.code === "auth/invalid-email") {
            exibirMensagem(
                "Digite um endereço de e-mail válido.",
                "erro"
            );
        } else if (erro.code === "auth/too-many-requests") {
            exibirMensagem(
                "Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.",
                "erro"
            );
        } else if (erro.code === "auth/network-request-failed") {
            exibirMensagem(
                "Não foi possível conectar. Verifique sua internet.",
                "erro"
            );
        } else {
            exibirMensagem(
                "Não foi possível processar a solicitação. Tente novamente mais tarde.",
                "erro"
            );
        }
    } finally {
        botao.disabled = false;
        botao.innerHTML = 'Enviar link <span>→</span>';
    }
});

popupBotao.addEventListener("click", () => {
    fecharPopup();
    window.location.href = "login.html";
});

voltar.addEventListener("click", () => {
    window.location.href = "login.html";
});