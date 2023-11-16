let error = document.getElementById('errorshow');
let otpButton = document.getElementById('OtpButton');
let secondInterval
// Add an event listener to the button instead of using the onclick attribute



async function OtpValidate(Resend) {
    let data = null;
    let fromPath = null;
    if (window.location.pathname === '/signup') {
        fromPath = "signup";
        data = signUpValidation();
    } else if (window.location.pathname === '/login') {
        fromPath = 'login';
        data = validate();
    }
    if (data !== false) {
        try {
            const response = await fetch('/otpsignup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (response.status === 200) {
                if (window.location.pathname === '/signup') {
                    $('#signupModal').modal('show');
                } else {
                    $('#exampleModal').modal('show');
                }
                if(Resend) { 
                    document.getElementById('resendotpSucces').style.display = ''
                    setTimeout(()=>{document.getElementById('resendotpSucces').style.display = 'none'},5000)
                }
                let count = 5000
                setTimeout(() => {
                    document.getElementById('buttonDivSignup').innerHTML = `<button type="button" class="btn btn-warning" 
                   onclick="OtpValidate(true)" style="margin-top: 16px;" >Resend OTP</button>`
                }, count)
                ResendstartCounter(count / 1000, window.location.pathname)
                MainCounter()
            } else {
                if (response.status === 401) {
                    error.innerHTML = "invalid password"
                } else if (response.status === 403) {
                    error.innerHTML = "user blocked"
                } else if (response.status === 404) {
                    error.innerHTML = "Email not registered"
                } else if (response.status === 400) {
                    error.innerHTML = "please fill the detials"
                } else if (response.status === 402) {
                    error.innerHTML = "Email already exist please signup"
                } 
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
}

function ResendstartCounter(count, path) {
    clearInterval(secondInterval)
    let interval = setInterval(() => {
        count -= 1
        document.getElementById('counterResend').innerHTML = count
        console.log(count);
        if (count === 0) {
            clearInterval(interval)
            if (path === '/signup') {
                document.getElementById('signupconterIdPtag').remove()
            } else {
                document.getElementById('conterIdPtag').remove()
            }
        }
    }, 1000)
}

function MainCounter() {
    let minute = document.getElementById('minute')
    let second = document.getElementById('second')
    let secondCount = 59
    let minuteCount = 2
    secondInterval = setInterval(() => {
        secondCount -= 1
        if (secondCount === 0) {
            minuteCount -= 1
            secondCount = 59
            minute.innerHTML = minuteCount
        }
        secondCount += ''
        second.innerHTML = (secondCount.length === 2) ? secondCount : '0' + secondCount
        if (minuteCount === -1) {
            clearInterval(secondInterval)
            document.getElementById('MainCounter').innerHTML = "Otp expired"
        }
    }, 1000)
}



function signUpValidation() {
    const FullName = document.getElementById('FullName').value
    const Name = document.getElementById('Name').value
    const Email = document.getElementById('Email').value
    const Password = document.getElementById('Password').value

    const ConfirmPassword = document.getElementById('ConfirmPassword').value
    const fullNamePattern = /^[A-Za-z]+ [A-Za-z]+$/
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (fullNamePattern.test(FullName)) {
        if (Name.length > 2 && isNaN(Name)) {
            if (emailPattern.test(Email)) {
                if (Password.length > 3) {
                    if (Password === ConfirmPassword) {
                        let Data = {
                            FullName: FullName,
                            Name: Name,
                            Email: Email,
                            Password: Password,
                            fromPath: "signup"
                        }
                        return Data
                    } else {
                        error.innerHTML = "Password do not match"
                        return false
                    }

                } else {
                    error.innerHTML = "Password must be greater than 3"
                    return false
                }
            } else {
                error.innerHTML = "Please enter a valid email"
                return false
            }
        } else {
            error.innerHTML = "Enter a valid username"
            return false
        }
    } else {
        error.innerHTML = "invalid full name"
        return false
    }
}


function Eyefunc() {
    let show = document.getElementById('Pass')
    let logo = document.getElementById('logo')
    if (show.type == "password") {
        show.type = "text"
        logo.className = "fa fa-eye icon"
    } else {
        logo.className = "fa fa-eye-slash icon"
        show.type = "password"
    }
}


function validate() {
    let email = document.getElementById('email').value
    let pass = document.getElementById('Pass').value
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    let Data = {
        Email: email,
        Password: pass,
        fromPath: "login"
    }
    const isValidEmail = emailRegex.test(email);
    if (isValidEmail && email !== "") {
        if (pass.length > 3) {
            return Data
        } else {
            error.innerHTML = "password must be more than 3"
            return false
        }

    } else {
        error.innerHTML = "Invalid email address"
        return false
    }
}

let EmailTag = null

function forgettSendOtp() {
    let Email = document.getElementById('forgetEmail').value;
    EmailTag = document.getElementById('forgetEmail');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(Email) && Email.length > 3) {
        let data = {
            Email: Email,
            From: true
        };
        fetch('/forgotPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then((response) => {
            if (response.status === 200) {
                document.getElementById('succesEmail').style.display = ''
                document.getElementById('sendOtpButton').style.display = 'none'
                EmailTag.readOnly = true
            } else if (response.status === 401) {

                document.getElementById('forgeterrorShow').innerHTML = "Email not found please signup"
            }
        })
            .catch(error => {
                console.error('Error:', error);
            });
    } else {
        document.getElementById('forgeterrorShow').innerHTML = "Enter a valid Email"
    }

}

function ValidateForgetPassword() {
    let forgeterrorShow = document.getElementById('forgeterrorShow')
    let forgettNewPassword = document.getElementById('forgettNewPassword').value
    let otpUserforgett = document.getElementById('otpUserforgett').value
    let Email = document.getElementById('forgetEmail').value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (EmailTag === Email) {
        if (emailRegex.test(Email)) {
            if (forgettNewPassword.length > 3) {
                if (otpUserforgett.length === 6) {

                } else {
                    forgeterrorShow.innerHTML = "Enter a valid otp"
                    return false
                }
            } else {
                forgeterrorShow.innerHTML = "Enter a password more than 3"
                return false
            }
        } else {
            forgeterrorShow.innerHTML = "Enter a valid Email"
            return false
        }
    } else {
        forgeterrorShow.innerHTML = "Enter correct Email"
        return false
    }

}
// document.getElementById('closeButtonOfmodal').addEventListener('click', () => window.location.reload())

