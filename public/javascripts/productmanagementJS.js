

function nameOfimage(input) {
  let nameOfimage = document.getElementById('nameOfimage')
  nameOfimage.innerHTML = input.files[0].name

}

function displayImageOther(id) {
  let iconDown = document.getElementById('iconDown' + id)
  let ImageDiv = document.getElementById('ImageDiv' + id)
  console.log(iconDown, ImageDiv, iconDown.className);
  if (iconDown.className === "fa fa-angle-down") {
    iconDown.className = "fa fa-angle-up"
    ImageDiv.style.display = "none"
  } else {
    iconDown.className = "fa fa-angle-down"
    ImageDiv.style.display = "block"
  }
}

function MultiplenameOfimage(input) {
  const index = input.id.split('MulimageInput')[1];
  const fileNames = [];
  for (let i = 0; i < input.files.length; i++) {
    fileNames.push(input.files[i].name);
  }
  console.log(index, input.value);
  document.getElementById('nameOfimages' + index).textContent = 'Selected Files: ' + fileNames.join(', ');
}

function getData(id) {
  let images = document.getElementById('MulimageInput' + id)
  console.log(id, images.files[0]);
}

function insertValue(dropdown) {
  let Gen = document.getElementById('genOfProduct')
  document.getElementById('Genre').value = dropdown.value
  if (dropdown.value !== "Processers") {
    Gen.parentNode.removeChild(Gen);
  } else {
    let div = document.getElementById('GenDiv')
    div.innerHTML = ' <input type="text" style="margin-top: 5%;" id="genOfProduct" name="Gen" class="form-control" required placeholder="Enter the gen">'
  }
}


function openFileiconChangeCover(id) {
  let IiconChangeCover = document.getElementById('IiconChangeCover')
  let changeCoverUpdate = document.getElementById('changeCoverUpdate' + id)
  changeCoverUpdate.click()
}


function deleteOtherImage(ImageId, id, modalid) {
  fetch(`deleteotherImage?ImageId=${ImageId}&id=${id}`).then((response) => {
    console.log('#' + modalid);
    console.log(response.status);
    if (response.status === 200) {
      window.location.reload()
      setInterval(() => { $('#' + modalid).modal('show'); }, 0)
    }
  })
}

function OnChangeSave(id) {
  alert(id)
  document.getElementById('saveEditButton' + id).style.display = ''
}






let imageCoverUpdateFormid = document.getElementById('imageCoverUpdateFormid')
let OtherImage = document.getElementById('OtherImage')
let EditProName = document.getElementById('EditProName')
let EditProPrice = document.getElementById('EditProPrice')
let EditProGen = document.getElementById('EditProGen')
let EditProStock = document.getElementById('EditProStock')
let EditProDesc = document.getElementById('EditProDesc')
let ErrorUpdatePro = document.getElementById('ErrorUpdatePro')
let productUpdate = document.getElementById('productUpdate')
let coverImageEdit = document.getElementById('coverImageEdit')
let ImagesOtherId = document.getElementById('ImagesOtherId')
const prodIdForUpdate = document.getElementById('prodIdForUpdate')

function getEditProDetails(id) {
  this.id = id
  fetch('getProDetails?prodId=' + id).then((res) => res.json().then((response) => {
    if (response.product.Genre === 'Processers') {
      document.getElementById('GenUpdateProduct').style.display = ''
    EditProGen.value = response.product.Gen

    } else {
      EditProGen.value = "0000000000"

    }
    imageCoverUpdateFormid.value = response.product._id
    prodIdForUpdate.value = response.product._id
    ImagesOtherId.value = response.product._id
    EditProName.value = response.product.Name
    EditProPrice.value = response.product.Price
    EditProStock.value = response.product.Stock
    EditProDesc.value = response.product.Description
    coverImageEdit.src = '/productImages/' + response.product.CoverImage
    if (OtherImage.innerHTML.trim() === "") {
      for (let i = 0; i < response.product.Images.length; i++) {
        OtherImage.innerHTML += `<img src="/productImages/${response.product.Images[i]}" id="otherImagesImage${i}" style="width: 50px;height: 50px;margin-left: 5%;" alt="">
       <i class="fa fa-trash" style="font-size: 25px;cursor: pointer;" id="imageOtherTrash${i}" onclick="deleteSingleImage(${i})"></i>`
      }
    }
    productUpdate.style.display = ''
    setTimeout(()=>{document.getElementById('productUpdate').scrollIntoView({behavior:"smooth"})},0 )
  }))
}

