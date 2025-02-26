// good button
reviews.forEach((review,index) =>{
    const icon = document.querySelector(`#icon${index}`)
    const iconText = document.querySelector(`#iconText${index}`);
    const goodCounter = document.querySelector(`#goodCounter${index}`);

    icon.addEventListener('click', ()=>{
        axios.post(`/hospital/${hospital._id}/review/${review._id}/countHeart`)
        .then(response => {
            if (response.data.success) {
                goodCounter.textContent = response.data.goodCount;
                if (response.data.hasPushedGood) {
                    icon.classList.add('goodPushed');
                    icon.src = "/css/pictures/thumb_up_red.png";
                    iconText.classList.add('text-danger');
                    iconText.classList.remove('text-primary');
                    goodCounter.classList.add('bg-danger');
                    goodCounter.classList.remove('bg-primary-subtle');
                } else {
                    icon.classList.remove('goodPushed');
                    icon.src = "/css/pictures/thumb_up.png";
                    iconText.classList.remove('text-danger');
                    iconText.classList.add('text-primary');
                    goodCounter.classList.remove('bg-danger');
                    goodCounter.classList.add('bg-primary-subtle');
                }
            } else {
                console.error('Failed to update good count:', response.data.error);
            }
        })
        .catch(error => {
            console.error('Error updating good count:', error);  
        });
    });

    // レスのグッドボタンの設定
    review.responses.filter(response => response.ownerCheck).sort((a, b)=>b.goodPushedUser.filter(user=>!user.isDeleted).length - a.goodPushedUser.filter(user=>!user.isDeleted).length).forEach((response, i) =>{
        const responseIcon = document.querySelector(`#response${index}Icon${i}`)
        const responseText = document.querySelector(`#responseText${index}Icon${i}`)
        const responseGoodCounter = document.querySelector(`#response${index}GoodCounter${i}`);

        responseIcon.addEventListener('click', ()=>{
            axios.post(`/hospital/${review.hospital}/review/${review._id}/${response._id}`)
            .then(res => {
                if (res.data.success) {
                    responseGoodCounter.textContent = res.data.goodCount;
                    if (res.data.hasPushedGood) {
                        responseIcon.classList.add('goodPushed');
                        responseIcon.src = "/css/pictures/thumb_up_red.png";
                        responseText.classList.add('text-danger');
                        responseText.classList.remove('text-primary');
                        responseGoodCounter.classList.add('text-danger');
                    } else {
                        responseIcon.classList.remove('goodPushed');
                        responseIcon.src = "/css/pictures/thumb_up.png";
                        responseText.classList.remove('text-danger');
                        responseText.classList.add('text-primary');
                        responseGoodCounter.classList.remove('text-danger');
                    }
                } else {
                    console.error('Failed to update good count:', res.data.error);
                }
            })
            .catch(error => {
                console.error('Error updating good count:', error);  
            });
        });
    });
});
