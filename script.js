// script.js

if (!localStorage.getItem('invoices')) {
    const initialInvoices = [
        {
            id: "2026_03_FACTURE_DUPONT_J",
            formateur: "Jean Dupont",
            matiere: "Economie-Droit",
            date: "2026-03-12",
            details: [{date: "2026-03-12", heures: 4}],
            heures: 4,
            taux: 45,
            statut: "Prêt pour validation",
            netYpareoConforme: true,
            commentaireAdmin: ""
        },
        {
            id: "2026_03_FACTURE_MARTIN_S",
            formateur: "Sophie Martin",
            matiere: "Communication",
            date: "2026-03-15",
            details: [{date: "2026-03-15", heures: 7}],
            heures: 7,
            taux: 45,
            statut: "En attente d'émargement",
            netYpareoConforme: false,
            commentaireAdmin: ""
        }
    ];
    localStorage.setItem('invoices', JSON.stringify(initialInvoices));
}

function getInvoices() {
    return JSON.parse(localStorage.getItem('invoices'));
}

function saveInvoices(invoices) {
    localStorage.setItem('invoices', JSON.stringify(invoices));
}

function ajouterLigne() {
    const container = document.getElementById('lignes-facture');
    const row = document.createElement('div');
    row.className = 'ligne-cours form-group-row';
    row.innerHTML = `
        <input type="date" class="date-cours" required>
        <input type="number" class="heures-cours" placeholder="Nb d'heures" min="1" required>
        <button type="button" class="btn-danger" onclick="supprimerLigne(this)">X</button>
    `;
    container.appendChild(row);
}

function supprimerLigne(button) {
    const row = button.parentElement;
    const allRows = document.querySelectorAll('.ligne-cours');
    if (allRows.length > 1) {
        row.remove();
    } else {
        alert("Vous devez conserver au moins une ligne pour la facture.");
    }
}

function downloadPDF(id) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const invoices = getInvoices();
    const inv = invoices.find(i => i.id === id);

    if (!inv) return;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FACTURE PRESTATION - UFA St Michel", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Identifiant : ${inv.id}`, 20, 35);
    doc.text(`Formateur : ${inv.formateur}`, 20, 45);
    doc.text(`Matière : ${inv.matiere}`, 20, 55);

    doc.setFont("helvetica", "bold");
    doc.text("Détail des prestations :", 20, 70);
    
    doc.setFont("helvetica", "normal");
    let y = 80;
    if (inv.details && inv.details.length > 0) {
        inv.details.forEach(d => {
            doc.text(`- Cours du ${d.date} : ${d.heures} heure(s)`, 30, y);
            y += 10;
        });
    } else {
        doc.text(`- Cours du ${inv.date} : ${inv.heures} heure(s)`, 30, y);
        y += 10;
    }

    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text(`Total Heures : ${inv.heures} h`, 20, y);
    y += 10;
    doc.text(`Taux Horaire : ${inv.taux} €/h`, 20, y);
    y += 10;
    doc.setFontSize(14);
    doc.text(`Montant Total à payer : ${inv.heures * inv.taux} €`, 20, y);

    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 150, 0);
    doc.text(`[Signé numériquement par le formateur : ${inv.formateur}]`, 20, y);

    if (inv.statut === "Validé / En compta" || inv.statut === "Payé") {
        y += 10;
        doc.setTextColor(0, 0, 200);
        doc.text(`[Visa de l'Administration UFA : Conforme et Validé]`, 20, y);
    } else if (inv.statut === "Rejeté") {
        y += 10;
        doc.setTextColor(200, 0, 0);
        doc.text(`[Facture refusée par l'Administration UFA]`, 20, y);
    }

    doc.save(`${inv.id}.pdf`);
}

function submitInvoice(e) {
    e.preventDefault();
    const matiere = document.getElementById('matiere').value;
    const taux = document.getElementById('taux').value;
    
    const lignes = document.querySelectorAll('.ligne-cours');
    let totalHeures = 0;
    let detailsCours = [];
    
    lignes.forEach(ligne => {
        const date = ligne.querySelector('.date-cours').value;
        const heures = parseInt(ligne.querySelector('.heures-cours').value);
        totalHeures += heures;
        detailsCours.push({ date: date, heures: heures });
    });

    let invoices = getInvoices();

    const newInvoice = {
        id: `2026_04_FACTURE_USER_${Math.floor(Math.random()*1000)}`,
        formateur: "Utilisateur Courant",
        matiere: matiere,
        date: detailsCours[0].date,
        details: detailsCours,
        heures: totalHeures,
        taux: parseInt(taux),
        statut: "Prêt pour validation", 
        netYpareoConforme: true,
        commentaireAdmin: ""
    };

    invoices.push(newInvoice);
    saveInvoices(invoices);

    downloadPDF(newInvoice.id);

    alert(`Facture générée et téléchargée avec succès ! Total : ${totalHeures} heures.\nSignature numérique apposée.`);
    
    e.target.reset();
    document.getElementById('lignes-facture').innerHTML = `
        <label style="font-weight: bold; display: block; margin-bottom: 10px;">Détail des cours :</label>
        <div class="ligne-cours form-group-row">
            <input type="date" class="date-cours" required>
            <input type="number" class="heures-cours" placeholder="Nb d'heures" min="1" required>
            <button type="button" class="btn-danger" onclick="supprimerLigne(this)">X</button>
        </div>
    `;
    
    renderTables();
}