async function deleteSingleImage(index) {
  let prodId = this.id
  if (confirm("are you sure want to delete the image ? ")) {
    let res = await fetch('deleteOtherImage?index=' + index + '&prodId=' + prodId, { method: 'get' })
    if (res.status === 200) {
      document.getElementById('otherImagesImage' + index).remove()
      document.getElementById('imageOtherTrash' + index).remove()
    } else if (res.status === 400) {
      location.href = '/ERROR'
    }

  }
}

function ValidateEditPro() {
  let productUpdate = document.getElementById('productUpdate')
  if (EditProName?.value?.length > 2 && EditProName?.value?.length < 15) {
    if (!isNaN(EditProPrice.value) && EditProPrice.value.length > 3 && EditProPrice.value > 0) {
      if (EditProGen.value.length > 2) {
        if (!isNaN(EditProStock.value) && EditProStock.value > -1) {
          if (EditProDesc.value.length > 3) {
            productUpdate.style.display = 'none'
            return true
          } else {
            ErrorUpdatePro.innerHTML = "Invalid Description, Enter a valid Description"
            return false
          }
        } else {
          ErrorUpdatePro.innerHTML = "Invalid stock, Enter a valid stock"
          return false
        }
      } else {
        ErrorUpdatePro.innerHTML = "Invalid Gen, Enter a valid Gen"
        return false
      }
    } else {
      ErrorUpdatePro.innerHTML = "Invalid Price, Enter a valid price"
      return false
    }
  } else {
    ErrorUpdatePro.innerHTML = "Invalid Name, Enter a Valid product Name"
    return false
  }

}


let ForcroppedImage = null
function showResult() {
  document.getElementById('result').style.display = ''
  document.getElementById('saveCropped').style.display = ""
  document.getElementById('textToo').style.display = ""
}


function insertImage() {
  // Retrieve the cropped image data URI
  var croppedImage = ForcroppedImage

  // Convert the data URI to a Blob
  var byteString = atob(croppedImage.split(',')[1]);
  var mimeString = croppedImage.split(',')[0].split(':')[1].split(';')[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], { type: mimeString });

  // Create a Blob URL
  var blobUrl = URL.createObjectURL(blob);

  // Set the image as the source of the image input
  var imageInput = document.getElementById('imageInput');
  imageInput.src = blobUrl;
  alert(blobUrl)

  var downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = blobUrl; // Set the filename
  downloadLink.click();
}


function initializeCropper(imageURL) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  // Initialize the Cropper instance
  var cropper = new Cropper(canvas, {
    aspectRatio: 4 / 3, // Set the aspect ratio
    viewMode: 1, // Set the view mode
  });

  var image = new Image();
  image.src = imageURL;

  image.onload = function () {
    context.canvas.height = image.height;
    context.canvas.width = image.width;
    context.drawImage(image, 0, 0);
    cropper.replace(imageURL);
  };

  // Handle the "Crop" button click
  document.getElementById('btnCrop').addEventListener('click', function () {
    var croppedImage = cropper.getCroppedCanvas().toDataURL('image/png');
    var resultContainer = document.getElementById('result');
    document.getElementById('imageTag').src = croppedImage
    ForcroppedImage = croppedImage
  });

  // Handle the "Restore" button click
  document.getElementById('btnRestore').addEventListener('click', function () {
    cropper.reset();
    var resultContainer = document.getElementById('result');
    resultContainer.innerHTML = '';
  });
}


document.getElementById('imageInput').addEventListener('change', function (e) {
  document.getElementById('buttotnSaveReset').style.display = ""
  var file = e.target.files[0];
  if (file && file.type.match(/^image\//)) {
    var reader = new FileReader();
    reader.onload = function (e) {
      initializeCropper(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    alert('Invalid file type! Please select an image file.');
  }
});
