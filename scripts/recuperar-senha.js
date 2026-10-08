const recuperarForm =
    document.getElementById("recuperarForm");

const btnVoltarLogin =
    document.getElementById("btnVoltarLogin");


/* =========================
   RECUPERAR SENHA
========================= */

recuperarForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value;


    if (email === "") {

        alert("Digite seu e-mail.");

        return;
    }


    /*
        Por enquanto estamos apenas simulando
        o envio da recuperação.

        No sistema real, aqui seria feita uma
        solicitação para o servidor.
    */

    alert(
        "Se este e-mail estiver cadastrado, " +
        "você receberá as instruções para " +
        "recuperar sua senha."
    );


    window.location.href = "login.html";

});


/* =========================
   VOLTAR
========================= */

btnVoltarLogin.addEventListener("click", function () {

    window.location.href = "login.html";

});