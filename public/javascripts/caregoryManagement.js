let body = {}

    function deleteBrand(category, Brand) {
      let yes = confirm("Are you sure want to delete this brand")
      if (yes) {
        window.location.href = `BrandDelete?category=${category}&Brand=${Brand}`
      } else {
        return false
      }
    }

    function displayForm() {
      document.getElementById('displayForm').style.display = "flex"
    }
    function addBrand(category) {
      document.getElementById('Categories').value = category
      document.getElementById('showBrands').style.display = ''
    }


    function deleteCategory(category) {
      let password = prompt("Enter the password");
      window.location.href = `checkPasswordDel?password=${password}&category=${category}`
    }

    function showFormTopBrands(TopBrands, prodId) {
      location.href = `addTopBrands?to=${TopBrands}&prodId=${prodId}`

      // if (id !== false) {
      //   body.id = id
      // }
      // if (TopBrands === 1) {
      //   document.getElementById('showFormTwoforms').style.display = ''
      //   body.NewProduct = false
      //   body.TopBrands = true
      //   body.FromPath = true
      // } else if (TopBrands === 0) {
      //   document.getElementById('showFormTwoforms').style.display = ''
      //   body.NewProduct = true
      //   body.TopBrands = false
      //   body.FromPath = false
      // } else {
      //   body.DiscountedPrice = document.getElementById('DiscountedPrice').value
      //   body.Rating = document.getElementById('selectNumber').value
      //   fetch('addTopBrands', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json', // Set the content type to JSON
      //     },
      //     body: JSON.stringify(body),
      //   }).then((response) => {
      //     if (response) {
      //       window.location.reload()
      //     }
      //   })
      // }

    }


    function deleteFromcategory(from,id) {location.href = `deleteCategory?from=${from}&prodId=${id}`}