function verifyNetYpareo(id) {
    let invoices = getInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    if(invoice && invoice.statut === "En attente d'émargement") {
        alert("Interrogation de l'API NetYparéo...\nÉmargement désormais validé par le formateur sur l'ERP.");
        invoice.statut = "Prêt pour validation";
        invoice.netYpareoConforme = true;
        saveInvoices(invoices);
        renderTables();
    }
}

function signAndValidate(id) {
    let invoices = getInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    if(invoice && invoice.netYpareoConforme) {
        invoice.statut = "Validé / En compta";
        alert("Visa numérique Admin apposé.\nLe PDF est verrouillé et transféré automatiquement au service Comptabilité.");
        saveInvoices(invoices);
        renderTables();
    }
}

// NOUVELLE FONCTION : Refus de facture par l'admin
function rejectInvoice(id) {
    const raison = prompt("Veuillez indiquer la raison du refus de cette facture (sera visible par le formateur) :");
    
    if (raison !== null && raison.trim() !== "") {
        let invoices = getInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if(invoice) {
            invoice.statut = "Rejeté";
            invoice.commentaireAdmin = raison.trim();
            saveInvoices(invoices);
            alert("Facture refusée et notifiée au formateur.");
            renderTables();
        }
    } else if (raison !== null) {
        alert("Action annulée : Vous devez obligatoirement saisir un commentaire pour justifier le refus.");
    }
}

function markAsPaid(id) {
    let invoices = getInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    if(invoice) {
        invoice.statut = "Payé";
        alert("Virement déclenché. Un email de notification automatique a été envoyé au formateur.");
        saveInvoices(invoices);
        renderTables();
    }
}

function getBadgeClass(statut) {
    switch(statut) {
        case "Brouillon": return "badge-draft";
        case "En attente d'émargement": return "badge-warning";
        case "Prêt pour validation": return "badge-ready";
        case "Validé / En compta": return "badge-valid";
        case "Payé": return "badge-valid";
        case "Rejeté": return "badge-danger"; // Nouveau badge
        default: return "";
    }
}

function renderTables() {
    const invoices = getInvoices();

    // Rendu Formateur
    const tbodyFormateur = document.getElementById('tbody-formateur');
    if (tbodyFormateur) {
        tbodyFormateur.innerHTML = invoices.map(inv => `
            <tr>
                <td>${inv.id}</td>
                <td>${inv.matiere}</td>
                <td>${inv.heures} h</td>
                <td>${inv.heures * inv.taux} €</td>
                <td><span class="badge ${getBadgeClass(inv.statut)}">${inv.statut}</span></td>
                <td>${inv.netYpareoConforme ? '✅ Conforme' : '❌ Non émargé'}</td>
                <td><button class="btn-secondary btn-small" onclick="downloadPDF('${inv.id}')">📥 PDF</button></td>
                <td style="color: ${inv.statut === 'Rejeté' ? '#d32f2f' : 'inherit'}; font-weight: ${inv.statut === 'Rejeté' ? 'bold' : 'normal'};">
                    ${inv.commentaireAdmin ? inv.commentaireAdmin : '-'}
                </td>
            </tr>
        `).join('');
    }

    // Rendu Admin
    const tbodyAdmin = document.getElementById('tbody-admin');
    if (tbodyAdmin) {
        tbodyAdmin.innerHTML = invoices.filter(inv => inv.statut !== "Payé").map(inv => `
            <tr>
                <td>${inv.formateur}</td>
                <td>${inv.matiere}</td>
                <td>${inv.heures * inv.taux} €</td>
                <td><span class="badge ${getBadgeClass(inv.statut)}">${inv.statut}</span></td>
                <td>
                    <button class="btn-secondary btn-small" style="margin-bottom:5px;" onclick="downloadPDF('${inv.id}')">📥 Voir PDF</button><br>
                    ${inv.statut === "En attente d'émargement" ? 
                        `<button class="btn-warning btn-small" onclick="verifyNetYpareo('${inv.id}')">Revérifier NetYparéo</button>` : 
                        ''}
                    ${inv.statut === "Prêt pour validation" ? 
                        `<button class="btn-success btn-small" onclick="signAndValidate('${inv.id}')">✅ Valider</button>
                         <button class="btn-danger btn-small" style="margin-top:5px;" onclick="rejectInvoice('${inv.id}')">❌ Refuser</button>` : 
                        (inv.statut === "Validé / En compta" ? "Transmis à la compta" : "")}
                </td>
            </tr>
        `).join('');
    }

    // Rendu Compta
    const tbodyCompta = document.getElementById('tbody-compta');
    if (tbodyCompta) {
        tbodyCompta.innerHTML = invoices.filter(inv => inv.statut === "Validé / En compta" || inv.statut === "Payé").map(inv => `
            <tr>
                <td>📄 ${inv.id}.pdf <br><button class="btn-secondary btn-small" style="margin-top:5px;" onclick="downloadPDF('${inv.id}')">📥 Télécharger</button></td>
                <td>${inv.formateur}</td>
                <td>${inv.heures * inv.taux} €</td>
                <td>Fin de mois (cycle UFA)</td>
                <td>
                    ${inv.statut === "Validé / En compta" ? 
                        `<button class="btn-success btn-small" onclick="markAsPaid('${inv.id}')">Marquer comme Payé (Virement fait)</button>` : 
                        "✅ Virement effectué"}
                </td>
            </tr>
        `).join('');
    }
}

window.onload = renderTables;