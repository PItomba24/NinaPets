
import { auth, authPersistenceReady } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
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

        // Mantém a sessão neste navegador e autentica o usuário.
        await authPersistenceReady;
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

        // Abrir o painel principal do alimentador.
        setTimeout(() => {
            window.ninaNavigate ? window.ninaNavigate("perfil-pet.html") : (window.location.href = "perfil-pet.html");
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
    window.ninaNavigate ? window.ninaNavigate("cadastro.html") : (window.location.href = "cadastro.html");
});


/* =========================
   RECUPERAR SENHA
========================= */

btnRecuperar.addEventListener("click", function () {
    window.ninaNavigate ? window.ninaNavigate("recuperar-senha.html") : (window.location.href = "recuperar-senha.html");
});

// Se a pessoa já estiver conectada, não exige novo login.
onAuthStateChanged(auth, usuario => {
    if (usuario) (window.ninaNavigate ? window.ninaNavigate("perfil-pet.html", { replace: true }) : window.location.replace("perfil-pet.html"));
});
