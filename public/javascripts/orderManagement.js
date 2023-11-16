

async function userDetails(user, orderId, userId) {
    this.orderId = orderId
    this.userId = userId
    let UserDiv = document.getElementById('userDetailsSECCTION')
    let prodDiv = document.getElementById('productDetailsSection')
    try {
        const response = await fetch(`orderProductDetails?orderId=${orderId}&user=${user}`);
        Data = await response.json();
        if (response.status === 200) {
            UserDiv.style.display = ''
            showElements(true, Data)
            UserDiv.scrollIntoView({ behavior: 'smooth' })
        } else if (201) {
            prodDiv.style.display = ''
            showElements(false, Data)
            prodDiv.scrollIntoView({ behavior: 'smooth' })
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


function showElements(user, Data) {
    if (user) {
        document.getElementById('FullName').innerHTML = Data.FullName
        document.getElementById('Address').innerHTML = JSON.stringify(Data.userDetails).replace(/,/g, "<br>");
        document.getElementById('userId').innerHTML = Data.userId
        document.getElementById('userTotalPrice').innerHTML = Data.TotalPrice
        document.getElementById('Date').innerHTML = Data.OrderDate
        document.getElementById('PayMtd').innerHTML = Data.PaymentMethod
    } else {
        if (Data.Returned === false && !Data.Canceled) {
            document.getElementById('Quantity').innerHTML = Data.Quantity
            document.getElementById('products').innerHTML = Data.ProdNames
            document.getElementById('status').innerHTML = Data.Status
            document.getElementById('MainStatus').innerHTML = Data.Status
            document.getElementById('totalPrice').innerHTML = Data.TotalPrice
            document.getElementById('date').innerHTML = Data.OrderDate
            document.getElementById('orderDetials').innerHTML = (Data.Notes === '') ? "No order Notes found" : Data.Notes
            document.getElementById('proId').innerHTML = (Data.prodId + "").replace(/,/g, "<br>");
            document.getElementById('cancel').innerHTML = (Data.Cancel) ? `User wants to cancel the product <button onclick="approveCancelOrder('${Data._id}')" type="button" class="btn btn-info" style="color: white; margin-left: 3%;">Approve</button>` : "No";
            document.getElementById('cancelReason').innerHTML = (Data.Cancel) ? "Reason for user to cancel order : " + Data.UserCancelReason : ''
            document.getElementById('return').innerHTML = (Data.Return) ? "User want to return the product" : 'No'
            document.getElementById('approveReturnOrder').style.display = (Data.Return) ? '' : 'none'
            document.getElementById('returnReason').innerHTML = Data.Return ? "Reason for user to return order : " + Data.UserReturnReason : ''
        } else {
            document.getElementById('productDetailsSection').innerHTML = (!Data.Canceled) ? "<h2>Product Returned</h2>" : "<h2>Product Canceled</h2>"
        }

    }
}
function showButton(value, radioBox) {
    document.getElementById('SaveButtonStatus').style.display = ''
    document.getElementById('MainStatus').innerHTML = value
    this.radioBox = radioBox.value
}
async function saveWithoutload() {
    let response = await fetch(`changeStatus?status=${this.radioBox}&id=${this.orderId}&return=''`)
    if (response.status === 200) {
        Swal.fire({
            title: 'Attention!',
            text: 'User order status changed successfully.',
            icon: 'success',
            confirmButtonText: 'Okay'
        });
    }
}

let toggle = 0

function changeButton(num, length) {
    toggle += num
    let button = document.getElementById('sendButton')
    if (toggle % 2 === 0) {
        document.getElementById('showCoupens').style.display = 'none'
        button.innerHTML = "Send Coupons"
        Swal.fire({
            title: 'Alert!',
            text: 'Coupons sented changed successfully.',
            icon: 'success',
            confirmButtonText: 'Okay'
        });
    } else {
        document.getElementById('showCoupens').style.display = ''
        button.innerHTML = "Send Now"
    }
}



function approveReturnOrder() {
    if (confirm("are you sure want to return product")) {
        fetch(`changeStatus?id=${this.orderId}&userId=${this.userId}&return=RETURN`).then((response) => {
            if (response.status === 200) {
                Swal.fire({
                    title: 'Attention!',
                    text: 'User order status changed successfully.',
                    icon: 'success',
                    confirmButtonText: 'Okay'
                }).then(() => location.reload())
            }
        })
    }
}

function approveCancelOrder(id) {
    fetch('changeStatus?status=Canceled&id=' + id).then((response) => {
        if (response.status === 200) { location.reload() }
    })
}