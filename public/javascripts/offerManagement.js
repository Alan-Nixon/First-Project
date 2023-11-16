function deleteFrom(Top) {
    if (Top) {
        location.href = `deleteOfferFrom?from=TOP`
    } else {
        location.href = `deleteOfferFrom?from=NEW`
    }
}
function saveOffer(top, total) {
    let error = document.getElementById('error')
    if (top) {
        let topPro = document.getElementById('Top').value
        if (!isNaN(topPro) && total > topPro && topPro.length !== 0) {
            location.href = `addOfferCategory?top=true&value=${topPro}`

        } else {
            error.style.display = ''
            error.innerHTML = "Enter a valid Offer "
        }
    } else {
        let newProduct = document.getElementById('newProduct').value
        if (!isNaN(newProduct) && total > newProduct && newProduct.length !== 0) {
            location.href = `addOfferCategory?top=false&value=${newProduct}`
        } else {
            error.style.display = ''
            error.innerHTML = "Enter a valid Offer "
        }
    }
}
function prodId(id, price) {
    this.id = id
    this.price = price
    document.getElementById('addOffer').style.display = ''
}
function submitaddOffer(product) {
    let inp = document.getElementById('inpAddOffer')
    let off = Number(inp.value)
    if (off < 100 && !isNaN(inp.value) && inp.value != '' && inp.value !== undefined && inp.value > 0) {
        if (product) {
            location.href = `addOffer?prodId=${this.id}&price=${this.price}&offer=${inp.value}`
        }
    } else {
        document.getElementById('errorShow').innerHTML = "ENTER A VALID OFFER"
    }
}

function GenreOffer(proc, total) {
    let error = document.getElementById('errorGenre')
    if (proc) {
        let processerOffer = document.getElementById('PROCOFFER').value
        if (!isNaN(processerOffer) && Number(processerOffer) < Number(total) && processerOffer !== '') {
            location.href = `addOfferGenre?value=${processerOffer}&total=${total}&from=PROCESSER`
        } else {
            error.style.display = ''
            error.innerHTML = "Enter a valid offer"
        }
    } else {
        let LaptopOffer = document.getElementById('LAPTOPOFFER').value
        if (!isNaN(LaptopOffer) && Number(LaptopOffer) < total && Number(LaptopOffer) !== "") {
            location.href = `addOfferGenre?value=${LaptopOffer}&total=${total}&from=LAPTOP`
        } else {
            error.style.display = ''
            error.innerHTML = "Enter a valid offer"
        }
    }
}

function deleteGenreOffer(from) {
    if (from) {
        location.href = "deleteGenreOffer?from=true"
    } else {
        location.href = "deleteGenreOffer?from=false"
    }
}