$('#loginForm').on('submit', function (e) {
    e.preventDefault();

    $.ajax({
        type: 'post',
        url: '/auth/users/login',
        data: $('form').serialize(),
        success: function (response) {
            if (response.result == 'redirect') {
                window.location.replace(response.url);
            }},
        error: function (response) {
            var responseText = response.responseText;
            responseText = JSON.parse(responseText);
            console.log(responseText);

            if (responseText.result == 'err') {
                console.log('err');
                document.getElementById("usernameOrPasswordError").innerHTML = responseText.message;
                document.getElementById("errorAlert").removeAttribute("style");
            }

        }

    });
    
});

var assureEmail;

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateEmailInput() {
    var $result = $("#result");
    var email = $("#email").val();
    $result.text("");
    console.log(email);

    if (validateEmail(email)) {
        $.ajax({
                type: 'post',
                url: '/auth/users/checkemail',
                data: {
                    email: email
                },
                success: function (response) {
                    console.log(response);
                    if (response.result == 'success') {
                        document.getElementById("emailAlert").setAttribute("class", "alert alert-success");
                        document.getElementById("emailAlert").setAttribute("style", "");
                        document.getElementById("emailVerify").innerHTML = response.message;
                        assureEmail = true;
                        validateForm();
                    }
                },
                error: function (response) {
                    var responseText = response.responseText;
                    responseText = JSON.parse(responseText);
                    console.log(responseText.message);
                    if (responseText.result == 'err') {
                        console.log('err');
                        document.getElementById("emailVerify").innerHTML = responseText.message;
                        document.getElementById("emailAlert").setAttribute("class", "alert alert-danger");
                        document.getElementById("emailAlert").setAttribute("style", "");
                    }
                }
            }
        );

    } else {
        document.getElementById("emailAlert").setAttribute("style", "display: none;");
        assureEmail = false;
        validateForm();
    }

}

document.getElementsByName("email")[0].addEventListener('change', validateEmailInput);

function validateForm() {
    if(assureEmail){
        document.getElementById('signupBtn').removeAttribute('disabled');
    }else{
        document.getElementById('signupBtn').setAttribute('disabled', '');
    }
}