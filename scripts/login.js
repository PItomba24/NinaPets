const loginForm = document.getElementById("loginForm");
const btnCadastro = document.getElementById("btnCadastro");
const btnRecuperar = document.getElementById("btnRecuperar");


/* =========================
   LOGIN
========================= */

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (email === "" || senha === "") {
        alert("Preencha todos os campos.");
        return;
    }

    /*
        Por enquanto estamos apenas simulando o login.

        Futuramente essa parte poderá
        verificar os dados no banco de dados.
    */

    alert("Login realizado com sucesso!");

});


/* =========================
   CADASTRO
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