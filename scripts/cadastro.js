
import { auth, database } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const cadastroForm = document.getElementById("cadastroForm");
const btnVoltarLogin = document.getElementById("btnVoltarLogin");
const mensagemCadastro = document.getElementById("mensagemCadastro");
const btnCadastrar = document.getElementById("btnCadastrar");


/* =========================
   EXIBIR MENSAGENS
========================= */

function mostrarMensagem(texto, cor = "red") {
    mensagemCadastro.textContent = texto;
    mensagemCadastro.style.color = cor;
}


/* =========================
   CADASTRO DE USUÁRIO
========================= */

cadastroForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    mostrarMensagem("");

    if (senha !== confirmarSenha) {
        mostrarMensagem("As senhas não são iguais.");
        return;
    }

    if (senha.length < 6) {
        mostrarMensagem("A senha deve possuir pelo menos 6 caracteres.");
        return;
    }

    btnCadastrar.disabled = true;
    btnCadastrar.textContent = "Criando conta...";

    let usuarioCriado = null;
    let dadosSalvos = false;

    try {

        // Criar conta no Firebase Authentication
        const credenciais = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        usuarioCriado = credenciais.user;

        console.log("Usuário criado:", usuarioCriado.uid);

        // Salvar dados no Realtime Database
        await set(ref(database, "usuarios/" + usuarioCriado.uid), {
            email: usuarioCriado.email,
            dataCadastro: new Date().toISOString()
        });

        dadosSalvos = true;

        console.log("Dados salvos com sucesso!");

        mostrarMensagem("Conta criada com sucesso!", "green");

        // Encerrar a sessão para realizar login depois
        await signOut(auth);

        // Redirecionar para a tela de login
        window.location.href = "login.html";

    } catch (error) {

        console.error("Erro no cadastro:", error);

        if (usuarioCriado && !dadosSalvos) {
            mostrarMensagem(
                "Sua conta foi criada, mas não foi possível salvar os dados. Verifique as regras do banco."
            );
            return;
        }

        if (usuarioCriado && dadosSalvos) {
            mostrarMensagem(
                "Conta criada, mas não foi possível finalizar a sessão. Verifique o console."
            );
            return;
        }

        switch (error.code) {

            case "auth/email-already-in-use":
                mostrarMensagem("Este e-mail já está cadastrado.");
                break;

            case "auth/invalid-email":
                mostrarMensagem("Digite um e-mail válido.");
                break;

            case "auth/weak-password":
                mostrarMensagem("A senha é muito fraca.");
                break;

            case "auth/operation-not-allowed":
                mostrarMensagem("O cadastro por e-mail e senha não está ativado no Firebase.");
                break;

            case "auth/network-request-failed":
                mostrarMensagem("Erro de conexão. Verifique sua internet.");
                break;

            case "PERMISSION_DENIED":
            case "permission_denied":
                mostrarMensagem("Permissão negada pelo banco de dados.");
                break;

            default:
                mostrarMensagem(
                    "Erro ao cadastrar: " + (error.code || error.message)
                );
        }

    } finally {

        btnCadastrar.disabled = false;
        btnCadastrar.textContent = "Criar conta";

    }

});


/* =========================
   VOLTAR PARA LOGIN
========================= */

btnVoltarLogin.addEventListener("click", function () {
    window.location.href = "login.html";
});
