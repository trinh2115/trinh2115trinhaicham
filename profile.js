// Avatar upload & remove responsive JS
const btnUploadAvatar = document.getElementById('btnUploadAvatar');
const btnRemoveAvatar = document.getElementById('btnRemoveAvatar');
const avatarInput = document.getElementById('avatarInput');
const profileAvatar = document.querySelector('.profile-avatar i');

if (btnUploadAvatar && avatarInput && profileAvatar) {
    btnUploadAvatar.addEventListener('click', () => {
        avatarInput.click();
    });
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                profileAvatar.style.background = `url('${evt.target.result}') center/cover no-repeat`;
                profileAvatar.style.color = 'transparent';
                profileAvatar.style.borderRadius = '50%';
            };
            reader.readAsDataURL(file);
        }
    });
}
if (btnRemoveAvatar && profileAvatar) {
    btnRemoveAvatar.addEventListener('click', () => {
        profileAvatar.style.background = '';
        profileAvatar.style.color = '';
        profileAvatar.style.borderRadius = '';
        if (avatarInput) avatarInput.value = '';
    });
}