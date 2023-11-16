
let error = document.getElementById('errorshow')
let secondInterval


function validateAndOtp() {

  let status = validate();
  if (status) {
    fetch(`otpSend?Email=${status.Email}&Password=${status.Password}`)
      .then((response) => {
        if (response.status === 200) {
          let resendOtp = document.getElementById('buttonDivSignup').innerHTML;
          $('#adminLoginModal').modal('show');
          let count = 5000;
          function addResendOTPButton() {
            resendOtp = '<button type="button" class="btn btn-warning" onclick="validateAndOtp(clearInterval(secondInterval))" style="margin-top: 16px;">Resend OTP</button>';
            document.getElementById('buttonDivSignup').innerHTML = resendOtp;
          }
          if (resendOtp === "") {
            setTimeout(addResendOTPButton, count);
          }
          MainCounter();
          ResendstartCounter(count / 1000);
          return response.json();
        }
        else if (response.status === 402) {
          error.innerHTML = "Password not match"
        } else if (response.status === 403) {
          error.innerHTML = "Authorized person only"
        } else if (response.status === 405) {
          error.innerHTML = "No email found"
        }
      }).catch((error) => {
        console.error(error);
      });

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


function stockINC(Inc, prodId) {

  fetch(`stockINC?prodId=${prodId}&Inc=${Inc}`).then((response) => {
    if (response.status === 200) {
      let st = document.getElementById('Stock'+prodId)
      st.value = Number(st.value) + Number(Inc)
    } else if (response.status === 401) {
      Swal.fire({
        title: 'Cannot decrement!',
        text: 'You cannot decrement the quantity from zero .',
        icon: 'warning',
        confirmButtonText: 'OK',
        
      });
    }
    // location.reload()
  });

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


function ResendstartCounter(count) {
  try {
    let interval = setInterval(() => {
      count -= 1;
      let counter = document.getElementById('counterResend')
      if (counter) {
        counter.innerHTML = count
      }
      if (count === 0) {
        clearInterval(interval);
        document.getElementById('conterIdPtag').remove();
      }
    }, 1000);
  } catch (e) {
    console.error(e);
  }
}


document.getElementById('closeButtonOfmodal').addEventListener('click', () => window.location.reload())
