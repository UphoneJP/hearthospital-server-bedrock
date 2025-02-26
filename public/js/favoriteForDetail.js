const favorite = document.querySelector(`#favorite`)
const favoriteText = document.querySelector(`#favoriteText`)

favorite.addEventListener('click', ()=>{
    axios.post(`/hospital/${review.hospital}/review/${review._id}/pushFavorite`)
    .then(response => {
        if (response.data.hasPushedFavorite) {
            favorite.classList.add('goodPushed');
            favorite.src = "/css/pictures/heart_plus.png";
            favoriteText.classList.add('text-danger');
            favoriteText.classList.remove('text-primary');
        } else {
            favorite.classList.remove('goodPushed');
            favorite.src = "/css/pictures/heart.png";
            favoriteText.classList.remove('text-danger');
            favoriteText.classList.add('text-primary');
        }
    })
    .catch(error => {
        console.error('axios error', error);  
    });
});

