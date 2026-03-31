const cvData = {
    personal: {},
    experience: [],
    education: [],
    skills: []
};

function addExperience() {
    const id = Date.now();
    const html = `
        <div class="experience-item" data-id="${id}">
            <input type="text" placeholder="Puesto" class="input-field exp-title" data-id="${id}">
            <input type="text" placeholder="Empresa" class="input-field exp-company" data-id="${id}">
            <input type="text" placeholder="Fecha inicio (ej: 2020)" class="input-field exp-start" data-id="${id}">
            <input type="text" placeholder="Fecha fin (ej: 2023)" class="input-field exp-end" data-id="${id}">
            <textarea placeholder="Descripción (achievements y logros)" class="input-field exp-description" data-id="${id}" rows="4"></textarea>
            <button type="button" class="btn-coach-help" onclick="getCoachTip('experience')">💡 Optimizar</button>
            <button type="button" onclick="removeExperience(${id})" style="background: #ef4444; color: white; width: 100%; margin-top: 10px; padding: 10px; border: none; border-radius: 6px; cursor: pointer;">✕ Eliminar</button>
        </div>
    `;
    document.getElementById('experienceList').insertAdjacentHTML('beforeend', html);
}

function removeExperience(id) {
    const element = document.querySelector(`.experience-item[data-id="${id}"]`);
    if (element) element.remove();
}

function addEducation() {
    const id = Date.now();
    const html = `
        <div class="education-item" data-id="${id}">
            <input type="text" placeholder="Carrera/Certificado" class="input-field edu-title" data-id="${id}">
            <input type="text" placeholder="Universidad/Institución" class="input-field edu-institution" data-id="${id}">
            <input type="text" placeholder="Año de graduación" class="input-field edu-year" data-id="${id}">
            <button type="button" onclick="removeEducation(${id})" style="background: #ef4444; color: white; width: 100%; padding: 10px; border: none; border-radius: 6px; cursor: pointer;">✕ Eliminar</button>
        </div>
    `;
    document.getElementById('educationList').insertAdjacentHTML('beforeend', html);
}

function removeEducation(id) {
    const element = document.querySelector(`.education-item[data-id="${id}"]`);
    if (element) element.remove();
}

function gatherCVData() {
    cvData.personal = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        website: document.getElementById('website').value,
        summary: document.getElementById('summary').value
    };

    cvData.experience = [];
    document.querySelectorAll('.experience-item').forEach(item => {
        cvData.experience.push({
            title: item.querySelector('.exp-title').value,
            company: item.querySelector('.exp-company').value,
            start: item.querySelector('.exp-start').value,
            end: item.querySelector('.exp-end').value,
            description: item.querySelector('.exp-description').value
        });
    });

    cvData.education = [];
    document.querySelectorAll('.education-item').forEach(item => {
        cvData.education.push({
            title: item.querySelector('.edu-title').value,
            institution: item.querySelector('.edu-institution').value,
            year: item.querySelector('.edu-year').value
        });
    });

    cvData.skills = document.getElementById('skillsInput').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
}

function renderCVPreview() {
    gatherCVData();
    
    let html = `
        <div class="cv-container">
            <div class="cv-header">
                <h1>${cvData.personal.fullName || 'Tu Nombre'}</h1>
                <div class="cv-contact">
                    ${cvData.personal.email ? `<span>📧 ${cvData.personal.email}</span>` : ''}
                    ${cvData.personal.phone ? `<span>📱 ${cvData.personal.phone}</span>` : ''}
                    ${cvData.personal.location ? `<span>📍 ${cvData.personal.location}</span>` : ''}
                    ${cvData.personal.website ? `<span>🌐 ${cvData.personal.website}</span>` : ''}
                </div>
            </div>
    `;

    if (cvData.personal.summary) {
        html += `
            <div class="cv-section">
                <h3>PERFIL PROFESIONAL</h3>
                <p>${cvData.personal.summary}</p>
            </div>
        `;
    }

    if (cvData.experience.length > 0) {
        html += `<div class="cv-section"><h3>EXPERIENCIA LABORAL</h3>`;
        cvData.experience.forEach(exp => {
            html += `
                <div class="cv-item">
                    <div class="cv-title">
                        <strong>${exp.title}</strong>
                        <span class="cv-date">${exp.start} - ${exp.end}</span>
                    </div>
                    <div class="cv-company">${exp.company}</div>
                    <div class="cv-description">${exp.description}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    if (cvData.education.length > 0) {
        html += `<div class="cv-section"><h3>EDUCACIÓN</h3>`;
        cvData.education.forEach(edu => {
            html += `
                <div class="cv-item">
                    <div class="cv-title">
                        <strong>${edu.title}</strong>
                        <span class="cv-date">${edu.year}</span>
                    </div>
                    <div class="cv-company">${edu.institution}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    if (cvData.skills.length > 0) {
        html += `
            <div class="cv-section">
                <h3>HABILIDADES</h3>
                <div class="skills-list">${cvData.skills.join(' • ')}</div>
            </div>
        `;
    }

    html += `</div>`;
    document.getElementById('cvPreview').innerHTML = html;
}
