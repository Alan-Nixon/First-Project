


function CompleteValidate(prodIds) {
    let error = document.getElementById('errorShow')
    let errorPayment = document.getElementById('errorPayment')
    let FullName = document.getElementById('c_fname').value
    let CompanyName = document.getElementById('c_companyname').value
    let Address = document.getElementById('c_address').value
    let Appartment = document.getElementById('c_Appartment').value
    let state = document.getElementById('c_state_country').value
    let Pincode = document.getElementById('c_Pincode').value
    let Email = document.getElementById('c_email_address').value
    let Phone = document.getElementById('c_phone').value
    let Notes = document.getElementById('c_order_notes').value
    let userId = document.getElementById('userid').value
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    const paymentModeRadios = document.querySelectorAll('input[name="paymentMode"]');

    let selectedPaymentMethod = null;

    for (const radio of paymentModeRadios) {
        if (radio.checked) {
            selectedPaymentMethod = radio.value;
            break;
        }
    }

    if (FullName.length > 3) {
        if (Address.length > 10) {
            if (state.length > 3) {
                if (Pincode.length === 6 && !isNaN(Pincode)) {
                    if (emailRegex.test(Email)) {
                        if (Phone.length > 9 && Phone > 0) {
                            if (selectedPaymentMethod) {
                                sendOrder({
                                    userId: userId,
                                    prodId: prodIds,
                                    FullName: FullName,
                                    Email: Email,
                                    PaymentMethod: selectedPaymentMethod,
                                    userDetails: {
                                        CompanyName: CompanyName,
                                        Address: Address,
                                        Phone: Phone,
                                        Appartment: Appartment,
                                        state: state,
                                        Pincode: Pincode,
                                    },
                                    Notes: Notes

                                })
                            } else {
                                errorPayment.innerHTML = 'Select a payment method'
                            }
                        } else {
                            error.innerHTML = 'Enter a valid Phone Number'
                        }
                    } else {
                        error.innerHTML = 'Enter a valid Email'
                    }
                } else {
                    error.innerHTML = 'Enter a valid PINCODE'
                }
            } else {
                error.innerHTML = 'Enter a valid STATE'
            }
        } else {
            error.innerHTML = "Enter a valid Address"
        }
    } else {
        error.innerHTML = 'Enter a valid Full Name'
    }
}




function sendOrder(Data) {
    fetch('/orderCreate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Specify JSON content type
        },
        body: JSON.stringify(Data)
    }).then(response => {
        if (response.status === 200) {
            Swal.fire({
                title: 'Order Successful',
                text: 'Product will reach soon...',
                icon: 'success',
                showConfirmButton: true,
                allowOutsideClick: false, // Prevent closing on clicking outside
                confirmButtonText: 'OK',
                confirmButtonColor: '#3085d6',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/shop'
                }
            });
        } else if (response.status === 202) {
            response.json().then((Data) => {
                openPayment(Data)
            })
        } else if (response.status === 408) {
            Swal.fire({
                title: 'insufficient',
                text: 'Sorry you have insufficient balance in your account',
                icon: 'danger',
                showConfirmButton: true,
                allowOutsideClick: false, // Prevent closing on clicking outside
                confirmButtonText: 'OK',
            })
        }
    })
}

function openPayment(Order) {
    console.log(Order.id);
    var options = {
        "key": "rzp_test_2nbscQOuY7DxVd", // Enter the Key ID generated from the Dashboard
        "amount": Order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "AV shopps",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": Order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            location.href = `/thanksForOrdering?orderId=${Order.receipt}&userId=${Order.userId}&prodId=${Order.prodId}`;
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9000090000"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
    rzp1.on('payment.failed', function () {
        paymentFailed(Order.receipt, rzp1)
    })
}

function paymentFailed(orderId, rzp1) {
    rzp1.close()
    fetch(`/FailedOrder?orderId=${orderId}`).then((response) => {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Sorry the payment failed! please try again ',
            confirmButtonText: 'OK',
        })
    })
    setTimeout(() => location.reload(), 1000)
}

