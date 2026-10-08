
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const btnCadastro = document.getElementById("btnCadastro");
const btnRecuperar = document.getElementById("btnRecuperar");
const btnEntrar = document.getElementById("btnEntrar");
const mensagemLogin = document.getElementById("mensagemLogin");


/* =========================
   EXIBIR MENSAGENS
========================= */

function mostrarMensagem(texto, cor = "red") {
    mensagemLogin.textContent = texto;
    mensagemLogin.style.color = cor;
}


/* =========================
   LOGIN COM FIREBASE
========================= */

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mostrarMensagem("");

    if (!email || !senha) {
        mostrarMensagem("Preencha todos os campos.");
        return;
    }

    // Desativar o botão durante a autenticação
    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando...";

    try {

        // Autenticar usuário no Firebase
        const credenciais = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        const usuario = credenciais.user;

        console.log("Usuário autenticado:", usuario.uid);

        mostrarMensagem(
            "Login realizado com sucesso!",
            "green"
        );

        // Redirecionamento provisório.
        // Substituir pela página principal quando ela for criada.
        setTimeout(() => {
            window.location.href = "inicio.html";
        }, 1000);

    } catch (error) {

        console.error("Erro ao realizar login:", error);

        switch (error.code) {

            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                mostrarMensagem(
                    "E-mail ou senha incorretos."
                );
                break;

            case "auth/invalid-email":
                mostrarMensagem(
                    "Digite um e-mail válido."
                );
                break;

            case "auth/user-disabled":
                mostrarMensagem(
                    "Esta conta foi desativada."
                );
                break;

            case "auth/too-many-requests":
                mostrarMensagem(
                    "Muitas tentativas. Aguarde um pouco."
                );
                break;

            case "auth/network-request-failed":
                mostrarMensagem(
                    "Erro de conexão. Verifique sua internet."
                );
                break;

            default:
                mostrarMensagem(
                    "Não foi possível entrar. Tente novamente."
                );
        }

    } finally {

        btnEntrar.disabled = false;
        btnEntrar.innerHTML = 'Entrar <span aria-hidden="true">→</span>';

    }

});


/* =========================
   IR PARA CADASTRO
========================= */

btnCadastro.addEventListener("click", function () {
    window.location.href = "cadastro.html";
});


/* =========================
   RECUPERAR SENHA
========================= */

btnRecuperar.addEventListener("click", function () {
    window.location.href = "recuperar-senha.html";
});
