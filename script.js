document.getElementById("signupForm").addEventListener("submit", function(e) {
    e.preventDefault();
    var name = document.getElementById("name").value;

    fetch("DIN_WEB_APP_URL", {
        method: "POST",
        body: new URLSearchParams({ "name": name })
    }).then(response => response.text())
      .then(data => {
          document.getElementById("status").innerText = "Tilmelding gemt!";
          document.getElementById("signupForm").reset();
      }).catch(error => {
          document.getElementById("status").innerText = "Fejl: " + error;
      });
});
