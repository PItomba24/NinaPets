const btnIniciar = document.getElementById("btnIniciar");

btnIniciar.addEventListener("click", function () {

    window.ninaNavigate ? window.ninaNavigate("login.html") : (window.location.href = "login.html");

});