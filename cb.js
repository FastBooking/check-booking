document.getElementById('queryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const birthYear = document.getElementById('birthYear').value;
    const submitBtn = document.querySelector('.submit-btn');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '查詢中...';
    
    try {
        const recaptchaToken = await grecaptcha.execute('6LegcUEsAAAAAJeTDvIPSziY4RRM91OPJ83LmlJo', {action: 'submit'});

        const response = await fetch('https://hm6626.app.n8n.cloud/webhook/check-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                birthYear: birthYear,
                action: 'query_appointment',
                recaptchaToken: recaptchaToken
            })
        });
        
        if (!response.ok) {
            throw new Error('查詢失敗,請稍後再試');
        }
        
        const data = await response.json();
        

        displayResults(data, phone, birthYear);
        
    } catch (error) {
        alert('查詢時發生錯誤:' + error.message);
        console.error('Error:', error);
    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = '送出查詢';
    }
});

function displayResults(data, phone, birthYear) {
    

    let resultDiv = document.getElementById('resultDisplay');
    if (!resultDiv) {
        resultDiv = document.createElement('div');
        resultDiv.id = 'resultDisplay';
        document.querySelector('.card-body').appendChild(resultDiv);
    }
    

    if (data && data.error) {
        resultDiv.innerHTML = `
            <h3>查詢結果</h3>
            <div class="warning-message">
                <p>${data.error}</p>
            </div>
        `;
        return;
    }
    

    if (Array.isArray(data) && data.length > 0 && data[0].error) {
        resultDiv.innerHTML = `
            <h3>查詢結果</h3>
            <div class="warning-message">
                <p>${data[0].error}</p>
            </div>
        `;
        return;
    }
    

    const appointments = Array.isArray(data) ? data : [data];
    

    let htmlContent = '<h3>查詢結果</h3>';
    
    appointments.forEach((appointment, index) => {
        const bookingCode = appointment.預約碼 || '';
        htmlContent += `
            <div class="appointment-card">
                <h4>預約 ${index + 1}</h4>
                <div class="appointment-grid">
                    ${appointment.預約日期 ? `
                        <div>預約日期:</div>
                        <div>${appointment.預約日期}</div>
                    ` : ''}
                    ${appointment.開始時間 ? `
                        <div>開始時間:</div>
                        <div>${appointment.開始時間}</div>
                    ` : ''}
                    ${appointment.結束時間 ? `
                        <div>結束時間:</div>
                        <div>${appointment.結束時間}</div>
                    ` : ''}
                    ${appointment.醫師 ? `
                        <div>醫師:</div>
                        <div>${appointment.醫師}</div>
                    ` : ''}
                    ${appointment.諮詢師 ? `
                        <div>諮詢師:</div>
                        <div>${appointment.諮詢師}</div>
                    ` : ''}
                    ${appointment.服務項目 ? `
                        <div>服務項目:</div>
                        <div>${appointment.服務項目}</div>
                    ` : ''}
                    ${appointment.分店 ? `
                        <div>分店:</div>
                        <div>${appointment.分店}</div>
                    ` : ''}
                    ${appointment.預約碼 ? `
                        <div>預約碼:</div>
                        <div>${appointment.預約碼}</div>
                    ` : ''}
                </div>
                <div class="action-buttons">
                    <button class="modify-btn" onclick='modifyBooking(${JSON.stringify(appointment)})'>更改預約</button>
                    <button class="cancel-btn" onclick="cancelBooking('${phone}', '${bookingCode}', '${birthYear}')">取消預約</button>
                </div>
            </div>
        `;
    });
    
    resultDiv.innerHTML = htmlContent;
}

function modifyBooking(appointment) {
    if (!confirm('確定要更改此預約嗎?')) {
        return;
    }

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const birthYear = document.getElementById('birthYear').value;
    

    const params = new URLSearchParams();
    params.append('姓名', name);
    if (appointment.稱謂) params.append('請問如何稱呼您', appointment.稱謂);
    params.append('連絡電話', phone);
    params.append('出生年份', birthYear);
    if (appointment.之前是否來過本院) params.append('之前是否來過本院', appointment.之前是否來過本院);
    if (appointment.分店) params.append('分店', appointment.分店);
    if (appointment.預約日期) params.append('預約日期', appointment.預約日期);
    if (appointment.開始時間) params.append('開始時間', appointment.開始時間);
    if (appointment.服務項目) params.append('服務項目', appointment.服務項目);
    if (appointment.諮詢師) params.append('諮詢師', appointment.諮詢師);
    if (appointment.醫師) params.append('醫師', appointment.醫師);   
    if (appointment.預約碼) params.append('預約碼', appointment.預約碼);


    const bookingUrl = `https://fastbooking.github.io/booking/?${params.toString()}`;
    

    window.open(bookingUrl, '_blank');
}

async function cancelBooking(phone, bookingCode, birthYear) {

    const appointmentCards = document.querySelectorAll('.appointment-card');
    let appointmentDate = '';
    let targetCard = null;
    
    appointmentCards.forEach(card => {

        const gridDiv = card.querySelector('.appointment-grid');
        if (gridDiv) {
            const allDivs = gridDiv.querySelectorAll('div');
            for (let i = 0; i < allDivs.length; i++) {
                if (allDivs[i].textContent.includes('預約碼:') && allDivs[i + 1]) {
                    const code = allDivs[i + 1].textContent.trim();
                    if (code === bookingCode) {
                        targetCard = card;

                        for (let j = 0; j < allDivs.length; j++) {
                            if (allDivs[j].textContent.includes('預約日期:') && allDivs[j + 1]) {
                                appointmentDate = allDivs[j + 1].textContent.trim();
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
    });
    
    if (!confirm(`確定要取消此預約嗎?此操作無法復原。`)) {
        return;
    }
    
    try {
        const response = await fetch('https://hm6626.app.n8n.cloud/webhook/cancel-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phone,
                bookingCode: bookingCode,
                birthYear: birthYear,
                appointmentDate: appointmentDate,
                action: 'cancel'
            })
        });
        
        const result = await response.json();
        console.log('Cancel result:', result);
        
        if (response.ok) {

            if (targetCard) {
                targetCard.style.transition = 'opacity 0.3s';
                targetCard.style.opacity = '0';
                setTimeout(() => {
                    targetCard.remove();
                    

                    const remainingCards = document.querySelectorAll('.appointment-card');
                    if (remainingCards.length === 0) {
                        const resultDiv = document.getElementById('resultDisplay');
                        if (resultDiv) {
                            const successMsg = result.success || (Array.isArray(result) && result[0]?.success) || '所有預約已取消';
                            resultDiv.innerHTML = `
                                <h3>查詢結果</h3>
                                <div class="success-message">
                                    <p>${successMsg}</p>
                                </div>
                            `;
                        }
                    }
                }, 300);
            }
        } else {
            const errorMsg = result.error || (Array.isArray(result) && result[0]?.error) || '取消失敗,請稍後再試';
            alert(errorMsg);
        }
    } catch (error) {
        alert('取消時發生錯誤:' + error.message);
        console.error('Error:', error);
    }
}

