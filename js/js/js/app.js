document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
        });
        
        document.getElementById(tabName).classList.add('active');
        this.classList.add('active');
    });
});

document.addEventListener('input', renderCVPreview);
document.addEventListener('change', renderCVPreview);

renderCVPreview();

function downloadPDF() {
    const element = document.getElementById('cvPreview');
    const opt = {
        margin: 10,
        filename: 'CV_' + (cvData.personal.fullName || 'CV') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

function downloadDOCX() {
    gatherCVData();
    
    const { Document, Packer, Paragraph, TextRun } = window.docx;
    
    const sections = [
        new Paragraph({
            text: cvData.personal.fullName || 'CV',
            bold: true,
            size: 56
        }),
        new Paragraph({
            text: `${cvData.personal.email} | ${cvData.personal.phone} | ${cvData.personal.location}`,
            size: 24
        })
    ];

    if (cvData.personal.summary) {
        sections.push(new Paragraph({ text: 'PERFIL PROFESIONAL', bold: true, size: 28 }));
        sections.push(new Paragraph(cvData.personal.summary));
    }

    if (cvData.experience.length > 0) {
        sections.push(new Paragraph({ text: 'EXPERIENCIA LABORAL', bold: true, size: 28 }));
        cvData.experience.forEach(exp => {
            sections.push(new Paragraph({ text: exp.title, bold: true }));
            sections.push(new Paragraph({ text: exp.company, italics: true }));
            sections.push(new Paragraph(exp.description));
        });
    }

    if (cvData.education.length > 0) {
        sections.push(new Paragraph({ text: 'EDUCACIÓN', bold: true, size: 28 }));
        cvData.education.forEach(edu => {
            sections.push(new Paragraph({ text: edu.title, bold: true }));
            sections.push(new Paragraph(edu.institution));
        });
    }

    const doc = new Document({ sections: [{ children: sections }] });
    
    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CV_' + (cvData.personal.fullName || 'CV') + '.docx';
        a.click();
    });
}

function printCV() {
    window.print();
}
